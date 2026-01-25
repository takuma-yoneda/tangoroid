/**
 * One-off migration script to backfill phonetic and audio data for existing words.
 * 
 * Run this with: npx tsx scripts/backfill-audio.ts
 * (Install tsx first: npm install -D tsx)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

async function fetchWordDefinition(word: string) {
    try {
        const response = await fetch(`${BASE_URL}/${word}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error(`Error fetching ${word}:`, error);
        return null;
    }
}

async function backfillAudioData() {
    console.log('🔄 Starting backfill process...\n');

    const wordsRef = collection(db, 'words');
    const snapshot = await getDocs(wordsRef);

    let processed = 0;
    let updated = 0;
    let failed = 0;

    for (const docSnap of snapshot.docs) {
        const wordData = docSnap.data();
        const wordId = docSnap.id;
        const wordText = wordData.text;

        processed++;

        // Skip if already has audio and phonetic
        if (wordData.audio && wordData.phonetic) {
            console.log(`⏭️  Skipping "${wordText}" (already has data)`);
            continue;
        }

        console.log(`🔍 Processing "${wordText}"...`);

        // Fetch definition data
        const data = await fetchWordDefinition(wordText);
        if (!data) {
            console.log(`❌ No data found for "${wordText}"`);
            failed++;
            continue;
        }

        let phonetic = data.phonetic;
        let audio = '';

        if (data.phonetics && Array.isArray(data.phonetics)) {
            // Prefer UK accent (as per user settings)
            const ukPatterns = ['-uk.mp3', '-uk-', 'uk.mp3', '-gb.mp3', '-gb-', 'gb.mp3'];

            let audioEntry = data.phonetics.find((p: any) =>
                p.audio && p.audio !== '' &&
                ukPatterns.some(pattern => p.audio.toLowerCase().includes(pattern))
            );

            // Fallback to any audio
            if (!audioEntry) {
                audioEntry = data.phonetics.find((p: any) => p.audio && p.audio !== '');
            }

            if (audioEntry) {
                audio = audioEntry.audio;
                if (audio.startsWith('//')) {
                    audio = 'https:' + audio;
                }
            }

            // Find phonetic text if missing
            if (!phonetic) {
                const textEntry = data.phonetics.find((p: any) => p.text && p.text !== '');
                if (textEntry) {
                    phonetic = textEntry.text;
                }
            }
        }

        // Update Firestore document
        try {
            await updateDoc(doc(db, 'words', wordId), {
                phonetic: phonetic || null,
                audio: audio || null
            });
            console.log(`✅ Updated "${wordText}" (phonetic: ${phonetic || 'N/A'}, audio: ${audio ? 'YES' : 'NO'})`);
            updated++;
        } catch (error) {
            console.error(`❌ Failed to update "${wordText}":`, error);
            failed++;
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Summary:');
    console.log(`   Total processed: ${processed}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped: ${processed - updated - failed}`);
}

// Run the migration
backfillAudioData()
    .then(() => {
        console.log('\n✨ Migration complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
    });
