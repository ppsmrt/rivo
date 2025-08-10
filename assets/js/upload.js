// assets/js/upload.js
import { auth, storage, db } from "./firebase-init.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { ref as dbRef, push, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { compressImageFileToWebP, generateAesGcmKey, encryptBlobAESGCM } from "./crypto-utils.js";

const imageInput = document.getElementById('imageInput');
const captionInput = document.getElementById('captionInput');
const preview = document.getElementById('preview');
const previewEmpty = document.getElementById('previewEmpty');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');

let selectedFile = null;
imageInput.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  selectedFile = f || null;
  if (f) {
    const url = URL.createObjectURL(f);
    preview.src = url; preview.style.display = 'block'; previewEmpty.style.display = 'none';
  } else {
    preview.src = ''; preview.style.display = 'none'; previewEmpty.style.display = 'block';
  }
});

uploadBtn.addEventListener('click', async () => {
  if (!auth.currentUser) return alert('Sign in to upload');
  if (!selectedFile) return alert('Select an image first');

  uploadBtn.disabled = true;
  uploadStatus.textContent = 'Compressing...';

  try {
    // 1) compress aggressively to WebP (highest compression)
    const compressed = await compressImageFileToWebP(selectedFile, 1280, 0.45); // adjust quality as needed

    uploadStatus.textContent = 'Encrypting...';

    // 2) generate per-file AES-GCM key
    const { key, rawBase64 } = await generateAesGcmKey();

    // 3) encrypt compressed blob
    const { cipherBuffer, ivBase64 } = await encryptBlobAESGCM(compressed, key);
    const cipherBlob = new Blob([new Uint8Array(cipherBuffer)], { type: 'application/octet-stream' });

    uploadStatus.textContent = 'Uploading...';

    // 4) storage path & upload
    const postId = push(dbRef(db, 'posts')).key;
    const filePath = `posts/${auth.currentUser.uid}/${postId}.enc`;
    const sRef = storageRef(storage, filePath);

    await uploadBytes(sRef, cipherBlob, { contentType: 'application/octet-stream' });
    const downloadURL = await getDownloadURL(sRef);

    uploadStatus.textContent = 'Saving post metadata...';

    // 5) write post metadata to Realtime Database
    const postMeta = {
      id: postId,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || auth.currentUser.email || 'You',
      authorPhoto: auth.currentUser.photoURL || '',
      caption: captionInput.value || '',
      storagePath: filePath,
      downloadURL,              // encrypted file download url
      encryptionKeyBase64: rawBase64, // store key so app can decrypt (app-visible encryption)
      ivBase64,
      contentType: 'image/webp',
      createdAt: Date.now()
    };

    await set(dbRef(db, `posts/${postId}`), postMeta);

    uploadStatus.textContent = 'Done — post published';
    // reset UI
    imageInput.value = ''; captionInput.value = ''; selectedFile = null;
    preview.src = ''; preview.style.display = 'none'; previewEmpty.style.display = 'block';
  } catch (err) {
    console.error(err);
    uploadStatus.textContent = 'Upload failed: ' + (err.message || err);
    alert('Upload failed — see console');
  } finally {
    uploadBtn.disabled = false;
    setTimeout(()=> uploadStatus.textContent = '', 3000);
  }
});
