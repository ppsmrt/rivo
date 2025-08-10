import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "./firebaseConfig.js"; // your firebase config file

const db = getFirestore(app);
const auth = getAuth(app);

function renderFeed() {
    const feedRef = collection(db, "posts");
    const q = query(feedRef, orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const feedContainer = document.getElementById("feed");
        feedContainer.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postId = docSnap.id;

            const postHTML = `
                <div class="border rounded-lg p-2">
                    <img src="${post.imageUrl}" class="w-full rounded-lg cursor-pointer" onclick="toggleLike('${postId}')">
                    <p id="likes-${postId}" class="font-bold mt-2">${post.likesCount || 0} likes</p>
                    <p>${post.caption || ""}</p>
                </div>
            `;

            feedContainer.innerHTML += postHTML;
            listenLikes(postId);
        });
    });
}

async function toggleLike(postId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login to like posts.");
        return;
    }

    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const likeDoc = await getDoc(likeRef);

    if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(doc(db, "posts", postId), { likesCount: increment(-1) });
    } else {
        await setDoc(likeRef, { userId: user.uid, timestamp: new Date() });
        await updateDoc(doc(db, "posts", postId), { likesCount: increment(1) });
    }
}

function listenLikes(postId) {
    const postRef = doc(db, "posts", postId);
    onSnapshot(postRef, (snapshot) => {
        const data = snapshot.data();
        document.getElementById(`likes-${postId}`).innerText = `${data?.likesCount || 0} likes`;
    });
}

window.toggleLike = toggleLike; // expose to HTML
renderFeed();
