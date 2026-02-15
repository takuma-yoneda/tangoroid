import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWordStore } from '../../stores/useWordStore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '../../hooks/useColors';

export default function HomeScreen() {
    const { words, fetchWords, isLoading } = useWordStore();
    const router = useRouter();
    const [dueCount, setDueCount] = useState(0);
    const colors = useColors();

    useFocusEffect(
        useCallback(() => {
            fetchWords();
        }, [])
    );

    useEffect(() => {
        const now = Date.now();
        const count = words.filter(w => w.srs.nextReview <= now || !w.srs.nextReview).length;
        setDueCount(count);
    }, [words]);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: colors.background,
        },
        header: {
            marginBottom: 30,
            marginTop: 20,
        },
        greeting: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.text,
        },
        subGreeting: {
            fontSize: 16,
            color: colors.textTertiary,
            marginTop: 4,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 10,
        },
        count: {
            fontSize: 48,
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: 5,
        },
        desc: {
            color: colors.textMuted,
            marginBottom: 20,
        },
        button: {
            backgroundColor: colors.primary,
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 25,
            width: '100%',
            alignItems: 'center',
        },
        disabledButton: {
            backgroundColor: colors.disabled,
        },
        buttonText: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: 16,
        },
        stats: {
            marginTop: 30,
            alignItems: 'center',
        },
        statsText: {
            color: colors.textTertiary,
            fontSize: 14,
        }
    }), [colors]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome Back!</Text>
                <Text style={styles.subGreeting}>Here is your daily summary.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Reviews Due</Text>
                <Text style={styles.count}>{dueCount}</Text>
                <Text style={styles.desc}>{dueCount > 0 ? "You have cards to review!" : "All caught up for now!"}</Text>

                <TouchableOpacity
                    style={[styles.button, dueCount === 0 && styles.disabledButton]}
                    onPress={() => router.push('/review')}
                    disabled={dueCount === 0}
                >
                    <Text style={styles.buttonText}>Start Review Session</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.stats}>
                <Text style={styles.statsText}>Total Words: {words.length}</Text>
            </View>
        </View>
    );
}
