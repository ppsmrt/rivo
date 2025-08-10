// assets/js/realtime-app.js
// Single-file Realtime Database integration for Rivo app
// Exports a simple API and also wires UI elements (pages import the file).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase, ref, push, set, update, remove, onChildAdded, onValue,
  query, orderByChild, limitToLast, startAt
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ---------- CONFIG: replace databaseURL with your project's Realtime DB URL ----------
const firebaseConfig = {
  apiKey: "AIzaSyCzi5YSMFfgnJF2xT29Yt8_PbpTyTt7Bdk",
  authDomain: "rivo-bea46.firebaseapp.com",
  databaseURL: "YOUR_DATABASE_URL_HERE", // <<--- REPLACE THIS (example: https://rivo-bea46-default-rtdb.firebaseio.com)
  projectId: "rivo-bea46",
  storageBucket: "rivo-bea46.appspot.com",
  messagingSenderId: "9253016287",
  appId: "1:9253016287:web:f584476c79e78215f40f6a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ---------- Utility helpers ----------
function nowTs() { return Date.now(); }
function uidSafe(u){ return (u || '').replace(/\./g,'-'); /* small sanitize */ }
function el(sel){ return document.querySelector(sel); }
function elAll(sel){ return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// ---------- AUTH & user profile ----------
export async function signIn() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
export async function signOutUser() { return signOut(auth); }

onAuthStateChanged(auth, async (user) => {
  // If user signed in, ensure profile exists in /users/{uid}
  if (user) {
    const uRef = ref(db, `users/${user.uid}`);
    // set minimal info (merge-like behavior for RTDB)
    await set(uRef, {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastSeen: nowTs()
    }, { priority: nowTs() }).catch(()=>{}); // if this fails ignore
  }
  // fire an event for pages
  window.dispatchEvent(new CustomEvent('rivo:authChange', { detail: user }));
});

// ---------- FOLLOW / UNFOLLOW ----------
export async function followUser(meUid, targetUid) {
  // following/{meUid}/{targetUid} = true
  // followers/{targetUid}/{meUid} = true
  if (!meUid || !targetUid) throw new Error('uids needed');
  await set(ref(db, `following/${meUid}/${targetUid}`), true);
  await set(ref(db, `followers/${targetUid}/${meUid}`), true);
  // push notification to target
  const noteRef = push(ref(db, `notifications/${targetUid}`));
  await set(noteRef, { type: 'follow', from: meUid, createdAt: nowTs(), read: false });
}

export async function unfollowUser(meUid, targetUid) {
  if (!meUid || !targetUid) throw new Error('uids needed');
  await remove(ref(db, `following/${meUid}/${targetUid}`));
  await remove(ref(db, `followers/${targetUid}/${meUid}`));
}

// ---------- CREATE POST (simple demo using image URL) ----------
/*
  post shape:
  posts/{postId} = {
    postId, authorId, authorName, authorPhoto, imageUrl, videoUrl, caption, createdAt, likesCount:0
  }
*/
export async function createPost({ authorId, authorName, authorPhoto, imageUrl, videoUrl, caption = '' }) {
  if (!authorId) throw new Error('authorId required');
  const pRef = push(ref(db, 'posts'));
  const postId = pRef.key;
  const post = {
    postId,
    authorId,
    authorName: authorName || '',
    authorPhoto: authorPhoto || '',
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || '',
    caption: caption || '',
    createdAt: nowTs(),
    likesCount: 0
  };
  await set(pRef, post);
  return postId;
}

// ---------- LIKE / UNLIKE ----------
/*
  - Like stored at posts/{postId}/likes/{uid} = true
  - likesCount updated atomically by read+write in client (RTDB has no atomic increment). For production, use Cloud Function.
*/
export async function toggleLike(postId, uid) {
  if (!postId || !uid) throw new Error('postId & uid required');
  const likeRef = ref(db, `posts/${postId}/likes/${uid}`);
  const likeSnap = await new Promise(resolve => onValue(likeRef, s => { resolve(s); }, { onlyOnce: true }));
  const liked = likeSnap.exists();

  if (liked) {
    await remove(likeRef);
    // decrement likesCount
    const countRef = ref(db, `posts/${postId}/likesCountTemp`); // temp path to attempt safe update
    // read current likesCount and write (client side)
    const postRef = ref(db, `posts/${postId}`);
    const postSnap = await new Promise(r => onValue(postRef, s => r(s), { onlyOnce: true }));
    const cur = postSnap.val()?.likesCount || 0;
    await update(postRef, { likesCount: Math.max(0, cur - 1) });
  } else {
    await set(likeRef, true);
    // increment likesCount
    const postRef = ref(db, `posts/${postId}`);
    const postSnap = await new Promise(r => onValue(postRef, s => r(s), { onlyOnce: true }));
    const cur = postSnap.val()?.likesCount || 0;
    await update(postRef, { likesCount: cur + 1 });
    // send notification to author
    const post = postSnap.val();
    if (post && post.authorId && post.authorId !== uid) {
      const noteRef = push(ref(db, `notifications/${post.authorId}`));
      await set(noteRef, { type: 'like', from: uid, postId, createdAt: nowTs(), read: false });
    }
  }
}

// ---------- COMMENTS ----------
/*
  /posts/{postId}/comments/{commentId} = { userId, userName, userAvatar, text, createdAt }
*/
export async function addComment(postId, { userId, userName, userAvatar, text }) {
  if (!postId || !userId || !text) throw new Error('missing fields');
  const cRef = push(ref(db, `posts/${postId}/comments`));
  await set(cRef, { userId, userName: userName||'', userAvatar: userAvatar||'', text, createdAt: nowTs() });
  // notify post author
  const postSnap = await new Promise(r => onValue(ref(db, `posts/${postId}`), s => r(s), { onlyOnce: true }));
  const post = postSnap.val();
  if (post && post.authorId && post.authorId !== userId) {
    const noteRef = push(ref(db, `notifications/${post.authorId}`));
    await set(noteRef, { type: 'comment', from: userId, postId, createdAt: nowTs(), read: false });
  }
  return cRef.key;
}

export async function deleteComment(postId, commentId, userId) {
  const cRef = ref(db, `posts/${postId}/comments/${commentId}`);
  // check ownership
  const s = await new Promise(r => onValue(cRef, snap => r(snap), { onlyOnce: true }));
  if (!s.exists()) throw new Error('comment not found');
  const data = s.val();
  if (data.userId !== userId) throw new Error('not owner');
  return remove(cRef);
}

// ---------- STORIES (simple) ----------
export async function createStory(userId, { imageUrl, expiresInSeconds = 24*3600 }) {
  if (!userId || !imageUrl) throw new Error('missing');
  const sRef = push(ref(db, `stories/${userId}`));
  const expiresAt = nowTs() + (expiresInSeconds * 1000);
  await set(sRef, { storyId: sRef.key, imageUrl, createdAt: nowTs(), expiresAt });
  return sRef.key;
}

// ---------- NOTIFICATIONS: mark read ----------
export function listenNotifications(userId, cb) {
  if (!userId) return; // noop
  const nRef = ref(db, `notifications/${userId}`);
  return onValue(nRef, (snap) => {
    const arr = [];
    snap.forEach(child => arr.push({ id: child.key, ...child.val() }));
    cb(arr);
  });
}
export async function markNotificationRead(userId, notificationId) {
  await update(ref(db, `notifications/${userId}/${notificationId}`), { read: true });
}

// ---------- REALTIME FEED (followed users only) ----------
// Strategy: listen for posts added (global), filter client-side using /following/{meUid}
// For infinite scroll: fetch server batches (limitToLast) and filter client-side until we show the requested page size.
export function initRealtimeFeedUI(opts = {}) {
  // opts: feedRootSelector, signInBtnSelector, signOutBtnSelector, uploadLinkSelector
  const feedRoot = el(opts.feedRootSelector || '#feedRoot') || document.body;
  const signInBtn = el(opts.signInBtnSelector || '#signInBtn');
  const signOutBtn = el(opts.signOutBtnSelector || '#signOutBtn');
  const commentModalFn = opts.commentModalFn || null;

  // wire sign in/out
  signInBtn?.addEventListener('click', () => signIn());
  signOutBtn?.addEventListener('click', () => signOutUser());

  // keep list of followed users for current user
  let followingSet = new Set();
  let meUid = null;

  async function loadFollowing(uid) {
    if (!uid) { followingSet = new Set(); return; }
    meUid = uid;
    const fSnap = await new Promise(r => onValue(ref(db, `following/${uid}`), s => r(s), { onlyOnce: true }));
    let arr = [];
    if (fSnap.exists()) {
      fSnap.forEach(c => arr.push(c.key));
    }
    // include self
    if (!arr.includes(uid)) arr.unshift(uid);
    followingSet = new Set(arr);
  }

  // initial batch + infinite scroll state
  let lastServerKey = null;
  const SERVER_BATCH = opts.serverBatch || 30;
  const PAGE_SIZE = opts.pageSize || 10;
  let fetching = false;
  let ended = false;

  async function loadMore() {
    if (fetching || ended) return;
    fetching = true;

    // build query for posts ordered by createdAt (we store createdAt as timestamp)
    let q;
    if (!lastServerKey) {
      q = query(ref(db, 'posts'), orderByChild('createdAt'), limitToLast(SERVER_BATCH));
    } else {
      // startAfter equivalent: RTDB doesn't support startAfter by key easily; we'll use startAt with lastServerCreatedAt+1
      const lastSnap = await new Promise(r => onValue(ref(db, `posts/${lastServerKey}`), s => r(s), { onlyOnce: true }));
      const lastCreated = lastSnap.exists() ? lastSnap.val().createdAt : 0;
      q = query(ref(db, 'posts'), orderByChild('createdAt'), startAt(lastCreated+1), limitToLast(SERVER_BATCH));
    }

    // get the snapshot once (we use onValue one-time)
    const result = await new Promise(r => onValue(q, snap => r(snap), { onlyOnce: true }));
    if (!result.exists()) { ended = true; fetching = false; return; }

    // convert to array sorted newest-first
    const items = [];
    result.forEach(child => items.push({ key: child.key, val: child.val() }));
    items.sort((a,b)=> (b.val.createdAt||0) - (a.val.createdAt||0));

    // filter by followingSet and render PAGE_SIZE posts (or continue pulling from server items)
    let added = 0;
    for (const it of items) {
      const data = it.val;
      if (!followingSet.has(data.authorId)) continue;
      if (!document.getElementById(`post-${it.key}`)) {
        renderPostCard(it.key, data, feedRoot);
        added++;
        if (added >= PAGE_SIZE) break;
      }
    }

    // set lastServerKey to last element in items (cursor)
    lastServerKey = items.length ? items[items.length - 1].key : lastServerKey;
    // if server gave less than SERVER_BATCH, likely end
    if (items.length < SERVER_BATCH) ended = true;

    fetching = false;
  }

  // listen for new posts globally: when a post is added and it's from a followed user, prepend or append
  onChildAdded(ref(db, 'posts'), (snap) => {
    const data = snap.val();
    const key = snap.key;
    if (followingSet.has(data.authorId)) {
      // only add if UI doesn't already contain it
      if (!document.getElementById(`post-${key}`)) {
        renderPostCard(key, data, feedRoot, true);
      }
    }
  });

  // Expose a function to initialize when a user logs in
  async function onUserChanged(user) {
    if (!user) {
      feedRoot.innerHTML = `<div class="text-center py-10 text-gray-500">Sign in to view your feed</div>`;
      followingSet = new Set();
      meUid = null;
      lastServerKey = null; ended = false;
      return;
    }
    await loadFollowing(user.uid);
    // clear feed
    feedRoot.innerHTML = '';
    lastServerKey = null; ended = false;
    // load initial page
    await loadMore();
  }

  // wire auth change event from window (our onAuthStateChanged dispatches 'rivo:authChange')
  window.addEventListener('rivo:authChange', (e) => onUserChanged(e.detail));

  // infinite scroll handler
  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 600)) {
      loadMore();
    }
  });

  // public API
  return { loadMore, onUserChanged };
}

// ---------- Small UI helper: render post card (basic) ----------
export function renderPostCard(postId, data, containerEl, prepend = false) {
  if (!containerEl) containerEl = el('#feedRoot') || document.body;
  if (document.getElementById(`post-${postId}`)) return;

  const card = document.createElement('article');
  card.id = `post-${postId}`;
  card.className = 'post-card';

  // header
  const header = document.createElement('div');
  header.className = 'flex items-center gap-3 p-4';
  header.innerHTML = `<img src="${escapeHtml(data.authorPhoto||`https://i.pravatar.cc/40?u=${data.authorId||'anon'}`)}" class="w-10 h-10 rounded-full object-cover">
                      <div><div class="font-semibold">${escapeHtml(data.authorName||'User')}</div>
                      <div class="small-muted text-xs">${new Date(data.createdAt).toLocaleString()}</div></div>`;
  card.appendChild(header);

  // media
  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'relative post-media bg-black';
  let media;
  if (data.videoUrl) {
    media = document.createElement('video');
    media.src = data.videoUrl;
    media.controls = true;
  } else {
    media = document.createElement('img');
    media.src = data.imageUrl || '';
    media.loading = 'lazy';
  }
  media.className = 'w-full';
  mediaWrap.appendChild(media);
  card.appendChild(mediaWrap);

  // actions
  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-4 p-3';
  const likeBtn = document.createElement('button');
  likeBtn.textContent = `❤ ${data.likesCount || 0}`;
  likeBtn.className = 'like-btn';
  likeBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) { alert('Sign in to like'); return; }
    await toggleLike(postId, user.uid);
  });
  actions.appendChild(likeBtn);

  const commentBtn = document.createElement('button');
  commentBtn.textContent = `💬`;
  commentBtn.addEventListener('click', () => {
    // open comments modal (custom)
    window.dispatchEvent(new CustomEvent('rivo:openComments', { detail: { postId } }));
  });
  actions.appendChild(commentBtn);

  card.appendChild(actions);

  // caption
  const caption = document.createElement('div');
  caption.className = 'p-3';
  caption.innerHTML = `<b>${escapeHtml(data.authorName||'')}</b> ${escapeHtml(data.caption||'')}`;
  card.appendChild(caption);

  if (prepend) containerEl.prepend(card); else containerEl.appendChild(card);

  // live subscribe to likes & comments counts
  onValue(ref(db, `posts/${postId}/likes`), snap => {
    const count = snap.exists() ? Object.keys(snap.val()).length : 0;
    likeBtn.textContent = `❤ ${count}`;
  });
  onValue(ref(db, `posts/${postId}/comments`), snap=> {
    // optionally show comment count somewhere
  });

  return card;
}

// ---------- Export convenience for pages that want direct helpers ----------
window.RivoRealtime = {
  createPost, toggleLike, addComment, deleteComment, followUser, unfollowUser, createStory,
  initRealtimeFeedUI, listenNotifications
};
