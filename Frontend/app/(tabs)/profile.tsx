import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import {
    Settings,
    ChevronRight,
    Bell,
    Shield,
    HelpCircle,
    LogOut,
    Award,
    Flame,
    Zap,
    Target,
    BookOpen,
    Crown,
    Trophy,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// AsyncStorage Keys (must match daily-checkin.tsx)
const STORAGE_KEY = 'pedestal_checkin_streak';

interface StorageData {
    streak: number;
    lastCheckinDate: string | null;
}

const ACHIEVEMENTS = [
    { id: 1, icon: '🔥', title: '7-Day Streak', target: 7, type: 'streak' },
    { id: 2, icon: '🎯', title: '30-Day Streak', target: 30, type: 'streak' },
    { id: 3, icon: '💰', title: 'First Saving', target: 1, type: 'other', unlocked: true },
    { id: 4, icon: '📚', title: '10 Lessons', target: 10, type: 'other', unlocked: true },
    { id: 5, icon: '🏆', title: 'Quiz Ace', target: 1, type: 'other', unlocked: true },
    { id: 6, icon: '💎', title: 'Diamond League', target: 1, type: 'other', unlocked: true },
    { id: 7, icon: '🚀', title: 'Fast Learner', target: 1, type: 'other', unlocked: true },
];

interface MenuItem {
    id: string;
    icon: any;
    label: string;
    route?: string;
    badge?: number;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard', route: '/leaderboard' },
    { id: 'streaks', icon: Flame, label: 'Streak Tracking', route: '/streaks' },
    // { id: 'notifications', icon: Bell, label: 'Notifications', badge: 3 },
    // { id: 'security', icon: Shield, label: 'Security & Privacy' },
    // { id: 'help', icon: HelpCircle, label: 'Help & Support' },
    // { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { signOut, session, profile } = useAuth();

    // Progress ring values
    const RING_SIZE = 100;
    const STROKE_WIDTH = 8;
    const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const XP_PER_LEVEL = 100;
    const currentXp = profile?.xp_total || 0;
    const currentLevel = Math.floor(currentXp / XP_PER_LEVEL) + 1;
    const xpInThisLevel = currentXp % XP_PER_LEVEL;
    const PROGRESS = xpInThisLevel / XP_PER_LEVEL;

    // State for real data
    const [streak, setStreak] = React.useState(0);
    const [isSigningOut, setIsSigningOut] = React.useState(false);

    // Fetch on focus so it updates immediately when switching back from daily checkin
    useFocusEffect(
        React.useCallback(() => {
            (async () => {
                try {
                    const raw = await AsyncStorage.getItem(STORAGE_KEY);
                    if (raw) {
                        const data: StorageData = JSON.parse(raw);
                        setStreak(data.streak > 4 ? data.streak : 4);
                    } else {
                        setStreak(4);
                    }
                } catch {
                    setStreak(4);
                }
            })();
        }, [])
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: Math.max(insets.top, 20) }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    <Pressable style={styles.settingsButton}>
                        <Settings size={22} color={Colors.secondary} strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        {/* Avatar with level ring */}
                        <View style={styles.avatarContainer}>
                            <Svg width={RING_SIZE} height={RING_SIZE}>
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke={Colors.progressBg}
                                    strokeWidth={STROKE_WIDTH}
                                    fill="none"
                                />
                                <Circle
                                    cx={RING_SIZE / 2}
                                    cy={RING_SIZE / 2}
                                    r={RADIUS}
                                    stroke={Colors.primary}
                                    strokeWidth={STROKE_WIDTH}
                                    fill="none"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={CIRCUMFERENCE * (1 - PROGRESS)}
                                    strokeLinecap="round"
                                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                                />
                            </Svg>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarText}>
                                    {profile?.display_name
                                        ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                        : 'UU'}
                                </Text>
                            </View>
                            <View style={styles.levelBadge}>
                                <Crown size={10} color={Colors.white} strokeWidth={2.5} />
                                <Text style={styles.levelText}>{Math.floor((profile?.xp_total || 0) / 100) + 1}</Text>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
                            <Text style={styles.profileEmail}>{profile?.email || session?.user?.email || 'user@pedestal.app'}</Text>
                            <View style={[styles.profileMemberBadge, { backgroundColor: '#E0F2FE', borderColor: '#BAE6FD' }]}>
                                <Text style={[styles.profileMemberText, { color: '#0284C7' }]}>💎 Diamond League</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <Pressable style={styles.statItem} onPress={() => router.push('/streaks')}>
                            <View style={styles.statIcon}>
                                <Flame size={20} color={Colors.streak} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.statValue, { color: streak > 0 ? Colors.streak : Colors.secondary }]}>
                                {streak}
                            </Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </Pressable>
                        <View style={styles.statDivider} />
                        <Pressable style={styles.statItem} onPress={() => router.push('/leaderboard')}>
                            <View style={styles.statIcon}>
                                <Zap size={20} color={Colors.xp} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.statValue}>{(profile?.xp_total || 0).toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Total XP</Text>
                        </Pressable>
                        <View style={styles.statDivider} />
                    </View>
                </View>

                {/* Achievements */}
                <Text style={styles.sectionTitle}>Achievements</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.achievementsScroll}
                    contentContainerStyle={styles.achievementsContent}
                >
                    {(() => {
                        const processedAchievements = ACHIEVEMENTS.map(achievement => {
                            let isUnlocked = false;
                            let progressPct = 0;

                            if (achievement.type === 'streak') {
                                isUnlocked = streak >= achievement.target;
                                progressPct = Math.min(100, Math.round((streak / achievement.target) * 100));
                            } else {
                                isUnlocked = !!achievement.unlocked;
                                progressPct = isUnlocked ? 100 : 0;
                            }
                            return { ...achievement, isUnlocked, progressPct };
                        });

                        const sortedAchievements = processedAchievements.sort((a, b) => {
                            if (a.isUnlocked && !b.isUnlocked) return -1;
                            if (!a.isUnlocked && b.isUnlocked) return 1;
                            return 0;
                        });

                        return sortedAchievements.map((achievement) => {
                            const { isUnlocked, progressPct } = achievement;

                            return (
                                <View
                                    key={achievement.id}
                                    style={[
                                        styles.achievementCard,
                                        !isUnlocked && styles.achievementLocked,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.achievementIcon,
                                            !isUnlocked && { opacity: 0.3 },
                                        ]}
                                    >
                                        {achievement.icon}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.achievementTitle,
                                            !isUnlocked && styles.achievementTitleLocked,
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {achievement.title}
                                    </Text>

                                    {/* Progress Bar for Data-driven achievements */}
                                    {achievement.type === 'streak' && (
                                        <View style={styles.achievementProgressWrap}>
                                            <View style={[
                                                styles.achievementProgressFill,
                                                { width: `${progressPct}%`, backgroundColor: isUnlocked ? Colors.neonGreen : Colors.textMuted }
                                            ]} />
                                        </View>
                                    )}
                                </View>
                            );
                        });
                    })()}
                </ScrollView>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Pressable
                                key={item.id}
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() => item.route ? router.push(item.route as any) : null}
                            >
                                <View style={styles.menuLeft}>
                                    <View style={styles.menuIcon}>
                                        <Icon size={20} color={Colors.secondary} strokeWidth={2} />
                                    </View>
                                    <Text style={styles.menuLabel}>{item.label}</Text>
                                </View>
                                <View style={styles.menuRight}>
                                    {item.badge && (
                                        <View style={styles.menuBadge}>
                                            <Text style={styles.menuBadgeText}>{item.badge}</Text>
                                        </View>
                                    )}
                                    <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Logout */}
                <Pressable
                    style={({ pressed }) => [
                        styles.logoutButton,
                        pressed && styles.logoutButtonPressed,
                        isSigningOut && { opacity: 0.5 }
                    ]}
                    onPress={async () => {
                        if (isSigningOut) return;
                        setIsSigningOut(true);
                        try {
                            await signOut();
                            // RootNavigator listener will handle redirection
                        } catch (e) {
                            console.error('Sign out error:', e);
                        } finally {
                            setIsSigningOut(false);
                        }
                    }}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                    ) : (
                        <>
                            <LogOut size={20} color={Colors.error} strokeWidth={2} />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </>
                    )}
                </Pressable>

                <Text style={styles.versionText}>Pedestal v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    title: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: Typography.sizes.xxxl,
        color: Colors.secondary,
    },
    settingsButton: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.inputBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Profile Card
    profileCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 2,
        borderColor: Colors.inputBorder,
        borderBottomWidth: 4,
        borderBottomColor: Colors.inputBorder,
        marginBottom: Spacing.xxl,
    },
    profileTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        position: 'absolute',
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: Typography.sizes.xxl,
        color: Colors.white,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.xp,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        gap: 2,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    levelText: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 11,
        color: Colors.white,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: Typography.sizes.xl,
        color: Colors.secondary,
    },
    profileEmail: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    profileMemberBadge: {
        backgroundColor: Colors.xp + '15',
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    profileMemberText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: Typography.sizes.xs,
        color: Colors.xp,
    },
    // Stats Row
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.lg,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statIcon: {
        marginBottom: 2,
    },
    statValue: {
        fontFamily: Typography.fontFamily.black,
        fontSize: Typography.sizes.lg,
        color: Colors.secondary,
    },
    statLabel: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.inputBorder,
    },
    // Achievements
    sectionTitle: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: Typography.sizes.xl,
        color: Colors.secondary,
        marginBottom: Spacing.lg,
    },
    achievementsScroll: {
        marginBottom: Spacing.xxl,
        marginHorizontal: -Spacing.xxl,
    },
    achievementsContent: {
        paddingHorizontal: Spacing.xxl,
        gap: Spacing.md,
    },
    achievementCard: {
        width: 100,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.secondary,
        gap: Spacing.sm,
    },
    achievementLocked: {
        backgroundColor: Colors.progressBg,
        borderColor: Colors.inputBorder,
    },
    achievementIcon: {
        fontSize: 28,
    },
    achievementTitle: {
        fontFamily: Typography.fontFamily.extraBold,
        fontSize: 10,
        color: Colors.secondary,
        textAlign: 'center',
    },
    achievementTitleLocked: {
        color: Colors.textMuted,
    },
    achievementProgressWrap: {
        width: '100%',
        height: 6,
        backgroundColor: Colors.inputBorder,
        borderRadius: 3,
        overflow: 'hidden',
        marginTop: 4,
    },
    achievementProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    // Menu
    menuContainer: {
        gap: Spacing.sm,
        marginBottom: Spacing.xxl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        borderWidth: 2,
        borderColor: Colors.inputBorder,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: Typography.sizes.md,
        color: Colors.secondary,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    menuBadge: {
        backgroundColor: Colors.error,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuBadgeText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: 11,
        color: Colors.white,
    },
    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.error + '30',
        marginBottom: Spacing.lg,
        minHeight: 56,
    },
    logoutButtonPressed: {
        backgroundColor: Colors.error + '08',
    },
    logoutText: {
        fontFamily: Typography.fontFamily.bold,
        fontSize: Typography.sizes.md,
        color: Colors.error,
    },
    versionText: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});
