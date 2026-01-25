import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWordStore } from '../../stores/useWordStore';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';

export default function HomeScreen() {
    const { words, fetchWords, isLoading } = useWordStore();
    const router = useRouter();
    const [dueCount, setDueCount] = useState(0);

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F2F2F7',
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
    },
    subGreeting: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    card: {
        backgroundColor: 'white',
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
        color: '#333',
        marginBottom: 10,
    },
    count: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 5,
    },
    desc: {
        color: '#888',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
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
        color: '#666',
        fontSize: 14,
    }
});
