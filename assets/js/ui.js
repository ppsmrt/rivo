// assets/js/ui.js
export const ui = {
  injected: false,
  injectHeaderFooter() {
    if (this.injected) return;
    const header = document.createElement('header');
    header.className = 'app-header glass';
    header.innerHTML = `
      <div class="header-left">
        <div class="brand">Rivo</div>
        <div class="kicker text-muted">Premium</div>
      </div>
      <div class="header-controls">
        <button class="icon-btn" aria-label="Search" id="ui-search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
        <button class="icon-btn" aria-label="New" id="ui-new-btn"><i class="fa-regular fa-square-plus"></i></button>
        <button class="icon-btn" aria-label="Msgs" id="ui-msg-btn"><i class="fa-regular fa-comment-dots"></i></button>
      </div>
    `;
    document.body.prepend(header);

    const footer = document.createElement('footer');
    footer.className = 'app-footer glass';
    footer.innerHTML = `
      <nav class="footer-nav">
        <a class="icon-btn" href="index.html" aria-label="Home"><i class="fa-solid fa-house"></i></a>
        <a class="icon-btn" href="explore.html" aria-label="Explore"><i class="fa-regular fa-compass"></i></a>
        <a class="icon-btn" href="upload.html" aria-label="Upload"><i class="fa-regular fa-square-plus"></i></a>
        <a class="icon-btn" href="messages.html" aria-label="Messages"><i class="fa-regular fa-comment-dots"></i></a>
        <a class="icon-btn" href="profile.html" aria-label="Profile"><i class="fa-regular fa-user"></i></a>
      </nav>
    `;
    document.body.appendChild(footer);

    // safe area padding for main content
    const style = document.createElement('style');
    style.innerHTML = `
      main, .chat-shell, .page-wrapper { padding-top: calc(64px + env(safe-area-inset-top)); padding-bottom: calc(90px + env(safe-area-inset-bottom)); }
      @media (min-width: 901px){ .chat-shell{ margin-top:32px } }
    `;
    document.head.appendChild(style);

    this.injected = true;
  },

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.injectHeaderFooter();

      // small nav wiring
      const searchBtn = document.getElementById('ui-search-btn');
      if (searchBtn) searchBtn.addEventListener('click', () => {
        const q = prompt('Search (quick)'); if (q) window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
      });

      const newBtn = document.getElementById('ui-new-btn');
      if (newBtn) newBtn.addEventListener('click', () => window.location.href = 'upload.html');

      const msgBtn = document.getElementById('ui-msg-btn');
      if (msgBtn) msgBtn.addEventListener('click', () => window.location.href = 'messages.html');
    });
  }
};

// auto-init
ui.init();