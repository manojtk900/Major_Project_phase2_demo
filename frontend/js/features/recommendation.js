/**
 * Crop Recommendation Feature Module for MannuMitra.
 *
 * Manages the complete 4-step wizard:
 *  Step 1 — Soil Selection (photo cards, data-driven render)
 *  Step 2 — Location & Agro-climatic weather sync (district chips)
 *  Step 3 — Nutrients & Climate sliders (Soil Health Card) 
 *  Step 4 — ML Model inference (Random Forest) & XAI explanation
 *
 * Previously this logic lived in the monolithic app.js.
 * It has been migrated here with no change to behaviour or data.
 */

import { api } from '../api.js';
import { i18n } from '../i18n.js';

// ── Soil image map — paths relative to /ui/ (FastAPI static mount) ──────────
const SOIL_IMAGES = {
  'red_soil':      'public/images/soils/red_soil.jpg',
  'black_soil':    'public/images/soils/black_soil.jpg',
  'sandy_soil':    'public/images/soils/sandy_soil.jpg',
  'alluvial_soil': 'public/images/soils/alluvial_soil.jpg'
};

// ── Karnataka Districts with agro-climatic defaults ─────────────────────────
const KARNATAKA_DISTRICTS = [
  { id: 'Mandya',     name_kn: 'ಮಂಡ್ಯ',       name_en: 'Mandya',     temp: 25.0, rain: 760,  hum: 68, soil: 'alluvial_soil',
    zone_kn: 'ದಕ್ಷಿಣ ಒಣ ವಲಯ (Zone 6)',     zone_en: 'Southern Dry Zone (Zone 6)',
    desc_kn: 'ಕಾವೇರಿ ಕಣಿವೆ ಕೃಷಿ ವಲಯ — ರಾಗಿ, ಕಬ್ಬು, ಭತ್ತ, ಮೆಕ್ಕೆಜೋಳಕ್ಕೆ ಅತ್ಯಂತ ಪ್ರಶಸ್ತ.',
    desc_en: 'Cauvery basin agro-zone — highly optimal for Ragi, Sugarcane, Paddy, and Maize.' },
  { id: 'Bengaluru',  name_kn: 'ಬೆಂಗಳೂರು',   name_en: 'Bengaluru',   temp: 24.0, rain: 850,  hum: 68, soil: 'red_soil',
    zone_kn: 'ಪೂರ್ವ ಒಣ ವಲಯ (Zone 5)',       zone_en: 'Eastern Dry Zone (Zone 5)',
    desc_kn: 'ಕೆಂಪು ಮಣ್ಣಿನ ಬಯಲು ಸೀಮೆ — ರಾಗಿ, ಹಣ್ಣು-ತರಕಾರಿಗಳಿಗೆ ಪ್ರಶಸ್ತ.',
    desc_en: 'Red soil plateau — ideal for Ragi, horticulture, and vegetable farming.' },
  { id: 'Mysuru',     name_kn: 'ಮೈಸೂರು',     name_en: 'Mysuru',      temp: 25.0, rain: 800,  hum: 65, soil: 'red_soil',
    zone_kn: 'ದಕ್ಷಿಣ ಒಣ ವಲಯ (Zone 6)',     zone_en: 'Southern Dry Zone (Zone 6)',
    desc_kn: 'ಕಾವೇರಿ-ಕಬಿನಿ ಜಲಾನಯನ — ರಾಗಿ, ಭತ್ತ, ಹತ್ತಿ, ಅರಿಶಿನಕ್ಕೆ ಪ್ರಸಿದ್ಧ.',
    desc_en: 'Cauvery-Kabini basin — suitable for Ragi, Paddy, Cotton, and Turmeric.' },
  { id: 'Tumakuru',   name_kn: 'ತುಮಕೂರು',    name_en: 'Tumakuru',    temp: 25.5, rain: 720,  hum: 62, soil: 'red_soil',
    zone_kn: 'ಮಧ್ಯ ಒಣ ವಲಯ (Zone 4)',       zone_en: 'Central Dry Zone (Zone 4)',
    desc_kn: 'ಕಲ್ಪತರು ನಾಡು — ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿಗೆ ಅತ್ಯುತ್ತಮ.',
    desc_en: 'Central dry plains — famous for Ragi, Groundnut, Arecanut, and Coconut.' },
  { id: 'Kolar',      name_kn: 'ಕೋಲಾರ',      name_en: 'Kolar',       temp: 26.0, rain: 640,  hum: 58, soil: 'sandy_soil',
    zone_kn: 'ಪೂರ್ವ ಒಣ ವಲಯ (Zone 5)',       zone_en: 'Eastern Dry Zone (Zone 5)',
    desc_kn: 'ಮರಳು ಮಿಶ್ರಿತ ಕೆಂಪು ಮಣ್ಣು — ಟೊಮೇಟೊ, ಕಡಲೆಕಾಯಿ, ರಾಗಿಗೆ ಪ್ರಶಸ್ತ.',
    desc_en: 'Sandy loam zone — famous for Tomato, Groundnut, and Ragi.' },
  { id: 'Dharwad',    name_kn: 'ಧಾರವಾಡ',     name_en: 'Dharwad',     temp: 27.0, rain: 780,  hum: 65, soil: 'black_soil',
    zone_kn: 'ಉತ್ತರ ಪರಿವರ್ತನಾ ವಲಯ (Zone 8)', zone_en: 'Northern Transition Zone (Zone 8)',
    desc_kn: 'ಫಲವತ್ತಾದ ಕಪ್ಪು ಮಣ್ಣು — ಹತ್ತಿ, ಜೋಳ, ಮೆಕ್ಕೆಜೋಳ, ಬೇಳೆಕಾಳುಗಳಿಗೆ ಉತ್ತಮ.',
    desc_en: 'Fertile black soil — great for Cotton, Jowar, Maize, Wheat, and Pulses.' },
  { id: 'Kalaburagi', name_kn: 'ಕಲಬುರಗಿ',   name_en: 'Kalaburagi',  temp: 31.0, rain: 650,  hum: 50, soil: 'black_soil',
    zone_kn: 'ಈಶಾನ್ಯ ಒಣ ವಲಯ (Zone 2)',      zone_en: 'North Eastern Dry Zone (Zone 2)',
    desc_kn: 'ತೊಗರಿ ಕಣಜ — ಕಪ್ಪು ಮಣ್ಣಿನಲ್ಲಿ ತೊಗರಿ, ಕಡಲೆ, ಸೂರ್ಯಕಾಂತಿ ಬೆಳೆಗೆ ಪ್ರಸಿದ್ಧ.',
    desc_en: 'Pigeonpea bowl — deep black soil ideal for Tur/Red Gram and Chickpea.' },
  { id: 'Belagavi',   name_kn: 'ಬೆಳಗಾವಿ',    name_en: 'Belagavi',    temp: 26.5, rain: 920,  hum: 70, soil: 'black_soil',
    zone_kn: 'ಉತ್ತರ ಪರಿವರ್ತನಾ ವಲಯ (Zone 8)', zone_en: 'Northern Transition Zone (Zone 8)',
    desc_kn: 'ಸಮೃದ್ಧ ಕೃಷಿ ವಲಯ — ಕಬ್ಬು, ಮೆಕ್ಕೆಜೋಳ, ಹತ್ತಿ, ಭತ್ತ ಮತ್ತು ತರಕಾರಿಗಳಿಗೆ ಪ್ರಶಸ್ತ.',
    desc_en: 'Sugar & Maize belt — highly optimal for Sugarcane, Maize, and Cotton.' },
  { id: 'Udupi',      name_kn: 'ಉಡುಪಿ',      name_en: 'Udupi',       temp: 28.0, rain: 1550, hum: 85, soil: 'alluvial_soil',
    zone_kn: 'ಕರಾವಳಿ ವಲಯ (Zone 10)',         zone_en: 'Coastal Zone (Zone 10)',
    desc_kn: 'ಕರಾವಳಿ ಮೆಕ್ಕಲು ಮಣ್ಣು — ಭತ್ತ, ಅಡಿಕೆ, ತೆಂಗು, ಗೋಡಂಬಿಗೆ ಅತ್ಯುತ್ತಮ.',
    desc_en: 'Coastal alluvial tract — highly fertile for Paddy, Arecanut, and Coconut.' },
  { id: 'Mangaluru',  name_kn: 'ಮಂಗಳೂರು',   name_en: 'Mangaluru',   temp: 28.5, rain: 1600, hum: 85, soil: 'alluvial_soil',
    zone_kn: 'ಕರಾವಳಿ ವಲಯ (Zone 10)',         zone_en: 'Coastal Zone (Zone 10)',
    desc_kn: 'ಹೆಚ್ಚು ಮಳೆ ಬೀಳುವ ಕರಾವಳಿ — ಭತ್ತ, ಅಡಿಕೆ, ಕರಿಮೆಣಸು, ತೆಂಗಿಗೆ ಸೂಕ್ತ.',
    desc_en: 'High rainfall coast — suitable for Paddy, Arecanut, and Spices.' },
  { id: 'Shivamogga', name_kn: 'ಶಿವಮೊಗ್ಗ',  name_en: 'Shivamogga',  temp: 26.0, rain: 1400, hum: 75, soil: 'red_soil',
    zone_kn: 'ದಕ್ಷಿಣ ಪರಿವರ್ತನಾ ವಲಯ (Zone 7)', zone_en: 'Southern Transition Zone (Zone 7)',
    desc_kn: 'ಮಲೆನಾಡಿನ ಹೆಬ್ಬಾಗಿಲು — ಭತ್ತ, ಅಡಿಕೆ, ಮೆಕ್ಕೆಜೋಳ ಮತ್ತು ಶುಂಠಿಗೆ ಪ್ರಶಸ್ತ.',
    desc_en: 'Gateway to Malnad — ideal for Paddy, Arecanut, Maize, and Ginger.' },
  { id: 'Hassan',     name_kn: 'ಹಾಸನ',       name_en: 'Hassan',      temp: 24.5, rain: 950,  hum: 70, soil: 'red_soil',
    zone_kn: 'ದಕ್ಷಿಣ ಪರಿವರ್ತನಾ ವಲಯ (Zone 7)', zone_en: 'Southern Transition Zone (Zone 7)',
    desc_kn: 'ಕಾಫಿ & ರಾಗಿ ನಾಡು — ಆಲೂಗಡ್ಡೆ, ಮೆಕ್ಕೆಜೋಳ, ಅಡಿಕೆ ಮತ್ತು ಶುಂಠಿಗೆ ಸೂಕ್ತ.',
    desc_en: 'Coffee & Ragi tract — suitable for Potato, Maize, and Ginger.' },
  { id: 'Ballari',    name_kn: 'ಬಳ್ಳಾರಿ',    name_en: 'Ballari',     temp: 30.0, rain: 580,  hum: 52, soil: 'black_soil',
    zone_kn: 'ಉತ್ತರ ಒಣ ವಲಯ (Zone 3)',       zone_en: 'Northern Dry Zone (Zone 3)',
    desc_kn: 'ತುಂಗಭದ್ರಾ ಅಚ್ಚುಕಟ್ಟು — ಹತ್ತಿ, ಮೆಕ್ಕೆಜೋಳ, ಮೆಣಸಿನಕಾಯಿ ಮತ್ತು ಭತ್ತಕ್ಕೆ ಪ್ರಸಿದ್ಧ.',
    desc_en: 'Tungabhadra command — famous for Cotton, Maize, Chilli, and Paddy.' },
  { id: 'Vijayapura', name_kn: 'ವಿಜಯಪುರ',   name_en: 'Vijayapura',  temp: 29.5, rain: 600,  hum: 54, soil: 'black_soil',
    zone_kn: 'ಉತ್ತರ ಒಣ ವಲಯ (Zone 3)',       zone_en: 'Northern Dry Zone (Zone 3)',
    desc_kn: 'ಕೃಷ್ಣಾ ಕಣಿವೆ — ದ್ರಾಕ್ಷಿ, ದಾಳಿಂಬೆ, ಜೋಳ, ಕಡಲೆ ಮತ್ತು ತೊಗರಿಗೆ ಸೂಕ್ತ.',
    desc_en: 'Krishna valley — famous for Grapes, Pomegranate, Jowar, and Tur.' },
  { id: 'Raichur',    name_kn: 'ರಾಯಚೂರು',   name_en: 'Raichur',     temp: 31.0, rain: 620,  hum: 50, soil: 'black_soil',
    zone_kn: 'ಈಶಾನ್ಯ ಒಣ ವಲಯ (Zone 2)',      zone_en: 'North Eastern Dry Zone (Zone 2)',
    desc_kn: 'ಭತ್ತ & ಹತ್ತಿಯ ದೊರೆ — ನಾರಿನ ಹತ್ತಿ, ಭತ್ತ, ಶೇಂಗಾ ಮತ್ತು ಬೇಳೆಕಾಳುಗಳಿಗೆ ಪ್ರಶಸ್ತ.',
    desc_en: 'Doab region — famous for Cotton, Paddy, Groundnut, and Pulses.' }
];

// ── Feature Class ────────────────────────────────────────────────────────────

export class RecommendationFeature {
  constructor() {
    this.currentStep = 1;
    this.soilTypes = [];
    this.selectedSoil = 'red_soil';
    this.selectedDistrict = 'Mandya';
    this.form = {
      soil_type: 'red_soil',
      district: 'Mandya',
      nitrogen: 180,
      phosphorus: 18,
      potassium: 200,
      ph: 6.5,
      temperature: 25.0,
      humidity: 68.0,
      rainfall: 760.0
    };
    this.lastResult = null;
  }

  // ── Public Entry Point ─────────────────────────────────────────────────────

  async init() {
    await this.loadSoilTypes();     // Fetch from backend, then render soil cards
    this.renderDistricts();         // Populate district chips
    this.bindSliders();             // Hook sliders for Step 3
    this.bindNavButtons();          // Hook Back / Next buttons
    this.bindResetButton();         // Hook Reset defaults button
    this.setStep(1);                // Ensure Step 1 is active
    // Expose global functions referenced by inline onclick in recommendation.html
    window.setWizardStep = (s) => this.setStep(s);
    window.startLifecycleForCurrent = () => {};  // no-op placeholder
  }

  // ──  Step 1: Soil Loading & Rendering  

  async loadSoilTypes() {
    try {
      const data = await api.getSoilTypes();
      this.soilTypes = data.soil_types || [];
    } catch (err) {
      console.warn('[RecommendationFeature] Backend unavailable, using built-in soil fallback:', err);
      // Built-in fallback so Step 1 always works even offline
      this.soilTypes = [
        {
          id: 'red_soil', name_en: 'Red Soil', name_kn: 'ಕೆಂಪು ಮಣ್ಣು',
          description_en: 'Common in southern & eastern Karnataka. Ideal for Ragi, Maize, Groundnut.',
          description_kn: 'ದಕ್ಷಿಣ ಮತ್ತು ಪೂರ್ವ ಕರ್ನಾಟಕ. ರಾಗಿ, ಮೆಕ್ಕೆಜೋಳ, ಕಡಲೆಕಾಯಿಗೆ ಸೂಕ್ತ.',
          properties: { ph: { default: 6.5 }, nitrogen: { default: 180 }, phosphorus: { default: 18 }, potassium: { default: 200 } }
        },
        {
          id: 'black_soil', name_en: 'Black Soil', name_kn: 'ಕಪ್ಪು ಮಣ್ಣು',
          description_en: 'Northern Karnataka belt. Moisture retentive, great for Cotton & Jowar.',
          description_kn: 'ಉತ್ತರ ಕರ್ನಾಟಕದ ಪ್ರಧಾನ ಮಣ್ಣು. ಹತ್ತಿ, ಜೋಳ, ತೊಗರಿಗೆ ಸೂಕ್ತ.',
          properties: { ph: { default: 7.8 }, nitrogen: { default: 250 }, phosphorus: { default: 22 }, potassium: { default: 310 } }
        },
        {
          id: 'sandy_soil', name_en: 'Sandy Soil', name_kn: 'ಮರಳು ಮಣ್ಣು',
          description_en: 'Well-drained soil found in Kolar, Tumkur. Great for Groundnut.',
          description_kn: 'ಉತ್ತಮ ನೀರು ಬಸಿದುಹೋಗುವ ಮಣ್ಣು. ಕಡಲೆಕಾಯಿ, ಸಜ್ಜೆಗೆ ಸೂಕ್ತ.',
          properties: { ph: { default: 6.2 }, nitrogen: { default: 120 }, phosphorus: { default: 12 }, potassium: { default: 110 } }
        },
        {
          id: 'alluvial_soil', name_en: 'Alluvial Soil', name_kn: 'ಮೆಕ್ಕಲು ಮಣ್ಣು',
          description_en: 'River valleys and coastal tracts. Highly fertile for Rice & Sugarcane.',
          description_kn: 'ನದಿ ಜಲಾನಯನ ಮತ್ತು ಕರಾವಳಿ ಪ್ರದೇಶ. ಭತ್ತ, ಕಬ್ಬಿಗೆ ಅತ್ಯುತ್ತಮ.',
          properties: { ph: { default: 7.0 }, nitrogen: { default: 240 }, phosphorus: { default: 22 }, potassium: { default: 260 } }
        }
      ];
    }
    this.renderSoilCards();
  }


  /**  
   *  it Render photo cards for Step 1.
   * Image src uses absolute path from /ui/ root — works when fragment is loaded
   * dynamically because the document URL is always http://host/ui/.
   */
  renderSoilCards() {
    const grid = document.getElementById('soil-grid-container');
    if (!grid) return;
    const isKn = i18n.currentLang === 'kn';
    grid.innerHTML = '';

    this.soilTypes.forEach(soil => {
      const card = document.createElement('div');
      card.className = `soil-card${soil.id === this.form.soil_type ? ' selected' : ''}`;
      card.id = `soil-card-${soil.id}`;
      card.setAttribute('data-soil', soil.id);

      // Use /ui/ prefix so the image URL is absolute from the server root.
      // This ensures correct resolution even after dynamic injection.
      const imgSrc = `/ui/${SOIL_IMAGES[soil.id] || 'public/images/soils/red_soil.jpg'}`;
      const desc = isKn ? soil.description_kn : soil.description_en;

      card.innerHTML = `
        <div class="soil-card-img-wrap">
          <img src="${imgSrc}" alt="${soil.name_en}" class="soil-card-img" loading="lazy">
          <span class="soil-badge">✓ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ</span>
        </div>
        <div class="soil-card-body">
          <div class="soil-name-kn">${soil.name_kn}</div>
          <div class="soil-name-en">${soil.name_en}</div>
          <p class="soil-desc">${desc}</p>
        </div>
      `;

      card.addEventListener('click', () => this.selectSoil(soil.id));
      grid.appendChild(card);
    });
  }

  selectSoil(soilId) {
    this.selectedSoil = soilId;
    this.form.soil_type = soilId;

    document.querySelectorAll('.soil-card').forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-soil') === soilId);
    });

    const soilInfo = this.soilTypes.find(s => s.id === soilId);
    if (soilInfo && soilInfo.properties) {
      if (soilInfo.properties.ph)         this.setSliderVal('ph',       soilInfo.properties.ph.default);
      if (soilInfo.properties.nitrogen)   this.setSliderVal('n',        soilInfo.properties.nitrogen.default);
      if (soilInfo.properties.phosphorus) this.setSliderVal('p',        soilInfo.properties.phosphorus.default);
      if (soilInfo.properties.potassium)  this.setSliderVal('k',        soilInfo.properties.potassium.default);
    }

    // Update the soil tag in Step 3 header
    const soilTag = document.getElementById('selected-soil-title');
    if (soilTag && soilInfo) {
      soilTag.textContent = `${soilInfo.name_kn} (${soilInfo.name_en})`;
    }

    this.updateActivePill();
  }

  // ── Step 2: District wise

  renderDistricts() {
    const grid = document.getElementById('district-container');
    if (!grid) return;
    grid.innerHTML = '';

    KARNATAKA_DISTRICTS.forEach(d => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `district-chip${this.form.district === d.id ? ' selected' : ''}`;
      chip.id = `district-chip-${d.id}`;
      chip.innerHTML = `
        <span class="district-kn">${d.name_kn}</span>
        <span class="district-en">${d.name_en}</span>
      `;
      chip.addEventListener('click', () => this.selectDistrict(d));
      grid.appendChild(chip);
    });
  }

  async selectDistrict(district) {
    this.selectedDistrict = district.id;
    this.form.district = district.id;
    // Use district's seasonal rainfall normal (not today's live rain)
    this.form.rainfall = district.rain || 760;

    document.querySelectorAll('.district-chip').forEach(c => c.classList.remove('selected'));
    const active = document.getElementById(`district-chip-${district.id}`);
    if (active) active.classList.add('selected');

    // Update zone badge and location title in Step 2
    const isKn = i18n.currentLang === 'kn';
    const zoneBadge = document.getElementById('rec-loc-zone-badge');
    if (zoneBadge) zoneBadge.textContent = isKn ? district.zone_kn : district.zone_en;

    const titleEl = document.getElementById('rec-loc-selected-title');
    if (titleEl) {
      titleEl.textContent = isKn
        ? `${district.name_kn} (${district.name_en}), ಕರ್ನಾಟಕ`
        : `${district.name_en}, Karnataka`;
    }

    const descEl = document.querySelector('.rec-loc-desc');
    if (descEl) {
      descEl.textContent = isKn ? district.desc_kn : district.desc_en;
    }

    this.updateActivePill();

    // Fetch live Open-Meteo weather for this district and sync Step 3 sliders
    await this._fetchLiveWeather(district);
  }

  async _fetchLiveWeather(district) {
    const locLabel = document.getElementById('rec-live-location');
    const isKn = i18n.currentLang === 'kn';
    if (locLabel) {
      locLabel.textContent = `📍 ${isKn ? district.name_kn : district.name_en}, Karnataka`;
    }

    try {
      const wData = await api.getWeatherByDistrict(district.id);
      if (wData && wData.current) {
        this.form.temperature = wData.current.temperature;
        this.form.humidity    = wData.current.humidity;
        // NOTE: Do NOT overwrite seasonal rainfall with today's live rain reading.
        this.syncSliders();
      }
    } catch (err) {
      console.warn('[RecommendationFeature] Live weather fetch failed, using district defaults:', err);
      this.form.temperature = district.temp;
      this.form.humidity    = district.hum;
      this.syncSliders();
    }
  }

  // ── Step 3: Navigaton

  bindSliders() {
    const sliderKeys = ['n', 'p', 'k', 'ph', 'temp', 'humidity', 'rainfall'];
    sliderKeys.forEach(key => {
      const slider   = document.getElementById(`slider-${key}`);
      const valBadge = document.getElementById(`val-${key}`);
      if (slider && valBadge) {
        slider.addEventListener('input', (e) => {
          valBadge.textContent = e.target.value;
          this._mapSliderToForm(key, parseFloat(e.target.value));
        });
      }
    });
  }

  bindResetButton() {
    const btn = document.getElementById('btn-reset-defaults');
    if (btn) {
      btn.addEventListener('click', () => {
        const soilInfo = this.soilTypes.find(s => s.id === this.form.soil_type);
        if (soilInfo && soilInfo.properties) {
          if (soilInfo.properties.ph)         this.setSliderVal('ph', soilInfo.properties.ph.default);
          if (soilInfo.properties.nitrogen)   this.setSliderVal('n',  soilInfo.properties.nitrogen.default);
          if (soilInfo.properties.phosphorus) this.setSliderVal('p',  soilInfo.properties.phosphorus.default);
          if (soilInfo.properties.potassium)  this.setSliderVal('k',  soilInfo.properties.potassium.default);
        }
        const dist = KARNATAKA_DISTRICTS.find(d => d.id === this.selectedDistrict) || KARNATAKA_DISTRICTS[0];
        this.setSliderVal('temp',     dist.temp);
        this.setSliderVal('humidity', dist.hum);
        this.setSliderVal('rainfall', dist.rain);
      });
    }
  }

  _mapSliderToForm(key, val) {
    if (key === 'n')        this.form.nitrogen    = val;
    else if (key === 'p')   this.form.phosphorus  = val;
    else if (key === 'k')   this.form.potassium   = val;
    else if (key === 'ph')  this.form.ph          = val;
    else if (key === 'temp')     this.form.temperature = val;
    else if (key === 'humidity') this.form.humidity    = val;
    else if (key === 'rainfall') this.form.rainfall    = val;
  }

  setSliderVal(key, val) {
    const slider = document.getElementById(`slider-${key}`);
    const badge  = document.getElementById(`val-${key}`);
    if (slider) slider.value = val;
    if (badge)  badge.textContent = typeof val === 'number' && val % 1 !== 0
      ? val.toFixed(1)
      : val;
    this._mapSliderToForm(key, parseFloat(val));
  }

  syncSliders() {
    this.setSliderVal('ph',       this.form.ph);
    this.setSliderVal('n',        this.form.nitrogen);
    this.setSliderVal('p',        this.form.phosphorus);
    this.setSliderVal('k',        this.form.potassium);
    this.setSliderVal('temp',     this.form.temperature);
    this.setSliderVal('rainfall', this.form.rainfall);
    this.setSliderVal('humidity', this.form.humidity);
  }

  // ── Step Navigation 

  bindNavButtons() {
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');

    if (btnBack) btnBack.addEventListener('click', () => this._handleBack());
    if (btnNext) btnNext.addEventListener('click', () => this._handleNext());
  }

  async _handleNext() {
    if (this.currentStep === 1) {
      this.setStep(2);
    } else if (this.currentStep === 2) {
      this.setStep(3);
    } else if (this.currentStep === 3) {
      await this.calculateRecommendation();
    } else if (this.currentStep === 4) {
      this.setStep(1);
    }
  }

  _handleBack() {
    if (this.currentStep === 2) this.setStep(1);
    else if (this.currentStep === 3) this.setStep(2);
  }

  setStep(step) {
    this.currentStep = step;

    // Toggle wizard screen visibility
    for (let s = 1; s <= 4; s++) {
      const screenId = s === 4 ? 'screen-result' : `screen-step${s}`;
      const screen = document.getElementById(screenId);
      if (screen) screen.classList.toggle('active', s === step);
    }

    // Stepper dots: active = current, completed = previous
    for (let s = 1; s <= 4; s++) {
      const dot = document.getElementById(`dot-${s}`);
      if (!dot) continue;
      dot.classList.remove('active', 'completed');
      if (s === step)      dot.classList.add('active');
      else if (s < step)   dot.classList.add('completed');
    }

    // Progress fill line
    const fillLine = document.getElementById('stepper-fill');
    if (fillLine) {
      fillLine.style.width = `${((step - 1) / 3) * 100}%`;
    }

    // Bottom bar Back/Next buttons
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const bottomBar = document.getElementById('recommend-bottom-bar');

    if (bottomBar) bottomBar.style.display = step === 4 ? 'none' : 'flex';
    if (btnBack) btnBack.style.display = step === 1 ? 'none' : 'inline-flex';

    if (btnNext) {
      const isKn = i18n.currentLang === 'kn';
      if (step === 3) {
        btnNext.innerHTML = isKn
          ? '<span>ಬೆಳೆ ಶಿಫಾರಸು ಮಾಡಿ</span> ➔'
          : '<span>Recommend Crop</span> ➔';
      } else {
        btnNext.innerHTML = isKn ? '<span>ಮುಂದೆ</span> ➔' : '<span>Next</span> ➔';
      }
    }

    // Auto-fetch live weather when entering Step 2
    if (step === 2) {
      const dist = KARNATAKA_DISTRICTS.find(d => d.id === this.selectedDistrict) || KARNATAKA_DISTRICTS[0];
      this._fetchLiveWeather(dist);
    }

    this.updateActivePill();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateActivePill() {
    const soilLabel = document.getElementById('rec-top-soil-label');
    const distLabel = document.getElementById('rec-top-dist-label');
    const soilInfo  = this.soilTypes.find(s => s.id === this.selectedSoil);
    const distInfo  = KARNATAKA_DISTRICTS.find(d => d.id === this.selectedDistrict) || { name_en: this.selectedDistrict, name_kn: this.selectedDistrict };

    const isKn = i18n.currentLang === 'kn';
    if (soilLabel) {
      soilLabel.textContent = soilInfo
        ? (isKn ? `${soilInfo.name_kn} (${soilInfo.name_en})` : soilInfo.name_en)
        : 'Red Soil';
    }
    if (distLabel) {
      distLabel.textContent = isKn
        ? `${distInfo.name_kn} (${distInfo.name_en})`
        : distInfo.name_en;
    }
  }

  // ── Step 4: ML Inference ───────────────────────────────────────────────────

  async calculateRecommendation() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');

    try {
      const payload = {
        soil_type:   this.form.soil_type,
        ph:          this.form.ph,
        nitrogen:    this.form.nitrogen,
        phosphorus:  this.form.phosphorus,
        potassium:   this.form.potassium,
        temperature: this.form.temperature,
        humidity:    this.form.humidity,
        rainfall:    this.form.rainfall,
        district:    this.selectedDistrict
      };

      const result = await api.submitRecommendation(payload);
      this.lastResult = result;
      this.setStep(4);
      this.renderResult(result);
    } catch (err) {
      console.error('[RecommendationFeature] Recommendation failed:', err);
      alert(`Error calculating recommendation: ${err.message}`);
    } finally {
      if (overlay) overlay.classList.remove('active');
    }
  }

  renderResult(res) {
    const isKn = i18n.currentLang === 'kn';
    const primary = res.primary_recommendation;
    if (!primary) return;

    const cropImg  = document.getElementById('hero-crop-img');
    const nameEn   = document.getElementById('hero-crop-title');
    const nameKn   = document.getElementById('hero-crop-kn');
    const scoreNum = document.querySelector('#hero-suitability-score .score-num');

    // Use /ui/ prefix for crop images (same reasoning as soil cards above)
    if (cropImg) cropImg.src = `/ui/public/images/crops/${primary.crop_id}.jpg`;
    if (nameEn)  nameEn.textContent  = primary.name_en;
    if (nameKn)  nameKn.textContent  = primary.name_kn;
    if (scoreNum) scoreNum.textContent = `${Math.round(primary.suitability_score)}%`;

    // Status badge
    const badge = document.getElementById('rec-status-badge');
    if (badge) {
      const isHighly = primary.suitability_status === 'Highly Suitable';
      badge.textContent = isHighly
        ? (isKn ? '✓ ಅತ್ಯಂತ ಸೂಕ್ತ / Highly Suitable' : '✓ Highly Suitable')
        : (isKn ? '⚠️ ಮಧ್ಯಮ ಸೂಕ್ತ / Moderately Suitable' : '⚠️ Moderately Suitable');
      badge.className = `hero-clean-tier ${isHighly ? 'status-high' : 'status-mod'}`;
    }

    // XAI Explanation points
    const expList = document.getElementById('hero-explanation-list');
    if (expList && primary.reasons) {
      expList.innerHTML = primary.reasons.map(r => `
        <li style="margin-bottom: 6px;">
          <strong>${isKn ? r.title_kn : r.title_en}:</strong> ${isKn ? r.detail_kn : r.detail_en}
        </li>
      `).join('');
    }

    // Why list
    const whyList = document.getElementById('why-list-container');
    if (whyList && primary.reasons) {
      whyList.innerHTML = primary.reasons.map(r => `
        <li class="why-item">
          <span class="why-check">✓</span>
          <span>${isKn ? r.detail_kn : r.detail_en}</span>
        </li>
      `).join('');
    }

    // Alternative crops
    const altContainer = document.getElementById('alt-crops-container');
    if (altContainer && res.alternative_crops) {
      altContainer.innerHTML = res.alternative_crops.slice(0, 2).map(c => `
        <div class="alt-crop-card">
          <img src="/ui/public/images/crops/${c.crop_id}.jpg" alt="${c.name_en}" class="alt-crop-img" loading="lazy">
          <div class="alt-crop-info">
            <div class="alt-crop-name-kn">${c.name_kn}</div>
            <div class="alt-crop-name-en">${c.name_en}</div>
            <div class="alt-crop-score">${Math.round(c.suitability_score)}% ${isKn ? 'ಸೂಕ್ತ' : 'Suitable'}</div>
          </div>
        </div>
      `).join('');
    }

    const techView = document.getElementById('tech-json-view');
    if (techView && res.technical_details) {
      const td = res.technical_details;
      techView.innerHTML = `
        <p><strong>ML Model:</strong> ${td.ml_model || 'Random Forest'}</p>
        <p><strong>Provenance:</strong> ${td.provenance_note || ''}</p>
        <p><strong>Soil Type:</strong> ${this.form.soil_type} | <strong>District:</strong> ${this.selectedDistrict}</p>
        <p><strong>pH:</strong> ${this.form.ph} | <strong>N:</strong> ${this.form.nitrogen} | <strong>P:</strong> ${this.form.phosphorus} | <strong>K:</strong> ${this.form.potassium}</p>
        <p><strong>Temp:</strong> ${this.form.temperature}°C | <strong>Humidity:</strong> ${this.form.humidity}% | <strong>Rainfall:</strong> ${this.form.rainfall}mm</p>
      `;
    }
  }
}

export const recommendationFeature = new RecommendationFeature();
if (typeof window !== 'undefined') {
  window.recommendationModule = recommendationFeature;
}
export default recommendationFeature;
