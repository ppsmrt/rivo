import { auth, db } from "./firebase-config.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ===== Elements ===== */
const profileName = document.getElementById("profileName");
const profileBio = document.getElementById("profileBio");
const profileAvatar = document.getElementById("profileAvatar");
const editProfileBtn = document.getElementById("editProfileBtn");
const editName = document.getElementById("editName");
const editBio = document.getElementById("editBio");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const userPostsEl = document.getElementById("userPosts");

/* ===== Load User Data ===== */
const uid = auth.currentUser?.uid || "demoUser";
onValue(ref(db, `users/${uid}`), snapshot => {
  const data = snapshot.val();
  if (data) {
    profileName.textContent = data.name || "Guest User";
    profileBio.textContent = data.bio || "This is your bio. Edit it in settings.";
    profileAvatar.src = data.avatar || "assets/icons/default.png";
    editName.value = data.name || "";
    editBio.value = data.bio || "";
  }
});

/* ===== Load User Posts ===== */
onValue(ref(db, 'posts'), snapshot => {
  const data = snapshot.val();
  if (data) {
    const posts = Object.values(data).filter(p => p.userId === uid);
    if (posts.length) {
      userPostsEl.innerHTML = posts.map(p => `<img src="${p.image}">`).join("");
    } else {
      userPostsEl.innerHTML = `<p class="placeholder">No posts yet.</p>`;
    }
  }
});

/* ===== Tabs ===== */
document.querySelectorAll(".profile-tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".profile-tabs button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

/* ===== Edit Profile ===== */
editProfileBtn.addEventListener("click", () => {
  document.querySelector("[data-tab='settings']").click();
});

saveProfileBtn.addEventListener("click", () => {
  const name = editName.value.trim();
  const bio = editBio.value.trim();
  set(ref(db, `users/${uid}`), {
    name,
    bio,
    avatar: profileAvatar.src
  }).then(() => {
    alert("Profile updated!");
  });
});
