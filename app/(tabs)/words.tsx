import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useWordStore } from '../../stores/useWordStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchSuggestions } from '../../services/autocomplete';

export default function WordsScreen() {
    const { words, fetchWords } = useWordStore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchWords();
        setRefreshing(false);
    };

    const handleTextChange = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 1) {
            const results = await fetchSuggestions(text);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectWord = (word: string) => {
        setSuggestions([]);
        setSearchQuery('');

        // Check if word already exists
        const existingWord = words.find(w => w.text.toLowerCase() === word.toLowerCase());
        if (existingWord) {
            // Navigate to existing word detail
            router.push(`/word/${existingWord.id}`);
        } else {
            // Navigate to add new word page with pre-filled word
            router.push({
                pathname: '/new-word',
                params: { word }
            });
        }
    };

    useEffect(() => {
        fetchWords();
    }, []);

    const filteredWords = words
        .filter(w =>
            w.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.definitions?.[0]?.definition?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            // Primary sort: by interval (New -> Learning -> Mastered)
            if (a.srs.interval !== b.srs.interval) {
                return a.srs.interval - b.srs.interval;
            }
            // Secondary sort: by creation date (newest first)
            return b.createdAt - a.createdAt;
        });

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <View style={{ flex: 1, zIndex: 1 }}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search or add words..."
                        value={searchQuery}
                        onChangeText={handleTextChange}
                        clearButtonMode="while-editing"
                        returnKeyType="search"
                        autoCapitalize="none"
                        onSubmitEditing={() => searchQuery && handleSelectWord(searchQuery)}
                    />
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((item, index) => {
                                const existingWord = words.find(w => w.text.toLowerCase() === item.toLowerCase());
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectWord(item)}
                                    >
                                        <Text style={styles.suggestionText}>{item}</Text>
                                        {existingWord && <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
            <FlatList
                data={filteredWords}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                renderItem={({ item }) => {
                    const status = getStatus(item.srs.interval);
                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push(`/word/${item.id}`)}
                        >
                            <View>
                                <Text style={styles.wordText}>{item.text}</Text>
                                {item.definitions?.[0] && (
                                    <Text style={styles.defText} numberOfLines={1}>
                                        {item.definitions[0].definition}
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: status.bg }]}>
                                <Text style={[styles.levelText, { color: status.text }]}>{status.label}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery ? "No matches found." : "No words yet. Type to add one!"}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

function getStatus(interval: number) {
    if (interval === 0) return { label: 'New', bg: '#E3F2FD', text: '#1E88E5' };      // Blue
    if (interval < 3) return { label: 'Learning', bg: '#FFF8E1', text: '#FFA000' };   // Amber
    return { label: 'Mastered', bg: '#E8F5E9', text: '#43A047' };                     // Green
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 15,
        marginBottom: 5,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        height: 40,
        fontSize: 16,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        maxHeight: 200,
        zIndex: 999,
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    wordText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    defText: {
        color: '#666',
        marginTop: 4,
        maxWidth: 200,
    },
    levelBadge: {
        backgroundColor: '#e1e1e1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    levelText: {
        fontSize: 12,
        color: '#333',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});
