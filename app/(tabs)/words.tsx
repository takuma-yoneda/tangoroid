import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useWordStore } from '../../stores/useWordStore';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WordsScreen() {
    const { words, fetchWords, isLoading } = useWordStore();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWords();
    }, []);

    const filteredWords = words
        .filter(w =>
            w.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.definitions?.[0]?.definition?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.srs.interval - b.srs.interval);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search words..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                />
            </View>
            <FlatList
                data={filteredWords}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={fetchWords} />
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
                            {searchQuery ? "No matches found." : "No words yet. Add one!"}
                        </Text>
                    </View>
                }
            />

            <Link href="/new-word" asChild>
                <TouchableOpacity style={styles.fab}>
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </Link>
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
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
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
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007AFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
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
