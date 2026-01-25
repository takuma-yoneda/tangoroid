import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useWordStore } from '../../stores/useWordStore';
import { generateReadingPassage } from '../../services/gemini';
import { generateMockPassage } from '../../services/mockData';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

export default function ReadScreen() {
    const { words } = useWordStore();
    const [content, setContent] = useState<{ story: string; translation: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [targetWords, setTargetWords] = useState<string[]>([]);
    const [showTranslation, setShowTranslation] = useState(false);
    const [usageMetadata, setUsageMetadata] = useState<any>(null);

    useEffect(() => {
        const loadSavedStory = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const docRef = doc(db, 'reading_practice', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setContent({ story: data.story, translation: data.translation });
                    setTargetWords(data.targetWords || []);
                    setUsageMetadata(data.usageMetadata || null);
                }
            } catch (e) {
                console.log("Failed to load saved story", e);
            }
        };
        loadSavedStory();
    }, []);

    const handleGenerate = async (useMock = false) => {
        if (!useMock && words.length < 3) {
            Alert.alert("Not enough words", "Please add at least 3 words to your vocabulary list to generate a story.");
            return;
        }

        setLoading(true);
        setContent(null);
        setShowTranslation(false);

        // Select 5 random words (or fewer if total < 5)
        const shuffled = [...words].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5).map(w => w.text);
        setTargetWords(selected);

        try {
            const data = useMock ? await generateMockPassage() : await generateReadingPassage(selected);
            setContent({ story: data.story, translation: data.translation });
            setUsageMetadata(data.usageMetadata || null);

            const wordsToSave = useMock ? ['curious', 'explore', 'vast', 'mysterious', 'surprise'] : selected;

            // For mock mode, ensure we have the target words in the list so tooltip works
            if (useMock) {
                setTargetWords(wordsToSave);
            }

            // Save to Firestore
            const user = auth.currentUser;
            if (user) {
                try {
                    await setDoc(doc(db, 'reading_practice', user.uid), {
                        story: data.story,
                        translation: data.translation,
                        targetWords: wordsToSave,
                        usageMetadata: data.usageMetadata || null,
                        updatedAt: Date.now()
                    });
                } catch (e) {
                    console.error("Failed to save story", e);
                }
            }
        } catch (error: any) {
            Alert.alert("Generation Failed", "Could not generate story. Please check your API key and network.");
        } finally {
            setLoading(false);
        }
    };

    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const getDefinition = (text: string) => {
        // If we are in mock mode and the word is not in the store, return a mock definition
        if (!words.some(w => w.text.toLowerCase() === text.toLowerCase())) {
            return `Mock definition for ${text}: A sample meaning used for debugging.`;
        }

        // Clean punctuation from the text (e.g. "running," -> "running")
        const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        // Try to find the word in our store (case-insensitive)
        const wordEntry = words.find(w => w.text.toLowerCase() === cleanText.toLowerCase());
        return wordEntry?.definitions?.[0]?.definition || "Definition not found";
    };

    // Simple parser to render bold text - handles both English (**word**) and Japanese (「単語」(word)) formats
    const renderPassage = (text: string) => {
        // Match either **text** or 「text」(EnglishWord)
        const parts = text.split(/(「[^」]+」\([^)]+\)|\*\*[^*]+\*\*)/g);
        return (
            <Text style={styles.passageText}>
                {parts.map((part, index) => {
                    // Japanese format: 「単語」(EnglishWord)
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
                    // English format: **word**
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
                        <ActivityIndicator size="large" color="#007AFF" />
                    ) : (
                        <View style={{ gap: 10 }}>
                            <Button
                                title={content ? "Generate Another" : "Generate Story"}
                                onPress={() => handleGenerate(false)}
                            />
                            <Button
                                title="Debug: Load Mock Story"
                                color="gray"
                                onPress={() => handleGenerate(true)}
                            />
                        </View>
                    )}
                </View>

                {content && (
                    <View style={styles.card}>
                        <View style={styles.wordsList}>
                            <Text style={styles.wordsLabel}>Target Words:</Text>
                            <View style={styles.chipContainer}>
                                {targetWords.map((w, i) => (
                                    <View key={i} style={styles.chip}>
                                        <Text style={styles.chipText}>{w}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.divider} />

                        <Text style={styles.langLabel}>English</Text>
                        {renderPassage(content.story)}

                        <View style={styles.translateContainer}>
                            <Button
                                title={showTranslation ? "Hide Translation" : "Show Japanese Translation"}
                                onPress={() => setShowTranslation(!showTranslation)}
                            />
                        </View>

                        {showTranslation && (
                            <View style={styles.translationBox}>
                                <Text style={styles.langLabel}>Japanese</Text>
                                {renderPassage(content.translation)}
                            </View>
                        )}

                        {usageMetadata && (
                            <View style={styles.metadataBox}>
                                <Text style={styles.metadataTitle}>Token Usage</Text>
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

                    </View>
                )}

                {!content && !loading && (
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
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
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
        top: 20, // Move to top to avoid tab bar conflicts
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
        color: '#E65100', // Deep orange for visibility
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 2, // Make it a bit easier to touch
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
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
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
    }
});
