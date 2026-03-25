import { Stack } from 'expo-router';

export default function PaperTradingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="market" />
            <Stack.Screen name="stock-detail" />
            <Stack.Screen name="portfolio" />
        </Stack>
    );
}
