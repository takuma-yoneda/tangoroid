import { View, Text, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { useWordStore, Word } from '../stores/useWordStore';
import { calculateReview } from '../services/srs';
import { useRouter } from 'expo-router';
import { useColors } from '../hooks/useColors';

export default function ReviewScreen() {
    const { words, updateWordSRS } = useWordStore();
    const router = useRouter();
    const [queue, setQueue] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const colors = useColors();

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

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: colors.background,
            justifyContent: 'center',
        },
        counter: {
            textAlign: 'center',
            marginBottom: 20,
            color: colors.textTertiary,
        },
        card: {
            backgroundColor: colors.surface,
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
            color: colors.text,
        },
        flipHint: {
            marginTop: 20,
            color: colors.textMuted,
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
            color: colors.text,
        },
        def: {
            fontSize: 18,
            color: colors.text,
        },
        example: {
            marginTop: 4,
            fontSize: 14,
            color: colors.textTertiary,
            fontStyle: 'italic',
        },
        cardImage: {
            width: 140,
            height: 140,
            borderRadius: 10,
            marginBottom: 4,
        },
        imageAttribution: {
            fontSize: 10,
            color: colors.textMuted,
            fontStyle: 'italic',
            marginBottom: 12,
        },
        emptyText: {
            color: colors.text,
        },
    }), [colors]);

    if (queue.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No cards due for review!</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    if (currentIndex >= queue.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Session Complete!</Text>
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
                        <View style={{ alignItems: 'center' }}>
                            {currentWord.imageUrl && (
                                <View style={{ alignItems: 'center' }}>
                                    <Image source={{ uri: currentWord.imageUrl }} style={styles.cardImage} resizeMode="contain" />
                                    <Text style={styles.imageAttribution}>via Pixabay</Text>
                                </View>
                            )}
                            <Text style={styles.wordText}>{currentWord.text}</Text>
                        </View>
                    ) : (
                        <View>
                            {currentWord.definitions.map((def, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <Text style={styles.pos}>{def.partOfSpeech}</Text>
                                    <Text style={styles.def}>{def.definition}</Text>
                                    {def.examples?.map((ex, ei) => (
                                        <Text key={ei} style={styles.example}>"{ex}"</Text>
                                    ))}
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
