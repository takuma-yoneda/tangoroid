const FREE_DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const WIKTIONARY_URL = 'https://en.wiktionary.org/api/rest_v1/page/definition';

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Fetch from the Free Dictionary API. Returns the first entry or throws.
 */
async function fetchFromFreeDictionary(word: string) {
    const response = await fetch(`${FREE_DICT_URL}/${encodeURIComponent(word)}`);
    if (!response.ok) {
        throw new Error(response.status === 404 ? 'not_found' : 'Failed to fetch definition');
    }
    const data = await response.json();
    return { ...data[0], source: 'Free Dictionary' };
}

/**
 * Fetch from the Wiktionary REST API. Normalises the response to match
 * the Free Dictionary shape so the rest of the app doesn't need to care.
 */
async function fetchFromWiktionary(word: string) {
    const slug = word.replace(/ /g, '_');
    const response = await fetch(`${WIKTIONARY_URL}/${encodeURIComponent(slug)}`, {
        headers: { 'User-Agent': 'TangoroidApp/1.0 (vocab learning app)' },
    });
    if (!response.ok) {
        throw new Error(response.status === 404 ? 'not_found' : 'Failed to fetch definition');
    }
    const data = await response.json();

    // Wiktionary groups by language — we only want English
    const entries = data.en;
    if (!entries || entries.length === 0) {
        throw new Error('not_found');
    }

    // Normalise to the Free Dictionary shape: { word, phonetics, meanings, source }
    return {
        word,
        phonetics: [],
        meanings: entries.map((entry: any) => ({
            partOfSpeech: entry.partOfSpeech?.toLowerCase() || '',
            definitions: entry.definitions.map((d: any) => ({
                definition: stripHtml(d.definition),
                examples: (d.examples || []).slice(0, 2).map(stripHtml),
            })),
        })),
        source: 'Wiktionary',
    };
}

/**
 * Try the Free Dictionary API first; fall back to Wiktionary on 404.
 */
export const fetchWordDefinition = async (word: string) => {
    try {
        return await fetchFromFreeDictionary(word);
    } catch (error: any) {
        if (error.message === 'not_found') {
            try {
                return await fetchFromWiktionary(word);
            } catch (wiktError: any) {
                if (wiktError.message === 'not_found') {
                    throw new Error('Word not found in dictionary');
                }
                throw wiktError;
            }
        }
        throw error;
    }
};
