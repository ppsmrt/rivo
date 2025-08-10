// assets/js/index.js
import { db, auth } from "./firebase-init.js";
import { ref as dbRef, onValue } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { importAesKeyFromBase64, decryptArrayBufferAESGCM } from "./crypto-utils.js";

const feedRoot = document.getElementById('feedRoot');
const loading = document.getElementById('loading');

function createPostCard(post) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="flex items-center gap-3 mb-3">
      <img src="${post.authorPhoto || 'https://i.pravatar.cc/40'}" class="w-10 h-10 rounded-full object-cover">
      <div><div class="font-semibold">${escapeHtml(post.authorName)}</div><div class="text-xs text-gray-400">${new Date(post.createdAt).toLocaleString()}</div></div>
    </div>
    <div class="media mb-3" data-storage="${escapeHtml(post.storagePath)}">
      <div class="text-xs text-gray-500">Loading image...</div>
    </div>
    <div class="mb-2">${escapeHtml(post.caption || '')}</div>
  `;
  return el;
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

async function loadEncryptedImageIntoElement(postMeta, mediaContainer) {
  // postMeta: includes downloadURL, encryptionKeyBase64, ivBase64, contentType
  try {
    const res = await fetch(postMeta.downloadURL);
    const cipherBuffer = await res.arrayBuffer();

    // import key then decrypt
    const key = await importAesKeyFromBase64(postMeta.encryptionKeyBase64);
    const plainBuffer = await decryptArrayBufferAESGCM(cipherBuffer, key, postMeta.ivBase64);

    // create blob/url and insert image element
    const blob = new Blob([plainBuffer], { type: postMeta.contentType || 'image/webp' });
    const url = URL.createObjectURL(blob);
    mediaContainer.innerHTML = `<img class="post-img" src="${url}" alt="" />`;
  } catch (err) {
    console.error('Error decrypting image', err);
    mediaContainer.innerHTML = `<div class="text-sm text-red-500">Could not load image</div>`;
  }
}

// realtime feed (simple: listen posts root; you may filter by followed users)
onValue(dbRef(db, 'posts'), (snap) => {
  const posts = [];
  snap.forEach(child => posts.push(child.val()));
  // newest first
  posts.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));

  feedRoot.innerHTML = '';
  if (posts.length === 0) {
    feedRoot.innerHTML = `<div class="text-center text-gray-500 py-8">No posts yet.</div>`;
    return;
  }

  for (const p of posts) {
    const card = createPostCard(p);
    feedRoot.appendChild(card);

    // then load encrypted image & decrypt
    const mediaContainer = card.querySelector('.media');
    loadEncryptedImageIntoElement(p, mediaContainer);
  }
  loading.style.display = 'none';
}, (err) => {
  console.error('feed onValue error', err);
  feedRoot.innerHTML = `<div class="text-center text-red-500 py-8">Failed to load feed.</div>`;
});
