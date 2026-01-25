import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWordDefinition } from '../services/dictionary';
import { useWordStore } from '../stores/useWordStore';

import { fetchSuggestions } from '../services/autocomplete';
import { TouchableOpacity, Keyboard } from 'react-native';

export default function NewWordScreen() {
    const [word, setWord] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [definitionData, setDefinitionData] = useState<any>(null);
    const addWord = useWordStore(s => s.addWord);
    const router = useRouter();

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
            setDefinitionData(data);
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
                    <Text style={styles.word}>{definitionData.word}</Text>
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
