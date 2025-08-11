import { db, storage, auth } from "./firebase-config.js";
import { ref as dbRef, onValue, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* ===== Elements ===== */
const feedEl = document.getElementById('feed');
const imageUploadInput = document.getElementById('imageUpload');

/* ===== Load Posts from Firebase ===== */
onValue(dbRef(db, 'posts'), snapshot => {
  const data = snapshot.val();
  if (data) {
    feedEl.innerHTML = ''; // Remove demo posts
    const posts = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
    posts.forEach(post => {
      feedEl.innerHTML += renderPost(post);
    });
  }
});

/* ===== Render Post HTML ===== */
function renderPost(post) {
  return `
    <article class="post">
      <header>
        <img src="${post.userAvatar || 'assets/icons/default.png'}" class="avatar">
        <span class="username">${post.username || 'Anonymous'}</span>
      </header>
      <img src="${post.image}" class="post-image">
      <div class="actions">
        <button class="like-btn">❤️</button>
        <button class="comment-btn">💬</button>
        <button class="share-btn">🔗</button>
      </div>
      <p class="caption"><strong>${post.username || 'Anonymous'}</strong> ${post.caption || ''}</p>
    </article>
  `;
}

/* ===== Image Upload Handling ===== */
imageUploadInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Compress image
  const compressedBlob = await compressImage(file, 0.7); // 70% quality
  const compressedFile = new File([compressedBlob], file.name, { type: file.type });

  // Upload to Firebase Storage
  const storagePath = `posts/${Date.now()}-${file.name}`;
  const imgRef = storageRef(storage, storagePath);
  await uploadBytes(imgRef, compressedFile);
  const imageUrl = await getDownloadURL(imgRef);

  // Save post data in Firebase Database
  const postRef = push(dbRef(db, 'posts'));
  await set(postRef, {
    username: auth.currentUser?.displayName || "Anonymous",
    userAvatar: auth.currentUser?.photoURL || "assets/icons/default.png",
    image: imageUrl,
    caption: "New post!",
    timestamp: Date.now()
  });

  alert("Image uploaded successfully!");
});

/* ===== Compress Image Function ===== */
function compressImage(file, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 800; // Resize if larger
      const scaleSize = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scaleSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob),
        file.type,
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}
