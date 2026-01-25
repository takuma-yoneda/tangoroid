import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CloudBillingClient } from "@google-cloud/billing";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const ALLOWED_MODELS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemma-3-27b-it",
  "gemma-3-12b-it",
  "gemma-3-4b-it",
];

const PROJECT_ID = "tangoroid-gemi";

// --- Billing cap: disables billing when budget is exceeded ---

export const capBilling = onMessagePublished("billing-alerts", async (event) => {
  const data = event.data.message.json;

  if (data.costAmount > data.budgetAmount) {
    const billing = new CloudBillingClient();
    await billing.updateProjectBillingInfo({
      name: `projects/${PROJECT_ID}`,
      projectBillingInfo: { billingAccountName: "" },
    });
    console.log(`Billing disabled for ${PROJECT_ID}`);
  }
});

// --- Gemini proxy: generates reading passages server-side ---

export const generatePassages = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { wordSets, model } = request.data;

    if (!ALLOWED_MODELS.includes(model)) {
      throw new HttpsError("invalid-argument", "Invalid model");
    }

    if (!Array.isArray(wordSets) || wordSets.length === 0 || wordSets.length > 5) {
      throw new HttpsError("invalid-argument", "wordSets must be 1-5 arrays of words");
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const genModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as any,
          properties: {
            english: {
              type: "string" as any,
              description:
                "English story with vocabulary words wrapped in **double asterisks**",
            },
            japanese: {
              type: "string" as any,
              description:
                'Japanese translation with words highlighted as 「日本語」(EnglishWord)',
            },
          },
          required: ["english", "japanese"],
        },
      },
    });

    const generateSingle = async (words: string[]) => {
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

      const result = await genModel.generateContent(prompt);
      const response = result.response;
      const parsed = JSON.parse(response.text());

      return {
        story: parsed.english || "",
        translation: parsed.japanese || "",
        targetWords: words,
        usageMetadata: response.usageMetadata || null,
      };
    };

    const results = await Promise.all(wordSets.map(generateSingle));
    return { passages: results };
  }
);
