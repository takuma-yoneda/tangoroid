import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWordStore } from '../../stores/useWordStore';
import { useLayoutEffect } from 'react';

export default function WordDetailScreen() {
    const { id } = useLocalSearchParams();
    const { words, deleteWord } = useWordStore();
    const router = useRouter();

    const word = words.find(w => w.id === id);

    useLayoutEffect(() => {
        // Set title dynamically if needed, though Stack title usually comes from route config or setOptions
    }, [word]);

    if (!word) {
        return (
            <View style={styles.container}>
                <Text>Word not found</Text>
            </View>
        );
    }

    const handleDelete = async () => {
        if (typeof id === 'string') {
            Alert.alert(
                "Delete Word",
                "Are you sure you want to delete this word?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            await deleteWord(id);
                            router.back();
                        }
                    }
                ]
            );
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.word}>{word.text}</Text>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Definitions</Text>
                {word.definitions.map((def, idx) => (
                    <View key={idx} style={styles.defItem}>
                        <Text style={styles.pos}>{def.partOfSpeech}</Text>
                        <Text style={styles.defText}>{def.definition}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Progress</Text>
                <Text>Next Review: {new Date(word.srs.nextReview).toLocaleDateString()}</Text>
                <Text>Level: {word.srs.interval} days</Text>
            </View>

            <Button title="Delete Word" onPress={handleDelete} color="red" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    word: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    defItem: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
    },
    pos: {
        fontStyle: 'italic',
        marginBottom: 2,
        color: '#666',
    },
    defText: {
        fontSize: 16,
    }
});
