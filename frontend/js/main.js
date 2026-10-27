/**
 * Main Application Coordinator for MannuMitra (AI-Based Predictive Farming System).
 *
 * Responsibilities:
 *  1. Bootstrap the i18n translation engine and language toggle.
 *  2. Orchestrate client-side routing (load pages dynamically from pages/).
 *  3. Manage shared shell UI: hamburger menu, sidebar collapse, brand-home click.
 *  4. Register all feature module routes so the router can call their init().
 *
 * Architecture: Build-free native ES modules — no Webpack, Vite, or npm needed.
 */

import { i18n } from './i18n.js';
import { api } from './api.js';
import { router } from './router.js';
import { recommendationFeature } from './features/recommendation.js';
import { diseaseFeature } from './features/disease.js';
import { lifecycleFeature } from './features/lifecycle.js';
import { weatherFeature } from './features/weather.js';
import { fertilizerFeature } from './features/fertilizer.js';

// Expose singletons to window for inline onclick handlers in page templates
window.i18n = i18n;
window.api = api;
window.appRouter = router;
window.recommendationModule = recommendationFeature;
window.diseaseModule = diseaseFeature;
window.lifecycleModule = lifecycleFeature;
window.weatherModule = weatherFeature;
window.fertilizerModule = fertilizerFeature;

// Register all routes with feature module hooks
router.registerRoute('home', {
  panelId: 'view-home',
  template: 'home.html'
});

router.registerRoute('recommend', {
  panelId: 'view-recommend',
  template: 'recommendation.html',
  onEnter: () => recommendationFeature.init()
});

router.registerRoute('cropcare', {
  panelId: 'view-crop-care',
  template: 'lifecycle.html',
  onEnter: () => lifecycleFeature.init()
});

router.registerRoute('disease', {
  panelId: 'view-disease',
  template: 'disease.html',
  onEnter: () => diseaseFeature.init()
});

router.registerRoute('weather', {
  panelId: 'view-weather',
  template: 'weather.html',
  onEnter: () => weatherFeature.init()
});

router.registerRoute('fertilizer', {
  panelId: 'view-fertilizer',
  template: 'fertilizer.html',
  onEnter: () => fertilizerFeature.init()
});

router.registerRoute('guide', {
  panelId: 'view-guide',
  template: 'schemes.html'
});

router.registerRoute('settings', {
  panelId: 'view-settings',
  template: 'settings.html'
});

router.registerRoute('about', {
  panelId: 'view-about',
  template: 'about.html'
});

// ─────────────────────────────────────────────
// Shell UI Helpers (sidebar collapse, mobile)
// ─────────────────────────────────────────────

function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

function toggleSidebarCollapse() {
  const body = document.body;
  const shell = document.querySelector('.app-shell');
  const sidebar = document.getElementById('app-sidebar');
  const collapsed = sidebar && sidebar.classList.toggle('collapsed');
  if (body) body.classList.toggle('sidebar-collapsed', collapsed);
  if (shell) shell.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem('mannumitra_sidebar_collapsed', collapsed ? 'true' : 'false');
}

// ─────────────────────────────────────────────
// App Bootstrap
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[MannuMitra] Initializing modular frontend application...');

  // Restore sidebar collapse state from previous session
  if (localStorage.getItem('mannumitra_sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('sidebar-collapsed');
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }

  // Initialize i18n (loads both en.json and kn.json dictionaries)
  await i18n.init();

  // Language toggle button
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => i18n.toggleLanguage());
  }

  // Hamburger (mobile) menu button
  const menuToggle = document.getElementById('menu-toggle-btn');
  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileSidebar);
  }

  // Sidebar overlay (close on backdrop click)
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }

  // Sidebar collapse/expand button
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebarCollapse();
    });
  }

  // Brand logo — navigate to home on click
  const brandHome = document.getElementById('nav-brand-home');
  if (brandHome) {
    brandHome.style.cursor = 'pointer';
    brandHome.addEventListener('click', () => router.navigateTo('home'));
  }

  // Sidebar navigation buttons
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      if (target) {
        router.navigateTo(target);
        // Close mobile sidebar after navigation
        closeMobileSidebar();
      }
    });
  });

  // Load the home page on startup
  await router.navigateTo('home');

  console.log('[MannuMitra] Modular application ready. All routes registered.');
});
