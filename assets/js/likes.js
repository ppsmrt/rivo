// assets/js/likes.js
import { db, auth } from './firebase-init.js';
import { ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function toggleLike(postId) {
    if (!auth.currentUser) return alert("Login to like posts");
    const likeRef = ref(db, `posts/${postId}/likes/${auth.currentUser.uid}`);

    onValue(likeRef, (snapshot) => {
        if (snapshot.exists()) {
            remove(likeRef); // Unlike
        } else {
            set(likeRef, { username: auth.currentUser.displayName || "Anonymous" });
        }
    }, { onlyOnce: true });
}

export function listenForLikes(postId, callback) {
    const likesRef = ref(db, `posts/${postId}/likes`);
    onValue(likesRef, (snapshot) => {
        const likesData = snapshot.val() || {};
        callback(Object.keys(likesData).length, likesData);
    });
}