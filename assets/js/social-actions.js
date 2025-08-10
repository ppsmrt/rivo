// Handle likes
function toggleLike(postId) {
  const userId = firebase.auth().currentUser.uid;
  const likeRef = firebase.database().ref(`posts/${postId}/likes/${userId}`);

  likeRef.once('value').then(snapshot => {
    if (snapshot.exists()) {
      likeRef.remove(); // Unlike
    } else {
      likeRef.set(true); // Like
    }
  });
}

// Handle comments
function addComment(postId, commentText) {
  const userId = firebase.auth().currentUser.uid;
  const commentRef = firebase.database().ref(`posts/${postId}/comments`).push();
  
  commentRef.set({
    userId,
    text: commentText,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

// Export if using ES modules
export { toggleLike, addComment };
