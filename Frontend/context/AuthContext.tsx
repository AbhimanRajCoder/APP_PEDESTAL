import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextProps {
    session: any | null;
    profile: any | null;
    loading: boolean;
    profileLoading: boolean;
    onboardingCompleted: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string; onboardingCompleted: boolean }>;
    signUp: (email: string, password: string, displayName?: string) => Promise<{ data?: any, error?: string }>;
    signInWithGoogle: () => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true); // Start as true to prevent premature navigation
    const initializedRef = useRef(false);
    const profileFetchRef = useRef<string | null>(null); // Track which UID is being fetched to prevent duplicates

    const fetchProfile = async (uid: string) => {
        // Prevent duplicate concurrent fetches for the same user
        if (profileFetchRef.current === uid) return;
        profileFetchRef.current = uid;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('auth_uid', uid)
                .maybeSingle();

            if (data) {
                setProfile(data);
            } else if (error) {
                console.warn('Error fetching profile:', error);
            }
        } catch (e) {
            console.error('Auth Profile Fetch Error:', e);
        } finally {
            profileFetchRef.current = null;
            setProfileLoading(false);
        }
    };

    // Single combined initialization: set up listener first, then get initial session
    useEffect(() => {
        // Set up the auth state change listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            // Skip the INITIAL_SESSION event — we handle that manually below
            // This prevents the double-fetch race condition
            if (!initializedRef.current) return;

            console.log('[Auth] State change event:', event);
            setSession(newSession);
            if (newSession?.user?.id) {
                await fetchProfile(newSession.user.id);
            } else {
                setProfile(null);
                setProfileLoading(false);
            }
        });

        // Then get the initial session
        const init = async () => {
            try {
                const { data: { session: storedSession } } = await supabase.auth.getSession();
                setSession(storedSession);
                if (storedSession?.user?.id) {
                    await fetchProfile(storedSession.user.id);
                } else {
                    setProfileLoading(false);
                }
            } catch (e) {
                console.error('[Auth] Init error:', e);
                setProfileLoading(false);
            } finally {
                // Mark initialization complete BEFORE setting loading to false
                initializedRef.current = true;
                setLoading(false);
            }
        };

        init();

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message, onboardingCompleted: false };

        // Eagerly fetch profile so caller can navigate immediately
        const userId = data?.user?.id;
        if (userId) {
            setSession(data.session);
            try {
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('auth_uid', userId)
                    .maybeSingle();

                if (profileData) {
                    setProfile(profileData);
                    return { error: undefined, onboardingCompleted: !!profileData.onboarding_completed };
                }
            } catch (e) {
                console.warn('[Auth] Profile fetch in signIn failed:', e);
            }
        }
        return { error: undefined, onboardingCompleted: false };
    };

    const signUp = async (email: string, password: string, displayName?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                }
            }
        });

        if (data?.user && !error) {
            // Also ensure profile exists with the name
            try {
                await supabase.from('user_profiles').upsert({
                    auth_uid: data.user.id,
                    display_name: displayName || email.split('@')[0],
                    email: email,
                }, { onConflict: 'auth_uid' });
            } catch (e) {
                console.warn('Silent profile creation failed on signup:', e);
            }
        }

        return { data, error: error?.message };
    };

    const signInWithGoogle = async () => {
        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'pedestal',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: Platform.OS !== 'web',
                }
            });

            if (error) return { error: error.message };

            if (!data?.url) return { error: 'No authorization URL returned' };

            if (Platform.OS === 'web') return { error: undefined };

            const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

            if (res.type === 'success') {
                const { url } = res;
                const { params, errorCode } = QueryParams.getQueryParams(url);

                if (errorCode) return { error: errorCode };

                const { access_token, refresh_token } = params;
                if (!access_token || !refresh_token) {
                    return { error: 'No access token returned from URL' };
                }

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });

                if (sessionError) {
                    return { error: sessionError.message };
                }
                return { error: undefined };
            } else {
                return { error: 'Google sign-in cancelled or failed' };
            }
        } catch (e: any) {
            return { error: e.message || 'An error occurred during sign in' };
        }
    };

    const signOut = async () => {
        try {
            // Attempt to sign out from Supabase (this clears tokens)
            await supabase.auth.signOut();
        } catch (e) {
            console.error('[Auth] Supabase signOut error:', e);
        } finally {
            // ALWAYS clear our local state regardless of whether the server call succeeded.
            // This is crucial for fixing cases where the device is offline or the token is already expired.
            setSession(null);
            setProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (session?.user?.id) {
            profileFetchRef.current = null; // Reset to allow re-fetch
            await fetchProfile(session.user.id);
        }
    };

    const onboardingCompleted = !!profile?.onboarding_completed;

    return (
        <AuthContext.Provider value={{
            session,
            profile,
            loading,
            profileLoading,
            onboardingCompleted,
            signIn,
            signUp,
            signInWithGoogle,
            signOut,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
