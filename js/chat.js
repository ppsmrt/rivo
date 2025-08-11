import { auth, db } from "./firebase-config.js";
import { ref, onValue, push, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ===== Elements ===== */
const chatListEl = document.getElementById("chat-list");
const chatWindowEl = document.getElementById("chat-window");
const backBtn = document.getElementById("backToList");
const chatAvatar = document.getElementById("chatAvatar");
const chatUsername = document.getElementById("chatUsername");
const messagesEl = document.getElementById("messages");
const messageText = document.getElementById("messageText");
const sendMessageBtn = document.getElementById("sendMessage");

let currentChatId = null;
let currentRecipient = null;

/* ===== Open a Chat from List ===== */
document.querySelectorAll(".chat-user").forEach(userEl => {
  userEl.addEventListener("click", () => {
    const uid = userEl.getAttribute("data-uid");
    const username = userEl.querySelector(".username").textContent;
    const avatar = userEl.querySelector(".avatar").src;

    currentRecipient = { uid, username, avatar };
    currentChatId = generateChatId(auth.currentUser?.uid || "demoUser", uid);

    chatAvatar.src = avatar;
    chatUsername.textContent = username;

    chatListEl.classList.add("hidden");
    chatWindowEl.classList.remove("hidden");

    loadMessages(currentChatId);
  });
});

/* ===== Back to Chat List ===== */
backBtn.addEventListener("click", () => {
  chatWindowEl.classList.add("hidden");
  chatListEl.classList.remove("hidden");
  messagesEl.innerHTML = "";
});

/* ===== Send a Message ===== */
sendMessageBtn.addEventListener("click", async () => {
  const text = messageText.value.trim();
  if (!text || !currentChatId) return;

  const messageRef = push(ref(db, `messages/${currentChatId}`));
  await set(messageRef, {
    senderId: auth.currentUser?.uid || "demoUser",
    text,
    timestamp: Date.now()
  });

  messageText.value = "";
});

/* ===== Load Messages in Real Time ===== */
function loadMessages(chatId) {
  const messagesRef = ref(db, `messages/${chatId}`);
  onValue(messagesRef, snapshot => {
    messagesEl.innerHTML = "";
    const data = snapshot.val();
    if (data) {
      Object.values(data)
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach(msg => {
          const isSent = msg.senderId === (auth.currentUser?.uid || "demoUser");
          const msgEl = document.createElement("div");
          msgEl.className = `message ${isSent ? "sent" : "received"}`;
          msgEl.textContent = msg.text;
          messagesEl.appendChild(msgEl);
        });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  });
}

/* ===== Generate Unique Chat ID ===== */
function generateChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}
