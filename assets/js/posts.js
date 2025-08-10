// assets/js/posts.js
import { db } from './firebase-init.js';
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export async function getPosts() {
    const snapshot = await get(child(ref(db), 'posts'));
    if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map(id => ({ id, ...data[id] }));
    }
    return [];
}