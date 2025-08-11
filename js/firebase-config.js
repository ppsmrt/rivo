// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);