// ==============================
// Like Button Animation
// ==============================
document.querySelectorAll('.like-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.add('like-animate');
    setTimeout(() => btn.classList.remove('like-animate'), 400);
  });
});

// ==============================
// Double-Tap to Like on Images
// ==============================
document.querySelectorAll('.post-img').forEach(img => {
  let lastTap = 0;
  img.addEventListener('click', () => {
    const now = new Date().getTime();
    if (now - lastTap < 300) {
      // Find the like button in the same post
      const likeBtn = img.closest('.post').querySelector('.like-btn');
      likeBtn.classList.add('like-animate');
      setTimeout(() => likeBtn.classList.remove('like-animate'), 400);
    }
    lastTap = now;
  });
});

// ==============================
// Smooth Horizontal Scroll for Stories
// ==============================
const stories = document.querySelector('.stories');
let isDown = false;
let startX;
let scrollLeft;

stories.addEventListener('mousedown', e => {
  isDown = true;
  startX = e.pageX - stories.offsetLeft;
  scrollLeft = stories.scrollLeft;
  stories.style.cursor = 'grabbing';
});

stories.addEventListener('mouseleave', () => {
  isDown = false;
  stories.style.cursor = 'grab';
});

stories.addEventListener('mouseup', () => {
  isDown = false;
  stories.style.cursor = 'grab';
});

stories.addEventListener('mousemove', e => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - stories.offsetLeft;
  const walk = (x - startX) * 2; // scroll speed
  stories.scrollLeft = scrollLeft - walk;
});

// Touch Support for Mobile
let touchStartX = 0;
stories.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].pageX;
}, { passive: true });

stories.addEventListener('touchmove', e => {
  const touchX = e.touches[0].pageX;
  stories.scrollLeft += (touchStartX - touchX) * 1.5;
  touchStartX = touchX;
}, { passive: true });
