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
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
    Write a short, engaging paragraph (approx 100-150 words) that naturally incorporates the following vocabulary words: ${words.join(", ")}.
    
    You MUST provide two sections separated by "---SPLIT---":
    1. The English paragraph (Story).
    2. A natural Japanese translation of the paragraph.

    CRITICAL INSTRUCTION:
    - In the English story, highlight the vocabulary words by wrapping them in **double asterisks**.
    - In the Japanese translation, identify the corresponding Japanese words/phrases and highlight them by wrapping them in 「Japanese quotation marks」, AND append the original English word in parentheses immediately after. Format: 「日本語の単語」(EnglishWord).
    - Make very sure to write Japanese. Not Chinese.

    Output format:
    [English Story]
    ---SPLIT---
    [Japanese Translation]
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Manual parsing
        const parts = text.split("---SPLIT---");
        if (parts.length < 2) {
            // Fallback if split fails
            return {
                story: text,
                translation: "Translation generation failed.",
                usageMetadata: response.usageMetadata
            };
        }
        return {
            story: parts[0].trim(),
            translation: parts[1].trim(),
            usageMetadata: response.usageMetadata
        };
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};
