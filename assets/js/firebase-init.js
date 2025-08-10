// assets/js/comments.js
// Reusable comment modal + realtime listeners for posts/{postId}/comments
import { db, auth } from "/assets/js/firebase-init.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/*
  initComments({
    openButtonsSelector: '.open-comments', // selector for buttons that open modal; they must have data-post-id attr
    modalSelector: '#commentModal',       // modal DOM selector
    listSelector: '#commentsList',        // inside modal: container to render comments
    formSelector: '#commentForm',         // form to post
    inputSelector: '#commentInput',       // input for comment text
    onOpen?: (postId) => {}               // optional hook when opened
  })
*/
export function initComments(opts = {}) {
  const {
    openButtonsSelector = '.open-comments',
    modalSelector = '#commentModal',
    listSelector = '#commentsList',
    formSelector = '#commentForm',
    inputSelector = '#commentInput',
    onOpen
  } = opts;

  const modal = document.querySelector(modalSelector);
  const listEl = document.querySelector(listSelector);
  const formEl = document.querySelector(formSelector);
  const inputEl = document.querySelector(inputSelector);

  if (!modal || !listEl || !formEl || !inputEl) {
    console.error('comments.js: modal or required elements not found');
    return;
  }

  // Keep track of active listeners so we can unsubscribe when modal closes
  let activeUnsub = null;
  let activePostId = null;

  // Helper to render a single comment
  function renderComment(docId, data, currentUid) {
    // comment container
    const el = document.createElement('div');
    el.className = 'flex items-start gap-3 py-2 border-b border-gray-100';
    el.dataset.commentId = docId;

    // avatar
    const avatar = document.createElement('img');
    avatar.src = data.userAvatar || `https://i.pravatar.cc/40?u=${data.userId || 'anon'}`;
    avatar.className = 'w-8 h-8 rounded-full object-cover';

    // content
    const content = document.createElement('div');
    content.className = 'flex-1';
    content.innerHTML = `<div class="text-sm"><strong>${escapeHtml(data.userName)}</strong> <span class="text-gray-700">${escapeHtml(data.text)}</span></div>
                         <div class="text-xs text-gray-400 mt-1">${timeAgo(data.createdAt?.toDate ? data.createdAt.toDate() : new Date())}</div>`;

    el.appendChild(avatar);
    el.appendChild(content);

    // delete button if owner
    if (currentUid && data.userId === currentUid) {
      const delBtn = document.createElement('button');
      delBtn.className = 'text-xs text-red-500 ml-2';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          await deleteDoc(doc(db, 'posts', activePostId, 'comments', docId));
        } catch (err) {
          console.error('delete comment failed', err);
          alert('Could not delete comment');
        }
      });
      content.appendChild(delBtn);
    }

    return el;
  }

  // open modal and start listening
  async function openForPost(postId) {
    if (!postId) return console.error('comments.js: no postId provided');

    // clear previous UI
    listEl.innerHTML = '';
    inputEl.value = '';
    modal.classList.add('show');

    // call hook
    if (typeof onOpen === 'function') onOpen(postId);

    // unsubscribe previous
    if (activeUnsub) activeUnsub();
    activePostId = postId;

    // Build query: posts/{postId}/comments ordered by createdAt asc
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    // Realtime listener
    activeUnsub = onSnapshot(q, (snap) => {
      listEl.innerHTML = '';
      const currentUid = auth.currentUser ? auth.currentUser.uid : null;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const node = renderComment(docSnap.id, data, currentUid);
        listEl.appendChild(node);
      });
      // scroll to bottom (newest)
      listEl.scrollTop = listEl.scrollHeight;
    }, (err) => {
      console.error('comments onSnapshot error', err);
    });
  }

  // close modal & cleanup
  function closeModal() {
    modal.classList.remove('show');
    if (activeUnsub) activeUnsub();
    activeUnsub = null;
    activePostId = null;
  }

  // wiring open buttons
  document.querySelectorAll(openButtonsSelector).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const postId = btn.dataset.postId || btn.getAttribute('data-post-id');
      openForPost(postId);
    });
  });

  // close on background or close button
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.matches('.close-comments')) closeModal();
  });

  // post a new comment
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert('Sign in to comment');
      return;
    }
    if (!activePostId) return;

    const text = inputEl.value.trim();
    if (!text) return;

    // build comment object
    const comment = {
      userId: user.uid,
      userName: user.displayName || user.email || 'User',
      userAvatar: user.photoURL || `https://i.pravatar.cc/60?u=${user.uid}`,
      text,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'posts', activePostId, 'comments'), comment);
      inputEl.value = '';
      // after add, onSnapshot will update UI
    } catch (err) {
      console.error('add comment failed', err);
      alert('Failed to post comment');
    }
  });

  // export helpers (if needed)
  return {
    openForPost, // you can call this programmatically
    closeModal
  };
}

/* ---------------- helpers ---------------- */
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function timeAgo(d) {
  const seconds = Math.floor((Date.now() - new Date(d)) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds/60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes/60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours/24);
  return `${days}d`;
}
