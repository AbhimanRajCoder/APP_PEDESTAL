import { Stack } from 'expo-router';

export default function LearnLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="roadmap" />
            <Stack.Screen name="lesson" options={{ gestureEnabled: false }} />
        </Stack>
    );
}
