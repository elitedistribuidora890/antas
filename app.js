/* ═══════════════════════════════════════════════
   GUIA CITY — APP.JS
   Navegação, Modais e Interações UI
═══════════════════════════════════════════════ */

'use strict';

// ─── PAGE NAVIGATION ───
window.navTo = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) breadcrumb.textContent = PAGE_LABELS?.[page] || page;

  if (window.PAGE_LOADERS && typeof window.PAGE_LOADERS[page] === 'function') {
    window.PAGE_LOADERS[page]();
  }

  console.log('Página aberta:', page);
};

 window.showPage = function(pageId) {

  document.querySelectorAll('.page').forEach(p =>
    p.classList.remove('active')
  );

  document.getElementById('page-' + pageId)?.classList.add('active');

  if (pageId === 'map') {
    setTimeout(() => {
      if (window.initMap) initMap();
    }, 100);
  }

  if (pageId === 'profile') {
    if (window.loadFavorites) loadFavorites();
  }

  const navItems = document.querySelectorAll('.bottom-nav-item');
  const pageNavMap = { home: 0, map: 1, news: 2, events: 3, profile: 4 };

  navItems.forEach((item, idx) => {
    item.classList.toggle('active', idx === pageNavMap[pageId]);
  });

  closeMobileMenu();
};

window.setActiveNav = function(btn) {
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

// ─── MOBILE MENU ───
window.toggleMobileMenu = function() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
};

window.closeMobileMenu = function() {
  document.getElementById('mobile-menu')?.classList.add('hidden');
};

// ─── MODALS ───
window.openModal = function(id) {
  const modal = document.getElementById(id);
  const overlay = document.getElementById('modal-overlay');
  if (modal) modal.classList.remove('hidden');
  if (overlay) overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
  const anyOpen = [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
  if (!anyOpen) {
    document.getElementById('modal-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.getElementById('modal-overlay')?.addEventListener('click', () => {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
});

// ─── AUTH TABS ───
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tabName)?.classList.add('active');
  document.querySelector(`.modal-tab[data-tab="${tabName}"]`)?.classList.add('active');
};

window.showRecover = function() {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-recover')?.classList.add('active');
};

document.querySelectorAll('.modal-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab) switchTab(tab);
  });
});

// ─── PROFILE TABS ───
window.switchProfileTab = function(tabName, btn) {
  document.querySelectorAll('.profile-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('profile-tab-' + tabName)?.classList.add('active');
  btn.classList.add('active');
};

// ─── NAVBAR SCROLL BEHAVIOR ───
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const currentScroll = window.scrollY;
  if (currentScroll > lastScroll && currentScroll > 80) {
    navbar.style.transform = 'translateY(-100%)';
    navbar.style.transition = 'transform .3s ease';
  } else {
    navbar.style.transform = 'translateY(0)';
  }
  lastScroll = currentScroll;
}, { passive: true });

// ─── TOAST ───
window.showToast = function(message, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
};

// ─── PARTICLES HERO ───
(function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:rgba(255,255,255,${Math.random()*.3+.05});
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      animation: floatParticle ${Math.random()*8+6}s infinite ease-in-out ${Math.random()*4}s;
    `;
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatParticle {
      0%, 100% { transform: translateY(0) scale(1); opacity: .3; }
      50% { transform: translateY(-20px) scale(1.2); opacity: .8; }
    }
  `;
  document.head.appendChild(style);
})();

// ─── CLOSE SEARCH SUGGESTIONS ───
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-bar') && !e.target.closest('.search-suggestions')) {
    document.getElementById('search-suggestions')?.classList.add('hidden');
  }
});

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('modal-overlay')?.classList.add('hidden');
    document.body.style.overflow = '';
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('hero-search')?.focus();
  }
});

// ─── INTERSECT ANIMATION ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

setTimeout(() => {
  document.querySelectorAll('.category-card, .company-card, .news-card, .utility-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .4s ease, transform .4s ease';
    observer.observe(el);
  });
}, 1000);

// ─── WHATSAPP MASK ───
const whatsappInput = document.getElementById('biz-whatsapp');
if (whatsappInput) {
  whatsappInput.addEventListener('input', function() {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
    this.value = v;
  });
}

// ─── PWA INSTALL PROMPT ───
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// ─── IMAGE MODAL ───
window.openImageModal = function(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;cursor:pointer;';
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:95vw;max-height:90vh;border-radius:12px;object-fit:contain;';
  overlay.appendChild(img);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
};

// ─── STATS ANIMATION ON SCROLL ───
function animateStats() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target || el.textContent || 0);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 20);
  });
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateStats(); statsObserver.disconnect(); }
  });
});
const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ─── PULL TO REFRESH ───
let startY = 0;
document.addEventListener('touchstart', (e) => { startY = e.touches[0].pageY; }, { passive: true });
document.addEventListener('touchend', (e) => {
  const deltaY = e.changedTouches[0].pageY - startY;
  if (deltaY > 100 && window.scrollY === 0) {
    showToast('Atualizando...', 'info', 1500);
    setTimeout(() => location.reload(), 500);
  }
}, { passive: true });

// ─── COOKIE / NOTIFICAÇÕES ───
window.addEventListener('load', function() {
  setTimeout(() => {
    const aviso = document.getElementById('cookie-notif');
    if (aviso && !localStorage.getItem('cookie_notif_status')) {
      aviso.style.display = 'block';
    }
  }, 3000);
});

window.aceitarNotificacoes = function() {
  localStorage.setItem('cookie_notif_status', 'accepted');
  document.getElementById('cookie-notif').style.display = 'none';
  showToast('Notificações ativadas!', 'success');
};

window.recusarNotificacoes = function() {
  localStorage.setItem('cookie_notif_status', 'declined');
  document.getElementById('cookie-notif').style.display = 'none';
};

// ─── CONSOLE SIGNATURE ───
console.log(`
  ██████╗ ██╗   ██╗██╗ █████╗      ██████╗██╗████████╗██╗   ██╗
 ██╔════╝ ██║   ██║██║██╔══██╗    ██╔════╝██║╚══██╔══╝╚██╗ ██╔╝
 ██║  ███╗██║   ██║██║███████║    ██║     ██║   ██║    ╚████╔╝ 
 ██║   ██║██║   ██║██║██╔══██║    ██║     ██║   ██║     ╚██╔╝  
 ╚██████╔╝╚██████╔╝██║██║  ██║    ╚██████╗██║   ██║      ██║   
  ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝    ╚═════╝╚═╝   ╚═╝      ╚═╝   

  🏙️ Portal da Cidade — by Antas Digital

`);
window.toggleAIChat = function() {
  document.getElementById('ai-floating-chat').classList.toggle('hidden');
};