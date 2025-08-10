// assets/js/comments.js
import { db, auth } from './firebase-init.js';
import { ref, push, set, onChildAdded, remove } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

// Add a comment
export function addComment(postId, commentText) {
    if (!auth.currentUser) {
        alert("You must be logged in to comment.");
        return;
    }
    const commentRef = push(ref(db, `posts/${postId}/comments`));
    set(commentRef, {
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || "Anonymous",
        text: commentText,
        timestamp: Date.now()
    });
}

// Listen for comments in real-time
export function listenForComments(postId, callback) {
    const commentsRef = ref(db, `posts/${postId}/comments`);
    onChildAdded(commentsRef, (snapshot) => {
        const comment = snapshot.val();
        callback({ id: snapshot.key, ...comment });
    });
}

// Delete a comment
export function deleteComment(postId, commentId) {
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
    remove(commentRef)
        .then(() => console.log("Comment deleted"))
        .catch((error) => console.error("Error deleting comment:", error));
}