import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchWordDefinition } from '../services/dictionary';
import { useWordStore } from '../stores/useWordStore';
import { useSettingsStore } from '../stores/useSettingsStore';

import { fetchSuggestions } from '../services/autocomplete';
import { TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NewWordScreen() {
    const [word, setWord] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [definitionData, setDefinitionData] = useState<any>(null);
    const addWord = useWordStore(s => s.addWord);
    const { accent } = useSettingsStore();
    const router = useRouter();
    const { word: initialWord } = useLocalSearchParams<{ word?: string }>();

    // Auto-search if word param is passed
    useEffect(() => {
        if (initialWord) {
            setWord(initialWord);
            handleSearch(initialWord);
        }
    }, [initialWord]);

    const handleTextChange = async (text: string) => {
        setWord(text);
        if (text.length > 1) {
            const results = await fetchSuggestions(text);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const selectSuggestion = (suggestion: string) => {
        setWord(suggestion);
        setSuggestions([]);
        handleSearch(suggestion);
    };

    const handleSearch = async (searchTerm = word) => {
        if (!searchTerm) return;
        setLoading(true);
        setDefinitionData(null);
        setSuggestions([]);
        Keyboard.dismiss();
        try {
            const data = await fetchWordDefinition(searchTerm);
            // Extract phonetic and audio
            let phonetic = data.phonetic;
            let audio = '';

            if (data.phonetics && Array.isArray(data.phonetics)) {
                // Find audio - prefer user's selected accent
                const accentMap: Record<string, string[]> = {
                    'us': ['-us.mp3', '-us-', 'us.mp3'],
                    'uk': ['-uk.mp3', '-uk-', 'uk.mp3', '-gb.mp3', '-gb-', 'gb.mp3'],
                    'au': ['-au.mp3', '-au-', 'au.mp3']
                };

                const preferredPatterns = accentMap[accent] || [];

                // First try to find audio with preferred accent
                let audioEntry = data.phonetics.find((p: any) =>
                    p.audio && p.audio !== '' &&
                    preferredPatterns.some(pattern => p.audio.toLowerCase().includes(pattern))
                );

                // Fallback to any audio if preferred not found
                if (!audioEntry) {
                    audioEntry = data.phonetics.find((p: any) => p.audio && p.audio !== '');
                }

                if (audioEntry) {
                    audio = audioEntry.audio;
                    // Fix protocol-relative URLs
                    if (audio.startsWith('//')) {
                        audio = 'https:' + audio;
                    }
                }

                // Find phonetic text if top-level is missing
                if (!phonetic) {
                    const textEntry = data.phonetics.find((p: any) => p.text && p.text !== '');
                    if (textEntry) {
                        phonetic = textEntry.text;
                    }
                }
            }

            setDefinitionData({ ...data, phonetic, audio });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!word) return;
        setLoading(true);
        try {
            const processedData = {
                definitions: definitionData?.meanings?.map((m: any) => ({
                    partOfSpeech: m.partOfSpeech,
                    definition: m.definitions[0]?.definition
                })) || [],
                examples: [],
                phonetic: definitionData.phonetic,
                audio: definitionData.audio
            };

            await addWord(word, processedData);
            router.back();
        } catch (error: any) {
            Alert.alert('Error saving', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={{ zIndex: 1 }}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter word..."
                    value={word}
                    onChangeText={handleTextChange}
                    autoCapitalize="none"
                    onSubmitEditing={() => handleSearch(word)}
                    returnKeyType="search"
                />
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        {suggestions.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestionItem}
                                onPress={() => selectSuggestion(item)}
                            >
                                <Text>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            <Button title="Search Definition" onPress={() => handleSearch(word)} disabled={loading || !word} />

            {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

            {definitionData && (
                <View style={styles.resultContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.word}>{definitionData.word}</Text>
                        {definitionData.audio && <Ionicons name="volume-medium" size={24} color="#007AFF" />}
                    </View>
                    <Text style={styles.phonetic}>{definitionData.phonetic}</Text>
                    {definitionData.meanings?.map((m: any, index: number) => (
                        <View key={index} style={styles.meaning}>
                            <Text style={styles.pos}>{m.partOfSpeech}</Text>
                            <Text>{m.definitions[0].definition}</Text>
                        </View>
                    ))}
                    <View style={{ marginTop: 20 }}>
                        <Button title="Add to Vocabulary" onPress={handleSave} />
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        fontSize: 18,
        marginBottom: 10,
        backgroundColor: 'white',
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    word: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    phonetic: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    meaning: {
        marginBottom: 10,
    },
    pos: {
        fontWeight: 'bold',
        fontStyle: 'italic',
    }
});
