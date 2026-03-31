/**
 * Firebase Configuration — KavachSathi
 * 
 * SECURITY NOTE: In production, these should be in environment variables.
 * For the hackathon demo, we use Firestore in sandbox/emulator mode.
 * 
 * To connect your own Firebase project:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a project → Enable Firestore
 * 3. Copy your config into .env and update this file
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-kavachsathi-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'kavachsathi-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'kavachsathi-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'kavachsathi-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);

// Use emulator in development if available
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('[KAVACH] Firestore and Auth emulators connected');
  } catch (e) {
    // Emulator already connected or not available
  }
}

export { app, db, auth };
export default db;
