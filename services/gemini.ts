import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("Gemini API Key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

import { useSettingsStore } from '../stores/useSettingsStore';

// Using 'gemma-3' as requested. Ensure your API key has access to this model.
// Common alternatives: 'gemini-1.5-flash', 'gemini-1.5-pro'
// const MODEL_NAME = "gemma-3-27b-it";
// const MODEL_NAME = "gemini-flash-lite-latest";

export const generateReadingPassage = async (words: string[]) => {
    if (!API_KEY) throw new Error("API Key missing");

    const modelName = useSettingsStore.getState().aiModel;
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    english: {
                        type: "string",
                        description: "English story with vocabulary words wrapped in **double asterisks**"
                    },
                    japanese: {
                        type: "string",
                        description: "Japanese translation with words highlighted as 「日本語」(EnglishWord)"
                    }
                },
                required: ["english", "japanese"]
            }
        }
    });

    const prompt = `
    Write a short, engaging paragraph (approx 100-150 words) that naturally incorporates the following vocabulary words: ${words.join(", ")}.
    
    Return a JSON object with two fields:
    1. "english": The English paragraph with vocabulary words wrapped in **double asterisks**.
    2. "japanese": A natural Japanese translation with corresponding words highlighted as 「日本語の単語」(EnglishWord).
    
    Example format:
    {
      "english": "The **curious** cat began to **explore** the **vast** garden.",
      "japanese": "「好奇心旺盛な」(curious)猫は「広大な」(vast)庭を「探検」(explore)し始めました。"
    }
    
    IMPORTANT:
    - Write natural, engaging stories
    - Use Japanese (not Chinese) for the translation
    - Ensure vocabulary words are properly highlighted
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const parsed = JSON.parse(text);

        return {
            story: parsed.english || "",
            translation: parsed.japanese || "",
            usageMetadata: response.usageMetadata
        };
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};
