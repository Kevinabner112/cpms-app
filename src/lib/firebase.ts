import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "cpms-fareast",
  appId: "1:964362472437:web:13e0852254a0f1a403eebc",
  storageBucket: "cpms-fareast.firebasestorage.app",
  apiKey: "AIzaSyDdXWgdIQDlOBI7-NUm8d2LcEDhCPSOifA",
  authDomain: "cpms-fareast.firebaseapp.com",
  messagingSenderId: "964362472437",
  measurementId: "G-YHCSFCE5E1"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
