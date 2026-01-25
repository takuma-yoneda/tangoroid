import { View, Text, StyleSheet, ScrollView, Button, Alert, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWordStore } from '../../stores/useWordStore';
import { useLayoutEffect } from 'react';

export default function WordDetailScreen() {
    const { id } = useLocalSearchParams();
    const { words, deleteWord } = useWordStore();
    const router = useRouter();

    const word = words.find(w => w.id === id);

    useLayoutEffect(() => {
        // Set title dynamically if needed
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

    const playSound = async () => {
        if (!word.audio) return;
        try {
            console.log('Attempting to play audio:', word.audio);
            if (Platform.OS === 'web') {
                const audio = new window.Audio(word.audio);
                await audio.play();
            } else {
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false
                });
                const { sound } = await Audio.Sound.createAsync(
                    { uri: word.audio },
                    { shouldPlay: true }
                );
            }
        } catch (error) {
            console.error('Error playing sound', error);
            Alert.alert("Error", "Could not play audio.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.word}>{word.text}</Text>
                {word.audio && (
                    <TouchableOpacity onPress={playSound} style={styles.audioButton}>
                        <Ionicons name="volume-high" size={28} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </View>
            {word.phonetic && <Text style={styles.phonetic}>{word.phonetic}</Text>}

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    audioButton: {
        marginLeft: 15,
    },
    phonetic: {
        textAlign: 'center',
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
        fontStyle: 'italic',
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
