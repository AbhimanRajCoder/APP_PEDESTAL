import { Stack } from 'expo-router';

export default function SimulatorLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="play" options={{ gestureEnabled: false }} />
            <Stack.Screen name="results" options={{ gestureEnabled: false }} />
        </Stack>
    );
}
