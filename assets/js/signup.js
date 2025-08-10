import { db } from "./firebase-init.js";
import { ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { hashPassword } from "./crypto-utils.js";

const signupForm = document.querySelector(".auth-form");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = signupForm.querySelector('input[placeholder="Name"]').value.trim();
  const email = signupForm.querySelector('input[placeholder="Email"]').value.trim();
  const password = signupForm.querySelector('input[placeholder="Password"]').value;

  if (!name || !email || !password) {
    alert("Please fill all fields");
    return;
  }

  const hashedPass = await hashPassword(password);

  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `users`));

  // Check if email already exists
  let emailExists = false;
  snapshot.forEach(userSnap => {
    if (userSnap.val().email === email) {
      emailExists = true;
    }
  });

  if (emailExists) {
    alert("Email already registered");
    return;
  }

  // Create new user ID
  const uid = Date.now().toString();

  await set(ref(db, `users/${uid}`), {
    name,
    email,
    password: hashedPass
  });

  alert("Sign up successful! Please sign in.");
  window.location.href = "signin.html";
});
