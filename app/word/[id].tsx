import { View, Text, StyleSheet, ScrollView, Button, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWordStore } from '../../stores/useWordStore';
import { useLayoutEffect, useMemo } from 'react';
import { useColors } from '../../hooks/useColors';

export default function WordDetailScreen() {
    const { id } = useLocalSearchParams();
    const { words, deleteWord } = useWordStore();
    const router = useRouter();
    const colors = useColors();

    const word = words.find(w => w.id === id);

    useLayoutEffect(() => {
        // Set title dynamically if needed
    }, [word]);

    const styles = useMemo(() => StyleSheet.create({
        container: {
            padding: 20,
            backgroundColor: colors.background,
            flexGrow: 1,
        },
        word: {
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
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
            color: colors.textTertiary,
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
            color: colors.textSecondary,
        },
        defItem: {
            marginBottom: 10,
            padding: 10,
            backgroundColor: colors.surfaceAlt,
            borderRadius: 6,
        },
        pos: {
            fontStyle: 'italic',
            marginBottom: 2,
            color: colors.textTertiary,
        },
        defText: {
            fontSize: 16,
            color: colors.text,
        },
        exampleText: {
            fontSize: 14,
            color: colors.textTertiary,
            fontStyle: 'italic',
            marginBottom: 6,
        },
        source: {
            marginTop: 8,
            fontSize: 12,
            color: colors.textMuted,
            fontStyle: 'italic',
            textAlign: 'right',
        },
        wordImage: {
            width: '100%',
            height: 180,
            borderRadius: 10,
            backgroundColor: colors.surfaceAlt,
        },
        imageAttribution: {
            fontSize: 11,
            color: colors.textMuted,
            fontStyle: 'italic',
            textAlign: 'right',
            marginBottom: 20,
        },
        progressText: {
            color: colors.text,
        },
    }), [colors]);

    if (!word) {
        return (
            <View style={styles.container}>
                <Text style={{ color: colors.text }}>Word not found</Text>
            </View>
        );
    }

    const handleDelete = async () => {
        if (typeof id === 'string') {
            if (Platform.OS === 'web') {
                const confirmed = window.confirm("Are you sure you want to delete this word?");
                if (confirmed) {
                    await deleteWord(id);
                    router.back();
                }
            } else {
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
                        <Ionicons name="volume-high" size={28} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
            {word.phonetic && <Text style={styles.phonetic}>{word.phonetic}</Text>}
            {word.imageUrl && (
                <View>
                    <Image source={{ uri: word.imageUrl }} style={styles.wordImage} resizeMode="contain" />
                    <Text style={styles.imageAttribution}>via Pixabay</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Definitions</Text>
                {word.definitions.map((def, idx) => (
                    <View key={idx} style={styles.defItem}>
                        <Text style={styles.pos}>{def.partOfSpeech}</Text>
                        <Text style={styles.defText}>{def.definition}</Text>
                        {def.examples?.map((ex, ei) => (
                            <Text key={ei} style={styles.exampleText}>"{ex}"</Text>
                        ))}
                    </View>
                ))}
                {word.source && (
                    <Text style={styles.source}>via {word.source}</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Progress</Text>
                <Text style={styles.progressText}>Next Review: {new Date(word.srs.nextReview).toLocaleDateString()}</Text>
                <Text style={styles.progressText}>Level: {word.srs.interval} days</Text>
            </View>

            <Button title="Delete Word" onPress={handleDelete} color="red" />
        </ScrollView>
    );
}
