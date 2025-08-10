// assets/js/posts.js
import { db } from "/assets/js/firebase-init.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  collectionGroup,
  getDoc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// helper: render post grid item
export function initExplore({ gridEl, modalEls, authUserProvider }) {
  // gridEl = DOM node where posts are appended
  // modalEls = { modal, mediaContainer, avatarEl, userEl, captionEl, likesEl, commentsListEl, commentForm, commentInput }
  // authUserProvider() should return current user or null

  const postsQ = query(collection(db, "posts"), orderBy("timestamp", "desc"));

  onSnapshot(postsQ, (snapshot) => {
    gridEl.innerHTML = "";
    snapshot.forEach(docSnap => {
      const postId = docSnap.id;
      const data = docSnap.data();
      const item = document.createElement("div");
      item.className = "grid-item aspect-square bg-gray-200 rounded-lg overflow-hidden";
      item.dataset.postId = postId;

      if (data.type === "image") {
        item.innerHTML = `<img src="${data.imageUrl}" class="w-full h-full object-cover">`;
      } else {
        item.innerHTML = `<video src="${data.videoUrl}" class="w-full h-full object-cover" muted></video>`;
      }

      // click to open modal
      item.addEventListener("click", () => openPostModal(postId, data, modalEls, authUserProvider));
      gridEl.appendChild(item);
    });
  });
}

function openPostModal(postId, postData, modalEls, authUserProvider) {
  const { modal, mediaContainer, avatarEl, userEl, captionEl, likesEl, commentsListEl, commentForm, commentInput } = modalEls;
  modal.classList.add("show");

  // render media
  mediaContainer.innerHTML = "";
  if (postData.type === "image") {
    const img = document.createElement("img");
    img.src = postData.imageUrl;
    img.className = "w-full max-h-[70vh] object-contain";
    mediaContainer.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = postData.videoUrl;
    video.autoplay = true;
    video.controls = true;
    video.className = "w-full max-h-[70vh] object-contain";
    mediaContainer.appendChild(video);
  }

  avatarEl.src = postData.authorPhoto || `https://i.pravatar.cc/40?u=${postData.authorId || 'anon'}`;
  userEl.textContent = postData.authorName || postData.authorId || "Unknown";
  captionEl.textContent = postData.caption || "";

  // Subscribe to likes subcollection and comments subcollection
  const likesCol = collection(doc(db, "posts", postId), "likes");
  const commentsCol = collection(doc(db, "posts", postId), "comments");

  // realtime update for likes count & whether current user liked
  const likesQuery = query(likesCol);
  const likesUnsub = onSnapshot(likesQuery, (snap) => {
    likesEl.textContent = snap.size + " likes";
    const user = authUserProvider();
    if (user) {
      const liked = snap.docs.some(d => d.id === user.uid);
      likesEl.dataset.liked = liked ? "1" : "0";
    } else {
      likesEl.dataset.liked = "0";
    }
  });

  // comments realtime
  const commentsQuery = query(commentsCol, orderBy("createdAt", "asc"));
  const commentsUnsub = onSnapshot(commentsQuery, (snap) => {
    commentsListEl.innerHTML = "";
    snap.forEach(cs => {
      const c = cs.data();
      const node = document.createElement("div");
      node.className = "flex items-start gap-2 mb-2";
      node.innerHTML = `<img src="${c.userAvatar}" class="w-8 h-8 rounded-full object-cover"><div><b>${c.userName}</b> <div class="text-sm text-gray-700">${c.text}</div></div>`;
      commentsListEl.appendChild(node);
    });
  });

  // attach like handler
  function onLikeToggle() {
    const user = authUserProvider();
    if (!user) {
      alert("Sign in to like posts");
      return;
    }
    const likeDocRef = doc(db, "posts", postId, "likes", user.uid);
    // we will toggle by checking existence
    getDoc(likeDocRef).then(snap => {
      if (snap.exists()) {
        // unlike
        deleteDoc(likeDocRef);
      } else {
        // like
        setDoc(likeDocRef, { userId: user.uid, createdAt: serverTimestamp() });
      }
    });
  }

  // wire like button (we assume likesEl parent has click)
  likesEl.onclick = onLikeToggle;

  // add comment
  commentForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = authUserProvider();
    if (!user) {
      alert("Sign in to comment");
      return;
    }
    const text = commentInput.value.trim();
    if (!text) return;
    const commentsRef = collection(doc(db, "posts", postId), "comments");
    await addDoc(commentsRef, {
      text,
      userId: user.uid,
      userName: user.displayName || user.email || "You",
      userAvatar: user.photoURL || `https://i.pravatar.cc/60?u=${user.uid}`,
      createdAt: serverTimestamp()
    });
    commentInput.value = "";
  };

  // cleanup when modal closes
  modal.querySelector(".close-modal").onclick = () => {
    likesUnsub();
    commentsUnsub();
    modal.classList.remove("show");
    // clear handlers
    likesEl.onclick = null;
    commentForm.onsubmit = null;
  };
}
