import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { isLocalMode } from '@/lib/data-mode';

/**
 * Web config for László's existing Firebase project.
 * Override with NEXT_PUBLIC_FIREBASE_* when you deploy your own project.
 * These values are not secret (they ship in the browser) but should still
 * live in the environment for any project other than the original one.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA9F3nRJhZfndpPat2LPfSXCyBVV41n2qw',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'the-big-day-31aox.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'the-big-day-31aox',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'the-big-day-31aox.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '957243914920',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:957243914920:web:4bb45e0b92667ebf7b609d',
};

let app: FirebaseApp | null = null;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (isLocalMode()) {
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
} else {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage, firebaseConfig };
