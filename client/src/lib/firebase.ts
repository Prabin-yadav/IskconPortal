// Firebase configuration for ISKCON Digital Service Portal
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC0xaEZ0wCmCe47GdAEH9-BGp-V9iIXo0U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "iskcon-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "iskcon-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "iskcon-portal.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "893858558513",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:893858558513:web:77d0532a6499bfee479b10",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
