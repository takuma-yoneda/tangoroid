import { create } from 'zustand';
import { db, auth } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { fetchWordDefinition } from '../services/dictionary';
import { searchImage } from '../services/images';

export interface Word {
    id: string;
    text: string;
    definitions: Definition[];
    examples: string[];
    phonetic?: string;
    audio?: string;
    source?: string;
    imageUrl?: string;
    srs: {
        interval: number;
        repetitions: number;
        easeFactor: number;
        nextReview: number;
    };
    createdAt: number;
    userId: string;
}

interface Definition {
    partOfSpeech: string;
    definition: string;
    examples?: string[];
}

interface WordState {
    words: Word[];
    isLoading: boolean;
    addWord: (text: string, data: any) => Promise<void>;
    fetchWords: () => Promise<void>;
    updateWordSRS: (id: string, newSrs: Word['srs']) => Promise<void>;
    deleteWord: (id: string) => Promise<void>;
    backfillExamples: () => Promise<{ updated: number; skipped: number; failed: number }>;
    backfillImages: () => Promise<{ updated: number; skipped: number; failed: number }>;
}

export const useWordStore = create<WordState>((set, get) => ({
    words: [],
    isLoading: false,

    fetchWords: async () => {
        const user = auth.currentUser;
        if (!user) return;
        set({ isLoading: true });
        try {
            const q = query(collection(db, 'words'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const words: Word[] = [];
            querySnapshot.forEach((doc) => {
                words.push({ id: doc.id, ...doc.data() } as Word);
            });
            set({ words });
        } catch (e) {
            console.error(e);
        } finally {
            set({ isLoading: false });
        }
    },

    addWord: async (text, data) => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("No user logged in");
        }

        // Check for duplicates (case-insensitive)
        const existingWord = get().words.find(w => w.text.toLowerCase() === text.toLowerCase());
        if (existingWord) {
            throw new Error(`The word "${text}" is already in your vocabulary.`);
        }

        const newWord: Omit<Word, 'id'> = {
            text,
            definitions: data.definitions || [],
            examples: data.examples || [],
            phonetic: data.phonetic || null,
            audio: data.audio || null,
            source: data.source || null,
            imageUrl: data.imageUrl || null,
            userId: user.uid,
            createdAt: Date.now(),
            srs: {
                interval: 0,
                repetitions: 0,
                easeFactor: 2.5,
                nextReview: Date.now(),
            }
        };

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'words'), newWord);

        // Update local state
        set((state) => ({ words: [...state.words, { id: docRef.id, ...newWord }] }));
    },

    updateWordSRS: async (id, newSrs) => {
        await updateDoc(doc(db, 'words', id), { srs: newSrs });
        set((state) => ({
            words: state.words.map(w => w.id === id ? { ...w, srs: newSrs } : w)
        }));
    },

    deleteWord: async (id) => {
        await deleteDoc(doc(db, 'words', id));
        set((state) => ({
            words: state.words.filter(w => w.id !== id)
        }));
    },

    backfillExamples: async () => {
        const words = get().words;
        let updated = 0, skipped = 0, failed = 0;

        for (const word of words) {
            if (word.source && word.definitions.some(d => d.examples && d.examples.length > 0)) {
                skipped++;
                continue;
            }
            try {
                const data = await fetchWordDefinition(word.text);
                const source = data.source || 'Free Dictionary';
                const definitions = (data.meanings || []).flatMap((m: any) =>
                    m.definitions.map((d: any) => ({
                        partOfSpeech: m.partOfSpeech,
                        definition: d.definition,
                        examples: d.example
                            ? [d.example]
                            : (d.examples || []).slice(0, 2),
                    }))
                );

                await updateDoc(doc(db, 'words', word.id), { definitions, source });
                set((state) => ({
                    words: state.words.map(w =>
                        w.id === word.id ? { ...w, definitions, source } : w
                    )
                }));
                updated++;
            } catch {
                failed++;
            }
        }

        return { updated, skipped, failed };
    },

    backfillImages: async () => {
        const words = get().words;
        let updated = 0, skipped = 0, failed = 0;

        for (const word of words) {
            if (word.imageUrl) {
                skipped++;
                continue;
            }
            try {
                const imageUrl = await searchImage(word.text);
                if (imageUrl) {
                    await updateDoc(doc(db, 'words', word.id), { imageUrl });
                    set((state) => ({
                        words: state.words.map(w =>
                            w.id === word.id ? { ...w, imageUrl } : w
                        )
                    }));
                    updated++;
                } else {
                    skipped++;
                }
            } catch {
                failed++;
            }
        }

        return { updated, skipped, failed };
    }
}));
