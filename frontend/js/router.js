/**
 * Client-Side Router & Dynamic Page Loader for MannuMitra.
 * Manages modular view navigation and loads feature HTML templates on demand.
 */

import { i18n } from './i18n.js';
import { initSoilOCRFeature, initWaterFeature } from './features/new_features.js';

export class AppRouter {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = null;
    this.pageCache = new Map();
  }

  registerRoute(name, config) {
    this.routes[name] = config;
  }

  async navigateTo(viewName) {
    const route = this.routes[viewName];
    if (!route) {
      console.warn(`[Router] No route registered for: ${viewName}`);
      return;
    }

    // 1. Update sidebar active item
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      const navTarget = item.getAttribute('data-nav');
      item.classList.toggle('active', navTarget === viewName);
    });

    // 2. Hide all existing view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
      panel.style.display = 'none';
    });

    // 3. Check if view-panel already exists in DOM
    let targetPanel = document.getElementById(route.panelId || `view-${viewName}`);

    // If template exists and panel is not yet loaded, load it dynamically
    if (!targetPanel && route.template) {
      try {
        let html = this.pageCache.get(route.template);
        if (!html) {
          const res = await fetch(`/ui/pages/${route.template}?v=${Date.now()}`);
          if (res.ok) {
            html = await res.text();
            this.pageCache.set(route.template, html);
          }
        }

        if (html) {
          const container = document.querySelector('main.main-content-wrapper') || document.querySelector('.main-content') || document.body;
          if (container) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const newPanel = tempDiv.firstElementChild;
            if (newPanel) {
              container.appendChild(newPanel);
              targetPanel = newPanel;
            }
          }
        }
      } catch (err) {
        console.error(`[Router] Error loading template for ${viewName}:`, err);
      }
    }

    // 4. Activate target panel
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.style.display = 'block';
      i18n.applyTranslations(targetPanel);
    }

    // 5. Invoke feature module hook if defined
    if (route.onEnter && typeof route.onEnter === 'function') {
      try {
        route.onEnter();
      } catch (err) {
        console.error(`[Router] onEnter error for ${viewName}:`, err);
      }
    }

    this.currentRoute = viewName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export const router = new AppRouter({
  home: { panelId: 'view-home', template: 'home.html' },
  recommend: { panelId: 'view-recommend', template: 'recommendation.html' },
  soil_ocr: { panelId: 'view-soil-ocr', template: 'soil_ocr.html', onEnter: () => initSoilOCRFeature() },
  disease: { panelId: 'view-disease', template: 'disease.html' },
  water: { panelId: 'view-water', template: 'water.html', onEnter: () => initWaterFeature() },
  market: { panelId: 'view-market', template: 'market.html' },
  cropcare: { panelId: 'view-crop-care', template: 'lifecycle.html' },
  fertilizer: { panelId: 'view-fertilizer', template: 'fertilizer.html' },
  weather: { panelId: 'view-weather', template: 'weather.html' },
  guide: { panelId: 'view-guide', template: 'schemes.html' },
  settings: { panelId: 'view-settings', template: 'settings.html' },
  about: { panelId: 'view-about', template: 'about.html' }
});

if (typeof window !== 'undefined') {
  window.appRouter = router;
  window.navTo = (viewName) => router.navigateTo(viewName);
}

export default router;
