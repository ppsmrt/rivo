// assets/js/animations.js
export function animateIn(el, opts = {}) {
  if (!el) return;
  el.animate([
    { transform: 'translateY(8px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1 }
  ], {
    duration: opts.duration || 260,
    easing: opts.easing || 'cubic-bezier(.2,.9,.2,1)',
    fill: 'forwards'
  });
}

export function pulse(el, opts = {}) {
  if (!el) return;
  el.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.02)' },
    { transform: 'scale(1)' }
  ], { duration: opts.duration || 650, iterations: opts.iterations || 1 });
}

export function scrollToBottom(container) {
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}