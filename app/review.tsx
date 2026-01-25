import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { useWordStore, Word } from '../stores/useWordStore';
import { calculateReview } from '../services/srs';
import { useRouter } from 'expo-router';

export default function ReviewScreen() {
    const { words, updateWordSRS } = useWordStore();
    const router = useRouter();
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        // Filter words due for review
        const now = Date.now();
        const dueWords = words.filter(w => w.srs.nextReview <= now || !w.srs.nextReview);
        setQueue(dueWords);
    }, [words]);

    const handleRate = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
        const currentWord = queue[currentIndex];
        const result = calculateReview(
            rating,
            currentWord.srs.interval,
            currentWord.srs.repetitions,
            currentWord.srs.easeFactor
        );

        await updateWordSRS(currentWord.id, result);

        setIsFlipped(false);
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Session complete
            router.back();
        }
    };

    if (queue.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No cards due for review!</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    if (currentIndex >= queue.length) {
        return (
            <View style={styles.container}>
                <Text>Session Complete!</Text>
                <Button title="Finish" onPress={() => router.back()} />
            </View>
        );
    }

    const currentWord = queue[currentIndex];

    return (
        <View style={styles.container}>
            <Text style={styles.counter}>{currentIndex + 1} / {queue.length}</Text>

            <TouchableOpacity
                style={styles.card}
                activeOpacity={1}
                onPress={() => setIsFlipped(!isFlipped)}
            >
                <View style={styles.cardContent}>
                    {!isFlipped ? (
                        <Text style={styles.wordText}>{currentWord.text}</Text>
                    ) : (
                        <View>
                            {currentWord.definitions.map((def, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <Text style={styles.pos}>{def.partOfSpeech}</Text>
                                    <Text style={styles.def}>{def.definition}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
                <Text style={styles.flipHint}>Tap to flip</Text>
            </TouchableOpacity>

            {isFlipped && (
                <View style={styles.actions}>
                    <Button title="Again" color="#FF3B30" onPress={() => handleRate('AGAIN')} />
                    <Button title="Hard" color="#FF9500" onPress={() => handleRate('HARD')} />
                    <Button title="Good" color="#4CD964" onPress={() => handleRate('GOOD')} />
                    <Button title="Easy" color="#007AFF" onPress={() => handleRate('EASY')} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
    },
    counter: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 40,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center'
    },
    wordText: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    flipHint: {
        marginTop: 20,
        color: '#999',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    pos: {
        fontStyle: 'italic',
        fontWeight: "bold",
    },
    def: {
        fontSize: 18,
    }
});
