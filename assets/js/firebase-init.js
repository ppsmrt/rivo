// Firebase Initialization (shared across all pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCzi5YSMFfgnJF2xT29Yt8_PbpTyTt7Bdk",
  authDomain: "rivo-bea46.firebaseapp.com",
  databaseURL: "https://rivo-bea46-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rivo-bea46",
  storageBucket: "rivo-bea46.firebasestorage.app",
  messagingSenderId: "9253016287",
  appId: "1:9253016287:web:f584476c79e78215f40f6a",
  measurementId: "G-RY85VPHXVP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

console.log("✅ Firebase initialized globally");