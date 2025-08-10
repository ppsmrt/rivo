// ==========================
// Firebase Social Actions
// Shared JS for Likes & Comments
// ==========================

// --------------------------
// LIKE SYSTEM
// --------------------------
function toggleLike(postId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please login to like posts.");
    return;
  }

  const likeRef = firebase.database().ref(`posts/${postId}/likes/${user.uid}`);

  likeRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
      likeRef.remove(); // Unlike
    } else {
      likeRef.set(true); // Like
    }
  });
}

function listenForLikes(postId, likeCountElement, likeButtonElement) {
  const user = firebase.auth().currentUser;
  const likesRef = firebase.database().ref(`posts/${postId}/likes`);

  likesRef.on('value', snapshot => {
    const likes = snapshot.val() || {};
    likeCountElement.textContent = Object.keys(likes).length;

    if (user && likes[user.uid]) {
      likeButtonElement.classList.add("liked");
    } else {
      likeButtonElement.classList.remove("liked");
    }
  });
}

// --------------------------
// COMMENT SYSTEM
// --------------------------
function addComment(postId, commentText) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please login to comment.");
    return;
  }
  if (!commentText.trim()) return;

  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push();
  commentRef.set({
    userId: user.uid,
    text: commentText.trim(),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

function listenForComments(postId, commentListElement) {
  const commentsRef = firebase.database().ref(`posts/${postId}/comments`);

  commentsRef.on('child_added', snapshot => {
    const comment = snapshot.val();
    if (comment) {
      const li = document.createElement("li");
      li.textContent = `${comment.text}`;
      commentListElement.appendChild(li);
    }
  });
}

// --------------------------
// EXPORT (if using modules)
// --------------------------
// export { toggleLike, listenForLikes, addComment, listenForComments };
