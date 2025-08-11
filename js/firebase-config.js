// ===== Import Firebase SDK Modules =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ===== Your Web App's Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyCzi5YSMFfgnJF2xT29Yt8_PbpTyTt7Bdk",
  authDomain: "rivo-bea46.firebaseapp.com",
  databaseURL: "https://rivo-bea46-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rivo-bea46",
  storageBucket: "rivo-bea46.appspot.com",
  messagingSenderId: "9253016287",
  appId: "1:9253016287:web:f584476c79e78215f40f6a",
  measurementId: "G-RY85VPHXVP"
};

// ===== Initialize Firebase =====
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// ===== Export for other scripts =====
export { app, analytics, auth, db, storage };
