import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import useAuthStore from '../store/authStore';

export default function RootLayout() {
    const [mounted, setMounted] = useState(false);
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (isAuthenticated) {
            router.replace('/(tabs)');
        } else {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, mounted]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}