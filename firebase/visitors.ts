// firebase/visitors.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const visitorFirebaseConfig = {
  apiKey: "AIzaSyCoVOEuVEfxEe46T3wiUAovNxKzn8A5QGA",
  authDomain: "vintrastudio-92cff.firebaseapp.com",
  projectId: "vintrastudio-92cff",
  storageBucket: "vintrastudio-92cff.firebasestorage.app",
  messagingSenderId: "882697625589",
  appId: "1:882697625589:web:674daf44e76e767bffcabc",
  measurementId: "G-GN2BYPYC15",
};

// ✅ Viktig: bruk et app-navn så den ikke kolliderer med imposter-game appen
const APP_NAME = "vintraVisitors";

const visitorsApp =
  getApps().some((a) => a.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(visitorFirebaseConfig, APP_NAME);

export const visitorsDb = getFirestore(visitorsApp);
export { collection, addDoc, serverTimestamp };
