// assets/js/auth.js
import { auth, db } from "./firebase-init.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/**
 * Sign In with email/password
 */
async function handleSignIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ Signed in:", userCredential.user);
    alert("Signed in successfully!");
    window.location.href = "index.html"; // redirect after login
  } catch (error) {
    console.error("❌ Sign in error:", error);
    alert(error.message);
  }
}

/**
 * Sign Up with email/password
 */
async function handleSignUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ Account created:", userCredential.user);

    // Save basic user profile in Realtime DB
    await set(ref(db, "users/" + userCredential.user.uid), {
      email: email,
      createdAt: Date.now()
    });

    alert("Account created successfully!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Sign up error:", error);
    alert(error.message);
  }
}

/**
 * Event Listeners
 */

// Email/Password Sign In
const signinForm = document.querySelector(".auth-form");
if (signinForm && signinForm.querySelector("#signin-email")) {
  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value.trim();
    handleSignIn(email, password);
  });
}

// Email/Password Sign Up
if (signinForm && signinForm.querySelector("#signup-email")) {
  signinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    handleSignUp(email, password);
  });
}
