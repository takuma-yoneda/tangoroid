export const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`https://api.datamuse.com/sug?s=${query}&max=5`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((item: any) => item.word);
    } catch (error) {
        console.error('Autocomplete Error:', error);
        return [];
    }
};
