import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Placeholder config - replace with valid details from Firebase Console
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyMockKey",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-app.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "mock-app",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-app.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:mockid"
};

const app = initializeApp(firebaseConfig);

// Platform-aware auth: web uses browser persistence, native uses AsyncStorage
let auth;
if (Platform.OS === 'web') {
    // Metro resolves firebase/auth to the RN bundle (due to react-native condition),
    // which doesn't export browserLocalPersistence. Require it from the browser build.
    const { browserLocalPersistence } = require('@firebase/auth/dist/browser-cjs/index.js');
    auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
    });
} else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

const db = getFirestore(app);

export { app, auth, db };
