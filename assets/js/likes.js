// assets/js/likes.js
import { db, auth } from './firebase-init.js';
import { ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

// Toggle like on a post
export function toggleLike(postId) {
    if (!auth.currentUser) {
        alert("You must be logged in to like posts.");
        return;
    }

    const likeRef = ref(db, `posts/${postId}/likes/${auth.currentUser.uid}`);

    onValue(likeRef, (snapshot) => {
        if (snapshot.exists()) {
            // Already liked → remove like
            remove(likeRef);
        } else {
            // Not liked → add like
            set(likeRef, {
                username: auth.currentUser.displayName || "Anonymous",
                timestamp: Date.now()
            });
        }
    }, { onlyOnce: true });
}

// Listen for like count changes
export function listenForLikes(postId, callback) {
    const likesRef = ref(db, `posts/${postId}/likes`);
    onValue(likesRef, (snapshot) => {
        if (snapshot.exists()) {
            const likesData = snapshot.val();
            const count = Object.keys(likesData).length;
            callback(count, likesData);
        } else {
            callback(0, {});
        }
    });
}