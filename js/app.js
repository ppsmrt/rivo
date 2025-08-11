import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ===== Auth Check ===== */
const publicPages = ["login.html", "signup.html"];
const currentPage = location.pathname.split("/").pop();

onAuthStateChanged(auth, user => {
  if (!user && !publicPages.includes(currentPage)) {
    // Redirect if user not logged in
    window.location.href = "login.html";
  }
  if (user && publicPages.includes(currentPage)) {
    // Already logged in, redirect to feed
    window.location.href = "index.html";
  }
});

/* ===== Global Logout Handler ===== */
document.addEventListener("click", e => {
  if (e.target.closest("#logoutBtn")) {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  }
});
