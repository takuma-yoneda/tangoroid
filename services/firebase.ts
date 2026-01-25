import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Use initializeAuth with persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
