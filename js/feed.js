import { auth, db } from "./firebase-config.js";
import { ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const feedContainer = document.getElementById("feed");
const uploadInput = document.getElementById("uploadImage");
const captionInput = document.getElementById("captionInput");
const postBtn = document.getElementById("postBtn");

/* ===== Load Feed in Real Time ===== */
function loadFeed() {
  const postsRef = ref(db, "posts");
  onValue(postsRef, snapshot => {
    feedContainer.innerHTML = "";
    const posts = snapshot.val();
    if (posts) {
      Object.entries(posts)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .forEach(([postId, post]) => {
          const postEl = document.createElement("div");
          postEl.className = "post-card";
          postEl.innerHTML = `
            <div class="post-header">
              <img src="assets/icons/user.svg" class="avatar">
              <span>${post.uid}</span>
            </div>
            <img src="${post.image}" class="post-image">
            <div class="post-actions">
              <button class="like-btn" data-id="${postId}">❤️ ${post.likes || 0}</button>
              <button class="comment-btn" data-id="${postId}">💬 ${post.comments ? Object.keys(post.comments).length : 0}</button>
              <button class="share-btn">🔗 Share</button>
            </div>
            <div class="caption">${post.caption || ""}</div>
          `;
          feedContainer.appendChild(postEl);
        });
    }
  });
}

/* ===== Compress and Upload Post ===== */
postBtn.addEventListener("click", () => {
  const file = uploadInput.files[0];
  const caption = captionInput.value.trim();
  if (!file) return alert("Please select an image");
  if (!auth.currentUser) return alert("Please log in");

  compressImage(file, base64 => {
    const postRef = push(ref(db, "posts"));
    set(postRef, {
      uid: auth.currentUser.uid,
      image: base64,
      caption,
      timestamp: Date.now(),
      likes: 0
    }).then(() => {
      uploadInput.value = "";
      captionInput.value = "";
    });
  });
});

/* ===== Like Button Handler ===== */
document.addEventListener("click", e => {
  if (e.target.classList.contains("like-btn")) {
    const postId = e.target.getAttribute("data-id");
    const postRef = ref(db, `posts/${postId}`);
    update(postRef,