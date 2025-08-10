import { auth } from './firebase-init.js';
import { listenForLikes, toggleLike } from './likes.js';
import { listenForComments } from './comments.js';
import { getPosts } from './posts.js'; // separate if needed

// Load posts into the DOM
async function loadFeed() {
    const feedContainer = document.querySelector('.feed');
    feedContainer.innerHTML = '';

    const posts = await getPosts(); // Fetch from Firebase

    posts.forEach(post => {
        const postEl = document.createElement('article');
        postEl.classList.add('post');
        postEl.innerHTML = `
            <div class="post-header">
                <img src="${post.userAvatar}" class="avatar">
                <span class="username">${post.username}</span>
            </div>
            <img src="${post.imageUrl}" class="post-img">
            <div class="post-actions">
                <i class="fa-regular fa-heart like-btn"></i>
                <i class="fa-regular fa-comment"></i>
                <i class="fa-regular fa-paper-plane"></i>
            </div>
            <div class="post-likes">Liked by <b>Someone</b> and <b>0 others</b></div>
            <div class="post-caption"><b>${post.username}</b> ${post.caption}</div>
        `;

        const likeBtn = postEl.querySelector('.like-btn');
        const likesDisplay = postEl.querySelector('.post-likes');

        likeBtn.addEventListener('click', () => toggleLike(post.id));

        listenForLikes(post.id, (count, likesData) => {
            let firstUser = Object.values(likesData)[0]?.username || "Someone";
            likesDisplay.innerHTML = `Liked by <b>${firstUser}</b> and <b>${count} others</b>`;
            likeBtn.classList.toggle('liked', likesData[auth.currentUser?.uid]);
        });

        listenForComments(post.id, (comments) => {
            console.log(`Post ${post.id} has ${Object.keys(comments).length} comments`);
        });

        feedContainer.appendChild(postEl);
    });
}

loadFeed();