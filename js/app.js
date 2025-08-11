// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const feed = document.getElementById("feed");

// Function to render posts
function renderPost(user, img, text) {
  return `
    <div class="post">
      <div class="post-header">
        <img src="https://i.pravatar.cc/150?u=${user}" class="profile-pic" alt="Profile">
        <span class="username">@${user}</span>
      </div>
      ${img ? `<img src="${img}" class="post-img" alt="Post Image">` : ""}
      <div class="post-text">${text}</div>
      <div class="post-actions">
        <button>❤️</button>
        <button>💬</button>
        <button>🔗</button>
      </div>
    </div>
  `;
}

// Load posts from Firebase
onValue(ref(db, "posts"), (snapshot) => {
  feed.innerHTML = "";
  snapshot.forEach((child) => {
    const post = child.val();
    feed.innerHTML =
      renderPost(post.user, post.img, post.text) + feed.innerHTML;
  });
});

// Add new post (simple prompt version)
window.addPost = function () {
  const user = prompt("Enter username:");
  const img = prompt("Enter image URL (optional):");
  const text = prompt("Enter post text:");
  if (!user || !text) return;

  const newPostRef = push(ref(db, "posts"));
  set(newPostRef, { user, img, text });
};
