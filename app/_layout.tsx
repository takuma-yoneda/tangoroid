import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuthStore } from "../stores/useAuthStore";
import { useWordStore } from "../stores/useWordStore";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
    const { user, setUser, isLoading, setLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="new-word" options={{ presentation: 'modal', title: 'Add New Word' }} />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
}
