const API_KEY = process.env.EXPO_PUBLIC_PIXABAY_API_KEY;
const BASE_URL = 'https://pixabay.com/api/';

export async function searchImage(query: string): Promise<string | null> {
    if (!API_KEY) return null;

    // Try illustration first (better for abstract concepts)
    const illustrationUrl = await fetchPixabay(query, 'illustration');
    if (illustrationUrl) return illustrationUrl;

    // Fall back to photo
    return fetchPixabay(query, 'photo');
}

async function fetchPixabay(query: string, imageType: 'illustration' | 'photo'): Promise<string | null> {
    try {
        const params = new URLSearchParams({
            key: API_KEY!,
            q: query,
            image_type: imageType,
            safesearch: 'true',
            per_page: '3',
        });
        const res = await fetch(`${BASE_URL}?${params}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.hits && data.hits.length > 0) {
            return data.hits[0].webformatURL;
        }
        return null;
    } catch {
        return null;
    }
}
