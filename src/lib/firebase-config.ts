
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage"; // Ensure this line is present

// Your web app's Firebase configuration
// IMPORTANT: Make sure these are your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA9F3nRJhZfndpPat2LPfSXCyBVV41n2qw",
  authDomain: "the-big-day-31aox.firebaseapp.com",
  projectId: "the-big-day-31aox",
  storageBucket: "the-big-day-31aox.firebasestorage.app", // Correct Firebase Storage bucket name
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
const storage: FirebaseStorage = getStorage(app); // Initialize Firebase Storage

export { app, auth, db, storage, firebaseConfig }; // Export storage
