// assets/js/auth.js
import { auth, db } from "/assets/js/firebase-init.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const user = res.user;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastSeen: serverTimestamp()
  }, { merge: true });
  return user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthChanged(cb) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        lastSeen: serverTimestamp()
      }, { merge: true });
      cb(user);
    } else cb(null);
  });
}
