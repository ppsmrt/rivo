// assets/js/comments.js
import { db, auth } from './firebase-init.js';
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function addComment(postId, text) {
    if (!auth.currentUser) return alert("Login to comment");
    const commentRef = push(ref(db, `posts/${postId}/comments`));
    set(commentRef, {
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || "Anonymous",
        text: text,
        timestamp: Date.now()
    });
}

export function listenForComments(postId, callback) {
    const commentsRef = ref(db, `posts/${postId}/comments`);
    onValue(commentsRef, (snapshot) => {
        callback(snapshot.val() || {});
    });
}