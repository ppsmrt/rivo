// assets/js/crypto-utils.js
export async function compressImageFileToWebP(file, maxDim = 1280, quality = 0.45) {
  // returns a Blob (image/webp) compressed
  const img = await createImageBitmap(file);
  let w = img.width, h = img.height;
  if (Math.max(w,h) > maxDim) {
    if (w > h) { h = Math.round(h * (maxDim / w)); w = maxDim; }
    else { w = Math.round(w * (maxDim / h)); h = maxDim; }
  }
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: quality });
  return blob;
}

function abToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToAb(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function generateAesGcmKey() {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  return { key, rawBase64: abToBase64(raw) };
}

export async function importAesKeyFromBase64(b64) {
  const raw = base64ToAb(b64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptBlobAESGCM(blob, key) {
  // key: CryptoKey
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended
  const data = await blob.arrayBuffer();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { cipherBuffer: cipher, ivBase64: abToBase64(iv.buffer) };
}

export async function decryptArrayBufferAESGCM(cipherBuffer, key, ivBase64) {
  const ivBuf = base64ToAb(ivBase64);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(ivBuf) }, key, cipherBuffer);
}
