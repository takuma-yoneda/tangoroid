# Migration Scripts

This directory contains one-off migration scripts for updating existing data in Firestore.

## Running Migrations

### Prerequisites
```bash
npm install -D tsx dotenv
```

### Backfill Audio and Phonetic Data

This script fetches missing audio and phonetic data for existing words:

```bash
npx tsx scripts/backfill-audio.ts
```

**What it does:**
- Fetches all words from Firestore
- For words missing `audio` or `phonetic` data, queries the Dictionary API
- Updates Firestore with the fetched data
- Prefers UK accent audio (as per current app settings)

**Safety:**
- Skips words that already have both `audio` and `phonetic`
- Includes rate limiting (100ms between requests)
- Provides detailed logging

## Future Migration Strategy

### Approach 1: Manual Scripts (Current)
- Create a script in `scripts/` directory
- Run manually when needed
- Good for: One-off migrations, controlled rollouts

### Approach 2: Schema Versioning
Add a `schemaVersion` field to documents and handle migrations in the app:

```typescript
// In useWordStore.ts
fetchWords: async () => {
    const words = await getDocs(...);
    words.forEach(async (doc) => {
        const data = doc.data();
        if (!data.schemaVersion || data.schemaVersion < 2) {
            // Run migration logic
            await migrateToV2(doc.id, data);
        }
    });
}
```

### Approach 3: Admin Panel
Create an admin screen in the app:
- Settings → Advanced → "Refresh Word Data"
- Runs migrations for the current user only
- Shows progress and status

### Recommended Pattern
For this app, use **manual scripts** for now:
1. Create script in `scripts/` directory
2. Test on development database first
3. Run on production when ready
4. Document in this README

## Testing Migrations

Always test on a development database first:
1. Create a separate Firebase project for development
2. Copy `.env` to `.env.development` with dev credentials
3. Run: `npx tsx scripts/your-migration.ts`
4. Verify results before running on production
