import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { useSettingsStore } from '../stores/useSettingsStore';

const functions = getFunctions(app);
const generatePassagesCallable = httpsCallable(functions, 'generatePassages');

export type PassageResult = {
    story: string;
    translation: string;
    targetWords: string[];
    usageMetadata?: any;
};

export const generateReadingPassage = async (words: string[]) => {
    const modelName = useSettingsStore.getState().aiModel;
    const result = await generatePassagesCallable({ wordSets: [words], model: modelName });
    const data = result.data as { passages: PassageResult[] };
    const passage = data.passages[0];
    return {
        story: passage.story,
        translation: passage.translation,
        usageMetadata: passage.usageMetadata,
    };
};

export const generateReadingPassagesBatch = async (wordSets: string[][]): Promise<PassageResult[]> => {
    const modelName = useSettingsStore.getState().aiModel;
    const result = await generatePassagesCallable({ wordSets, model: modelName });
    const data = result.data as { passages: PassageResult[] };
    return data.passages;
};
