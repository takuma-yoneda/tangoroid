import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AiModel = 'gemini-flash-latest' | 'gemini-flash-lite-latest' | 'gemma-3-27b-it' | 'gemma-3-12b-it' | 'gemma-3-4b-it';
export type AccentPreference = 'us' | 'uk' | 'au';

export const AI_MODELS: AiModel[] = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    'gemma-3-4b-it'
];

export const ACCENTS: { label: string; value: AccentPreference }[] = [
    { label: 'American (US)', value: 'us' },
    { label: 'British (UK)', value: 'uk' },
    { label: 'Australian (AU)', value: 'au' },
];

interface SettingsState {
    aiModel: AiModel;
    setAiModel: (model: AiModel) => void;
    accent: AccentPreference;
    setAccent: (accent: AccentPreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            aiModel: 'gemini-flash-latest',
            setAiModel: (model) => set({ aiModel: model }),
            accent: 'uk',
            setAccent: (accent) => set({ accent }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
