import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useWordStore } from '../../stores/useWordStore';
import { generateReadingPassagesBatch, PassageResult } from '../../services/gemini';
import { generateMockPassage } from '../../services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

export default function ReadScreen() {
    const { words } = useWordStore();
    const [passages, setPassages] = useState<PassageResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showTranslation, setShowTranslation] = useState<boolean[]>([]);
    const [usageMetadata, setUsageMetadata] = useState<any>(null);

    useEffect(() => {
        const loadSavedStories = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const docRef = doc(db, 'reading_practice', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.passages) {
                        setPassages(data.passages);
                        setShowTranslation(new Array(data.passages.length).fill(false));
                        setUsageMetadata(data.usageMetadata || null);
                    } else if (data.story) {
                        // Legacy format
                        const legacyPassage: PassageResult = {
                            story: data.story,
                            translation: data.translation,
                            targetWords: data.targetWords || []
                        };
                        setPassages([legacyPassage]);
                        setShowTranslation([false]);
                        setUsageMetadata(data.usageMetadata || null);
                    }
                }
            } catch (e) {
                console.log("Failed to load saved stories", e);
            }
        };
        loadSavedStories();
    }, []);

    // Sample up to 3 sets of 5 words (mutually exclusive when possible)
    const sampleWordSets = (wordsPerSet: number = 5, maxSets: number = 3): string[][] => {
        const shuffled = [...words].sort(() => 0.5 - Math.random());
        const allWordTexts = shuffled.map(w => w.text);

        const sets: string[][] = [];
        let remaining = [...allWordTexts];

        for (let i = 0; i < maxSets; i++) {
            if (remaining.length >= wordsPerSet) {
                sets.push(remaining.slice(0, wordsPerSet));
                remaining = remaining.slice(wordsPerSet);
            } else if (remaining.length > 0) {
                const usedWords = allWordTexts.filter(w => !remaining.includes(w));
                const shuffledUsed = usedWords.sort(() => 0.5 - Math.random());
                const needed = wordsPerSet - remaining.length;
                sets.push([...remaining, ...shuffledUsed.slice(0, needed)]);
                remaining = [];
            } else if (allWordTexts.length >= wordsPerSet) {
                const reshuffled = [...allWordTexts].sort(() => 0.5 - Math.random());
                sets.push(reshuffled.slice(0, wordsPerSet));
            } else {
                sets.push([...allWordTexts]);
            }
        }

        return sets.filter(s => s.length > 0);
    };

    const handleGenerate = async (useMock = false) => {
        if (!useMock && words.length < 3) {
            Alert.alert("Not enough words", "Please add at least 3 words to your vocabulary list to generate stories.");
            return;
        }

        setLoading(true);
        setPassages([]);
        setShowTranslation([]);

        try {
            if (useMock) {
                const mockResults: PassageResult[] = [];
                for (let i = 0; i < 3; i++) {
                    const mockData = await generateMockPassage();
                    mockResults.push({
                        story: mockData.story,
                        translation: mockData.translation,
                        targetWords: ['curious', 'explore', 'vast', 'mysterious', 'surprise']
                    });
                }
                setPassages(mockResults);
                setShowTranslation(new Array(mockResults.length).fill(false));
                setUsageMetadata(null);
            } else {
                const wordSets = sampleWordSets(5, 3);
                const results = await generateReadingPassagesBatch(wordSets);

                setPassages(results);
                setShowTranslation(new Array(results.length).fill(false));

                const totalUsage = results.reduce((acc, r) => {
                    if (r.usageMetadata) {
                        acc.promptTokenCount += r.usageMetadata.promptTokenCount || 0;
                        acc.candidatesTokenCount += r.usageMetadata.candidatesTokenCount || 0;
                        acc.totalTokenCount += r.usageMetadata.totalTokenCount || 0;
                    }
                    return acc;
                }, { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 });

                setUsageMetadata(totalUsage);

                const user = auth.currentUser;
                if (user) {
                    try {
                        await setDoc(doc(db, 'reading_practice', user.uid), {
                            passages: results,
                            usageMetadata: totalUsage,
                            updatedAt: Date.now()
                        });
                    } catch (e) {
                        console.error("Failed to save stories", e);
                    }
                }
            }
        } catch (error: any) {
            console.error("Generation error:", error);
            Alert.alert("Generation Failed", "Could not generate stories. Please check your API key and network.");
        } finally {
            setLoading(false);
        }
    };

    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const toggleTranslation = (index: number) => {
        setShowTranslation(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    const getDefinition = (text: string) => {
        if (!words.some(w => w.text.toLowerCase() === text.toLowerCase())) {
            return `Mock definition for ${text}: A sample meaning used for debugging.`;
        }
        const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        const wordEntry = words.find(w => w.text.toLowerCase() === cleanText.toLowerCase());
        return wordEntry?.definitions?.[0]?.definition || "Definition not found";
    };

    const renderPassage = (text: string) => {
        const parts = text.split(/(「[^」]+」\([^)]+\)|\*\*[^*]+\*\*)/g);
        return (
            <Text style={styles.passageText}>
                {parts.map((part, index) => {
                    if (part.startsWith('「') && part.includes('」(')) {
                        const match = part.match(/「([^」]+)」\(([^)]+)\)/);
                        if (match) {
                            const japaneseText = match[1];
                            const englishWord = match[2];
                            return (
                                <Text
                                    key={index}
                                    style={styles.highlight}
                                    onPress={() => { }}
                                    onPressIn={() => setActiveTooltip(getDefinition(englishWord))}
                                    onPressOut={() => setActiveTooltip(null)}
                                    suppressHighlighting={false}
                                >
                                    {japaneseText}
                                </Text>
                            );
                        }
                    }
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const wordText = part.slice(2, -2);
                        return (
                            <Text
                                key={index}
                                style={styles.highlight}
                                onPress={() => { }}
                                onPressIn={() => setActiveTooltip(getDefinition(wordText))}
                                onPressOut={() => setActiveTooltip(null)}
                                suppressHighlighting={false}
                            >
                                {wordText}
                            </Text>
                        );
                    }
                    return <Text key={index}>{part}</Text>;
                })}
            </Text>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Reading Practice</Text>
                    <Text style={styles.subtitle}>Generate stories with your vocabulary</Text>
                </View>

                <View style={styles.actionContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Generating 3 stories...</Text>
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            <Button
                                title={passages.length > 0 ? "Generate New Stories" : "Generate Stories"}
                                onPress={() => handleGenerate(false)}
                            />
                            <Button
                                title="Debug: Load Mock Stories"
                                color="gray"
                                onPress={() => handleGenerate(true)}
                            />
                        </View>
                    )}
                </View>

                {passages.map((passage, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardNumber}>Story {index + 1}</Text>
                        </View>

                        <View style={styles.wordsList}>
                            <Text style={styles.wordsLabel}>Target Words:</Text>
                            <View style={styles.chipContainer}>
                                {passage.targetWords.map((w, i) => (
                                    <View key={i} style={styles.chip}>
                                        <Text style={styles.chipText}>{w}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.divider} />

                        <Text style={styles.langLabel}>English</Text>
                        {renderPassage(passage.story)}

                        <View style={styles.translateContainer}>
                            <Button
                                title={showTranslation[index] ? "Hide Translation" : "Show Japanese Translation"}
                                onPress={() => toggleTranslation(index)}
                            />
                        </View>

                        {showTranslation[index] && (
                            <View style={styles.translationBox}>
                                <Text style={styles.langLabel}>Japanese</Text>
                                {renderPassage(passage.translation)}
                            </View>
                        )}
                    </View>
                ))}

                {usageMetadata && passages.length > 0 && (
                    <View style={styles.metadataBox}>
                        <Text style={styles.metadataTitle}>Total Token Usage</Text>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Prompt:</Text>
                            <Text style={styles.metadataValue}>{usageMetadata.promptTokenCount || 'N/A'}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Response:</Text>
                            <Text style={styles.metadataValue}>{usageMetadata.candidatesTokenCount || 'N/A'}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>Total:</Text>
                            <Text style={[styles.metadataValue, styles.metadataTotal]}>{usageMetadata.totalTokenCount || 'N/A'}</Text>
                        </View>
                    </View>
                )}

                {passages.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Tap generate to practice reading in context!</Text>
                    </View>
                )}
            </ScrollView>

            {activeTooltip && (
                <View style={styles.tooltipContainer}>
                    <Text style={styles.tooltipText}>{activeTooltip}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#F2F2F7',
        flexGrow: 1,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    actionContainer: {
        marginBottom: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 15,
    },
    cardNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
        textTransform: 'uppercase',
    },
    wordsList: {
        marginBottom: 15,
    },
    wordsLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    chipText: {
        color: '#1565C0',
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginBottom: 15,
    },
    translateContainer: {
        marginTop: 20,
        marginBottom: 10,
    },
    tooltipContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.95)',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
    tooltipText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
    translationBox: {
        marginTop: 10,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    langLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#aaa',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    passageText: {
        fontSize: 18,
        lineHeight: 28,
        color: '#333',
    },
    highlight: {
        fontWeight: 'bold',
        color: '#E65100',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 2,
    },
    emptyState: {
        marginTop: 50,
        alignItems: 'center',
        opacity: 0.7,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        maxWidth: 250,
    },
    metadataBox: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    metadataTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#aaa',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    metadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    metadataLabel: {
        fontSize: 13,
        color: '#666',
    },
    metadataValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    metadataTotal: {
        fontWeight: 'bold',
        color: '#007AFF',
    },
});
