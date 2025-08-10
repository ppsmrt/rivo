// assets/js/auth.js
import { auth, db } from "/assets/js/firebase-init.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/**
 * signInWithGoogle()
 * - opens Google sign-in popup
 * - writes/updates users/{uid} document with basic profile and lastSeen
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // persist user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      lastSeen: serverTimestamp()
    }, { merge: true });
    return user;
  } catch (err) {
    console.error("Google sign-in failed:", err);
    throw err;
  }
}

/**
 * signOutUser()
 */
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Sign-out failed:", err);
  }
}

/**
 * onAuthChanged(cb)
 * - cb(user|null) is called whenever auth state changes
 */
export function onAuthChanged(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // ensure user doc exists (update lastSeen)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        lastSeen: serverTimestamp()
      }, { merge: true });
      cb(user);
    } else {
      cb(null);
    }
  });
}

/**
 * getCurrentUserDoc(uid)
 */
export async function getUserDoc(uid) {
  const d = doc(db, "users", uid);
  const snap = await getDoc(d);
  return snap.exists() ? snap.data() : null;
}
