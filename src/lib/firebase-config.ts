
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
// IMPORTANT: Make sure these are your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA9F3nRJhZfndpPat2LPfSXCyBVV41n2qw",
  authDomain: "the-big-day-31aox.firebaseapp.com",
  projectId: "the-big-day-31aox",
  storageBucket: "the-big-day-31aox.firebasestorage.app",
  messagingSenderId: "957243914920",
  appId: "1:957243914920:web:4bb45e0b92667ebf7b609d"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig };
