import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCm830gKeBqM9HMF942FsmhOn_zzTbEsXk",
  authDomain: "skl-app-e6f9d.firebaseapp.com",
  projectId: "skl-app-e6f9d",
  storageBucket: "skl-app-e6f9d.firebasestorage.app",
  messagingSenderId: "604250488195",
  appId: "1:604250488195:web:a6314d38f37e229301cab6",
  measurementId: "G-6VDH67LMF5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence);
}

const db = getFirestore(app);

export { app, auth, db };
