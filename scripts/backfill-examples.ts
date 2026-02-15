/**
 * One-off migration script to backfill example sentences and source
 * for existing words.
 *
 * Run with: npx tsx scripts/backfill-examples.ts <email> <password>
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
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
const auth = getAuth(app);
const db = getFirestore(app);

const FREE_DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const WIKTIONARY_URL = 'https://en.wiktionary.org/api/rest_v1/page/definition';

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

async function fetchDefinition(word: string): Promise<{ examples: string[]; source: string } | null> {
    // Try Free Dictionary first
    try {
        const res = await fetch(`${FREE_DICT_URL}/${encodeURIComponent(word)}`);
        if (res.ok) {
            const data = (await res.json())[0];
            const examples = (data.meanings || [])
                .map((m: any) => m.definitions?.[0]?.example)
                .filter(Boolean);
            return { examples, source: 'Free Dictionary' };
        }
    } catch { /* fall through */ }

    // Fallback to Wiktionary
    try {
        const slug = word.replace(/ /g, '_');
        const res = await fetch(`${WIKTIONARY_URL}/${encodeURIComponent(slug)}`, {
            headers: { 'User-Agent': 'TangoroidApp/1.0 (vocab learning app)' },
        });
        if (res.ok) {
            const data = await res.json();
            const entries = data.en;
            if (entries && entries.length > 0) {
                const examples = entries
                    .flatMap((entry: any) => entry.definitions || [])
                    .map((d: any) => d.examples?.[0] ? stripHtml(d.examples[0]) : null)
                    .filter(Boolean);
                return { examples, source: 'Wiktionary' };
            }
        }
    } catch { /* fall through */ }

    return null;
}

async function backfillExamples() {
    const [,, email, password] = process.argv;
    if (!email || !password) {
        console.error('Usage: npx tsx scripts/backfill-examples.ts <email> <password>');
        process.exit(1);
    }

    console.log(`Signing in as ${email}...`);
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Authenticated (uid: ${user.uid})\n`);

    console.log('Starting examples backfill...\n');

    const q = query(collection(db, 'words'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const docSnap of snapshot.docs) {
        const wordData = docSnap.data();
        const wordText = wordData.text;
        processed++;

        // Skip if already has examples and source
        if (wordData.source && wordData.examples?.length > 0) {
            console.log(`  skip  "${wordText}" (already has data)`);
            skipped++;
            continue;
        }

        console.log(`  fetch "${wordText}"...`);
        const result = await fetchDefinition(wordText);

        if (!result) {
            console.log(`  FAIL  "${wordText}" (not found in either API)`);
            failed++;
            continue;
        }

        try {
            await updateDoc(doc(db, 'words', docSnap.id), {
                examples: result.examples,
                source: result.source,
            });
            console.log(`  OK    "${wordText}" -> ${result.examples.length} example(s), via ${result.source}`);
            updated++;
        } catch (error) {
            console.error(`  FAIL  "${wordText}":`, error);
            failed++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\nDone: ${processed} processed, ${updated} updated, ${skipped} skipped, ${failed} failed`);
}

backfillExamples()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
