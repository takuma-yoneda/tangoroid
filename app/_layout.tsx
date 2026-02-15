import { Stack, useRouter, useSegments } from "expo-router";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuthStore } from "../stores/useAuthStore";
import { useWordStore } from "../stores/useWordStore";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "../hooks/useColors";
import { useSettingsStore } from "../stores/useSettingsStore";

export default function RootLayout() {
    const { user, setUser, isLoading, setLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const colors = useColors();
    const theme = useSettingsStore(s => s.theme);

    const navigationTheme = useMemo(() => ({
        dark: theme === 'dark',
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.primary,
        },
        fonts: theme === 'dark' ? DarkTheme.fonts : DefaultTheme.fonts,
    }), [theme, colors]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            setInitialized(true);
            if (user) {
                useWordStore.getState().fetchWords();
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, initialized]);

    if (isLoading || !initialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ThemeProvider value={navigationTheme}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="new-word" options={{ presentation: 'modal', title: 'Add New Word' }} />
            </Stack>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
    );
}
