# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start Expo dev server (all platforms)
npx expo start

# Platform-specific
npx expo start --web
npx expo start --ios
npx expo start --android

# Type checking (no test suite exists)
npx tsc --noEmit

# Deploy Cloud Functions
cd functions && npm run deploy
```

There is no linter, formatter, or test runner configured. The only verification step is `npx tsc --noEmit`.

## Architecture

**Tangoroid** is a vocabulary learning app built with Expo SDK 54 + React Native 0.81 + TypeScript. It uses file-based routing via Expo Router and targets web, iOS, and Android.

### Routing (Expo Router)

- `app/_layout.tsx` — Root layout. Handles Firebase auth state, redirects between `(auth)` and `(tabs)` groups, wraps everything in React Navigation `ThemeProvider`.
- `app/(auth)/` — Login and signup screens (shown when logged out).
- `app/(tabs)/` — Main tab navigation: Home, Words, Read, Settings.
- `app/new-word.tsx` — Modal screen for adding words (opened from Words tab).
- `app/word/[id].tsx` — Word detail screen (dynamic route).
- `app/review.tsx` — SRS flashcard review session.

### State Management (Zustand)

Three stores in `stores/`:
- `useAuthStore` — Firebase `User` object and loading state (not persisted).
- `useWordStore` — Words array, CRUD operations, SRS updates, backfill utilities. All operations sync to Firestore.
- `useSettingsStore` — AI model, accent preference, theme. Persisted via AsyncStorage with `zustand/middleware/persist`.

### Services

- `services/firebase.ts` — Firebase init with platform-aware auth persistence (web uses browser persistence, native uses AsyncStorage). Config via `EXPO_PUBLIC_FIREBASE_*` env vars.
- `services/gemini.ts` — Calls `generatePassages` Cloud Function via `httpsCallable`. Passes selected AI model from settings store.
- `services/dictionary.ts` — Fetches definitions from Free Dictionary API with Wiktionary fallback. Normalizes both to same shape.
- `services/images.ts` — Pixabay image search (illustration first, photo fallback). Requires `EXPO_PUBLIC_PIXABAY_API_KEY`.
- `services/autocomplete.ts` — Datamuse API for word suggestions.
- `services/srs.ts` — SM-2 spaced repetition algorithm. Returns `{ interval, repetitions, easeFactor, nextReview }`.

### Cloud Functions (`functions/src/index.ts`)

Firebase Cloud Functions v2. Two exports:
- `generatePassages` — Authenticated callable that proxies Gemini API. Takes `wordSets` (array of word arrays) and `model` name. Returns bilingual passages (English + Japanese) with highlighted vocabulary.
- `capBilling` — PubSub listener that disables billing when budget is exceeded.

### Theming

Dark mode is implemented via:
- `constants/colors.ts` — `lightColors` and `darkColors` palettes with semantic keys.
- `hooks/useColors.ts` — Returns active palette based on `theme` from settings store.
- Every screen uses `useMemo(() => StyleSheet.create({...}), [colors])` for dynamic styles.
- Root layout applies a custom React Navigation theme and sets `StatusBar` style.

### External APIs

| API | Purpose | Auth |
|-----|---------|------|
| Firebase Auth | User authentication | `EXPO_PUBLIC_FIREBASE_*` env vars |
| Firestore | Word storage, reading passages | Same Firebase project |
| Gemini (via Cloud Function) | Reading passage generation | `GEMINI_API_KEY` secret in Functions |
| Free Dictionary API | Word definitions | None |
| Wiktionary REST API | Fallback definitions | None |
| Pixabay | Word images | `EXPO_PUBLIC_PIXABAY_API_KEY` |
| Datamuse | Autocomplete suggestions | None |

### Key Patterns

- **Platform branching**: `services/firebase.ts` uses `Platform.OS` to choose auth persistence strategy. `app/word/[id].tsx` uses it for delete confirmation (web `confirm()` vs native `Alert.alert()`).
- **Accent-aware audio**: When fetching word definitions, audio URL selection prioritizes the user's accent preference (US/UK/AU) from settings.
- **SRS scheduling**: Words are filtered for review by comparing `srs.nextReview` to `Date.now()`. The review screen uses a queue with four rating buttons (Again/Hard/Good/Easy) that update Firestore in real-time.

## Environment Variables

Required in `.env` (prefixed `EXPO_PUBLIC_` for Expo):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_PIXABAY_API_KEY`

Cloud Functions secret (set via `firebase functions:secrets:set`):
- `GEMINI_API_KEY`
