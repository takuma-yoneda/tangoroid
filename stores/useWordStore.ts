import { create } from 'zustand';
import { db, auth } from '../services/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

export interface Word {
    id: string;
    text: string;
    definitions: Definition[];
    examples: string[];
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
}

interface WordState {
    words: Word[];
    isLoading: boolean;
    addWord: (text: string, data: any) => Promise<void>;
    fetchWords: () => Promise<void>;
    updateWordSRS: (id: string, newSrs: Word['srs']) => Promise<void>;
    deleteWord: (id: string) => Promise<void>;
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
        const newWord: Omit<Word, 'id'> = {
            text,
            definitions: data.definitions || [],
            examples: data.examples || [],
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
    }
}));
