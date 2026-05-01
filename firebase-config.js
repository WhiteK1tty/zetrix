// ===== FIREBASE CONFIG =====
// Замени эти значения на свои из Firebase Console:
// Project Settings → Your apps → SDK setup and configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDqcgu3v4K97zPwacesd7thoruzoEfCS0U",
  authDomain:        "zetrix-b2a19.firebaseapp.com",
  projectId:         "zetrix-b2a19",
  storageBucket:     "zetrix-b2a19.firebasestorage.app",
  messagingSenderId: "1029571156021",
  appId:             "1:1029571156021:web:e11a085644063d937f797c",
  measurementId:     "G-E0TLKPBJDF"
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence so Firestore works better with intermittent connections
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});
