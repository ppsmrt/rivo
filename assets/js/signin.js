import { db } from "./firebase-init.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { hashPassword } from "./crypto-utils.js";

const signinForm = document.querySelector(".auth-form");

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signinForm.querySelector('input[placeholder="Email"]').value.trim();
  const password = signinForm.querySelector('input[placeholder="Password"]').value;

  const hashedPass = await hashPassword(password);

  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `users`));

  let foundUser = null;
  snapshot.forEach(userSnap => {
    const user = userSnap.val();
    if (user.email === email && user.password === hashedPass) {
      foundUser = { id: userSnap.key, ...user };
    }
  });

  if (!foundUser) {
    alert("Invalid email or password");
    return;
  }

  // Store session
  localStorage.setItem("user", JSON.stringify(foundUser));
  alert(`Welcome back, ${foundUser.name}!`);
  window.location.href = "index.html";
});
