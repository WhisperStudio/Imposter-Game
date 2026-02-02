import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBmaqh-dtHThNnkGdsr8lrNym8Gx1d_eAI",
  authDomain: "imposter-game-53363.firebaseapp.com",
  projectId: "imposter-game-53363",
  storageBucket: "imposter-game-53363.firebasestorage.app",
  messagingSenderId: "384946961506",
  appId: "1:384946961506:web:598c91bdd8fc85516c653b",
  measurementId: "G-0NSBZRJ14H",
};

function getOrInitFirebaseApp(): FirebaseApp {
  // ✅ Hvis det finnes en app, hent den første (default)
  if (getApps().length > 0) return getApps()[0];

  // ✅ Hvis ikke, initier
  return initializeApp(firebaseConfig);
}

export const app = getOrInitFirebaseApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
