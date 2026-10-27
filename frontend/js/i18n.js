/**
 * Centralized Translation Engine (i18n) for MannuMitra.
 * Replaces repeated language conditions with dictionary-based lookups
 * and declarative data-i18n attributes.
 */

class I18nService {
  constructor(defaultLang = 'kn') {
    this.currentLang = localStorage.getItem('mannumitra_lang') || defaultLang;
    this.dictionaries = {};
    this.listeners = new Set();
  }

  /**
   * Initialize translation service and preload dictionaries.
   */
  async init() {
    await Promise.all([
      this.loadDictionary('kn'),
      this.loadDictionary('en')
    ]);
    this.applyTranslations(document);
    this.updateToggleButtons();
    return this;
  }

  /**
   * Fetch dictionary for given language code with multi-path fallback.
   */
  async loadDictionary(lang) {
    if (this.dictionaries[lang] && Object.keys(this.dictionaries[lang]).length > 5) {
      return this.dictionaries[lang];
    }
    const paths = [
      `/ui/locales/${lang}.json?v=${Date.now()}`,
      `locales/${lang}.json?v=${Date.now()}`,
      `./locales/${lang}.json?v=${Date.now()}`
    ];
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const dict = await res.json();
          this.dictionaries[lang] = dict;
          return dict;
        }
      } catch (err) {
        // try next path
      }
    }
    console.warn(`[i18n] Failed to load remote dictionary for ${lang}, using cached/baseline.`);
    return this.dictionaries[lang] || {};
  }

  /**
   * Switch the active language and re-translate the DOM.
   */
  async setLanguage(lang) {
    if (lang !== 'en' && lang !== 'kn') return;
    this.currentLang = lang;
    try {
      localStorage.setItem('mannumitra_lang', lang);
    } catch (e) {
      // localStorage might be unavailable in restricted environments
    }

    if (!this.dictionaries[lang]) {
      await this.loadDictionary(lang);
    }

    this.applyTranslations(document);
    this.updateToggleButtons();

    // Notify registered listeners
    this.listeners.forEach(fn => {
      try { fn(this.currentLang); } catch (e) { console.error('[i18n listener error]', e); }
    });

    // Dispatch global DOM event for loose coupling
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: this.currentLang } }));
  }

  /**
   * Toggle between Kannada and English.
   */
  async toggleLanguage() {
    const nextLang = this.currentLang === 'kn' ? 'en' : 'kn';
    await this.setLanguage(nextLang);
    return nextLang;
  }

  /**
   * Resolve a dot-notated key (e.g., 'common.next' or 'rec.step1_title')
   * Supports:
   *   t(key)
   *   t(key, fallback)
   *   t(key, { value: 28 }, fallback)
   */
  t(key, params = {}, fallback = '') {
    if (typeof params === 'string') {
      fallback = params;
      params = {};
    }

    const resolveFromDict = (dict) => {
      if (!dict || typeof dict !== 'object') return null;
      const parts = key.split('.');
      let val = dict;
      for (const part of parts) {
        if (val && typeof val === 'object' && part in val) {
          val = val[part];
        } else {
          return null;
        }
      }
      return typeof val === 'string' ? val : null;
    };

    // 1. Try active language dictionary
    let result = resolveFromDict(this.dictionaries[this.currentLang]);

    // 2. Fallback to English dictionary if missing in currentLang (e.g., Kannada)
    if (result === null && this.currentLang !== 'en') {
      result = resolveFromDict(this.dictionaries['en']);
      if (result !== null) {
        console.warn(`[i18n] Missing key "${key}" for language "${this.currentLang}", falling back to English.`);
      }
    }

    // 3. Fallback to Kannada if English was active and missing
    if (result === null && this.currentLang !== 'kn') {
      result = resolveFromDict(this.dictionaries['kn']);
      if (result !== null) {
        console.warn(`[i18n] Missing key "${key}" for language "${this.currentLang}", falling back to Kannada.`);
      }
    }

    // 4. Default fallback string or the key itself
    if (result === null) {
      if (!fallback) {
        console.warn(`[i18n] Missing translation key "${key}" across all dictionaries.`);
      }
      result = fallback || key;
    }

    // 5. Variable interpolation: {{varName}} and {varName}
    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          result = result.replaceAll(`{{${k}}}`, String(v)).replaceAll(`{${k}}`, String(v));
        }
      }
    }

    return result;
  }

  /**
   * Translate all elements within container holding data-i18n attributes.
   */
  applyTranslations(container = document) {
    if (!container) return;
    const isKn = this.currentLang === 'kn';

    // 1. Declarative text translations
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const text = this.t(key);
        if (text && text !== key) {
          el.textContent = text;
        }
      }
    });

    // 2. Declarative HTML translations
    container.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        const html = this.t(key);
        if (html && html !== key) {
          el.innerHTML = html;
        }
      }
    });

    // 3. Declarative placeholder translations
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const text = this.t(key);
        if (text && text !== key) {
          el.placeholder = text;
        }
      }
    });

    // 4. Declarative title attributes
    container.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const text = this.t(key);
        if (text && text !== key) {
          el.title = text;
        }
      }
    });

    // 5. Backward compatibility for legacy .txt-kn / .txt-en spans
    container.querySelectorAll('.txt-kn').forEach(e => {
      e.style.display = isKn ? 'inline' : 'none';
    });
    container.querySelectorAll('.txt-en').forEach(e => {
      e.style.display = isKn ? 'none' : 'inline';
    });
  }

  /**
   * Sync UI language toggle buttons
   */
  updateToggleButtons() {
    const isKn = this.currentLang === 'kn';
    const langBtnText = document.getElementById('lang-btn-text');
    if (langBtnText) {
      langBtnText.textContent = isKn ? 'ಕನ್ನಡ / EN' : 'English / ಕನ್ನಡ';
    }
  }

  /**
   * Subscribe a callback to language change events.
   */
  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  }
}

// Baseline common strings for immediate synchronous availability
const BASELINE_EN = {
  common: { next: "Next", back: "Back", loading: "Loading...", reset: "Reset", close: "Close", save: "Save", cancel: "Cancel", retry: "Retry", success: "Success", error: "Error" }
};
const BASELINE_KN = {
  common: { next: "ಮುಂದೆ", back: "ಹಿಂದೆ", loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...", reset: "ಮರುಹೊಂದಿಸಿ", close: "ಮುಚ್ಚಿ", save: "ಉಳಿಸಿ", cancel: "ರದ್ದುಮಾಡಿ", retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", success: "ಯಶಸ್ವಿಯಾಗಿದೆ", error: "ದೋಷ" }
};

// Singleton instance
export const i18n = new I18nService();
i18n.dictionaries = { en: BASELINE_EN, kn: BASELINE_KN };

if (typeof window !== 'undefined') {
  window.i18n = i18n;
  // Automatically preload on script execution
  i18n.init().catch(err => console.warn('[i18n] Auto-init deferred:', err));
}
export default i18n;
