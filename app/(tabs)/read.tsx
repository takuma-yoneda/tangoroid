import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useWordStore } from '../../stores/useWordStore';
import { generateReadingPassage } from '../../services/gemini';
import { generateMockPassage } from '../../services/mockData';
import { Ionicons } from '@expo/vector-icons';

export default function ReadScreen() {
    const { words } = useWordStore();
    const [content, setContent] = useState<{ story: string; translation: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [targetWords, setTargetWords] = useState<string[]>([]);
    const [showTranslation, setShowTranslation] = useState(false);

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
            setContent(data);
            // For mock mode, ensure we have the target words in the list so tooltip works
            if (useMock) {
                // Add temporary mock words to targetWords just for display
                setTargetWords(['curious', 'explore', 'vast', 'mysterious', 'surprise']);
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

    // Simple parser to render bold text
    const renderPassage = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <Text style={styles.passageText}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const wordText = part.slice(2, -2);
                        return (
                            <Text
                                key={index}
                                style={styles.highlight}
                                onPress={() => { }} // Required for onPressIn/Out to work reliably on some platforms
                                onPressIn={() => setActiveTooltip(getDefinition(wordText))}
                                onPressOut={() => setActiveTooltip(null)}
                                suppressHighlighting={false} // Allow native highlight feedback
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
    }
});
