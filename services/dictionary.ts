const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export const fetchWordDefinition = async (word: string) => {
    try {
        const response = await fetch(`${BASE_URL}/${word}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Word not found in dictionary');
            }
            throw new Error('Failed to fetch definition');
        }
        const data = await response.json();
        // API returns an array of entries; we usually want the first one
        return data[0];
    } catch (error) {
        console.error('Dictionary API Error:', error);
        throw error;
    }
};
