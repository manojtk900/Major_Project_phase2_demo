
window.toggleVisualDetails = function(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isHidden = (drawer.style.display === 'none' || !drawer.style.display);
  drawer.style.display = isHidden ? 'flex' : 'none';
  
  const btn = document.querySelector(`[data-target="${drawerId}"]`);
  if (btn) {
    const isKn = state.lang === 'kn';
    const isHero = drawerId.includes('hero');
    if (isHidden) {
      btn.innerHTML = `<span>📖</span> <span>${isKn ? (isHero ? 'ಮಾಹಿತಿ ಮರೆಮಾಡಿ ↑' : 'ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ ↑') : (isHero ? 'Hide Information ↑' : 'Hide Details ↑')}</span>`;
    } else {
      btn.innerHTML = `<span>📖</span> <span>${isKn ? (isHero ? 'ಹೆಚ್ಚಿನ ಕೃಷಿ ಮಾಹಿತಿ ನೋಡಿ ↓' : 'ವಿವರಗಳನ್ನು ನೋಡಿ ↓') : (isHero ? 'More Farming Information ↓' : 'View Details ↓')}</span>`;
    }
  }
};
/**
 * PFS — Application Logic
 * Supports Home Page, Collapsible Sidebar, 4-Step Crop Recommendation Flow,
 * and Stage 4 Location-Based Weather Report via Open-Meteo API which is open sorce.
 */

// Centralized translation helper connecting to window.i18n
function t(key, params = {}, fallback = '') {
  if (typeof params === 'string') {
    fallback = params;
    params = {};
  }
  if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
    return window.i18n.t(key, params, fallback);
  }
  return fallback || key;
}

// Application State
const state = {
  currentView: 'home', // 'home', 'recommend', 'weather', 'results', 'guide', 'settings', 'about'
  wizardStep: 1,       // 1: Soil, 2: Details, 3: Weather, 4: Result
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('mannumitra_lang')) || 'kn',
  soilTypes: [],
  selectedSoil: null,
  form: {
    soil_type: 'red_soil',
    ph: 6.5,
    nitrogen: 180,
    phosphorus: 18,
    potassium: 200,
    temperature: 25.0,
    rainfall: 760.0,
    humidity: 68.0,
    district: 'Mandya'
  },
  weatherDistricts: [],
  selectedWeatherDistrict: 'Mandya',
  currentWeather: null,
  lastRecommendation: null,
  selectedCareCrop: 'ragi',
  selectedCareDistrict: 'Mandya',
  currentCareData: null,
  currentCareStageIndex: 0,
  lifecycleSowingDate: null,
  lifecycleData: null,
  lifecycleFullDefinition: null,
  lifecycleActiveTab: 'timeline',
  selectedLifecycleStageId: null,
  careStreak: 7,
  completedActionDates: [],
  selectedEconomicsCrop: 'ragi',
  economicsMode: 'simple',
  economicsDefaults: null,
  lastEconomicsResult: null,
  selectedDiseaseCrop: 'arecanut',
  selectedDiseaseFile: null,
  lastDiseaseResult: null,
  diseaseConfidenceThreshold: 70.0
};

// Karnataka District Presets with Agro-Climatic Defaults
const KARNATAKA_DISTRICTS = [
  { id: 'Mandya', name_kn: 'ಮಂಡ್ಯ', name_en: 'Mandya', temp: 25.0, rain: 760, hum: 68, soil: 'alluvial_soil' },
  { id: 'Bengaluru', name_kn: 'ಬೆಂಗಳೂರು', name_en: 'Bengaluru', temp: 24.0, rain: 850, hum: 68, soil: 'red_soil' },
  { id: 'Mysuru', name_kn: 'ಮೈಸೂರು', name_en: 'Mysuru', temp: 25.0, rain: 800, hum: 65, soil: 'red_soil' },
  { id: 'Tumakuru', name_kn: 'ತುಮಕೂರು', name_en: 'Tumakuru', temp: 25.5, rain: 720, hum: 62, soil: 'red_soil' },
  { id: 'Kolar', name_kn: 'ಕೋಲಾರ', name_en: 'Kolar', temp: 26.0, rain: 640, hum: 58, soil: 'sandy_soil' },
  { id: 'Dharwad', name_kn: 'ಧಾರವಾಡ', name_en: 'Dharwad', temp: 27.0, rain: 780, hum: 65, soil: 'black_soil' },
  { id: 'Kalaburagi', name_kn: 'ಕಲಬುರಗಿ', name_en: 'Kalaburagi', temp: 31.0, rain: 650, hum: 50, soil: 'black_soil' },
  { id: 'Belagavi', name_kn: 'ಬೆಳಗಾವಿ', name_en: 'Belagavi', temp: 26.5, rain: 920, hum: 70, soil: 'black_soil' },
  { id: 'Udupi', name_kn: 'ಉಡುಪಿ', name_en: 'Udupi', temp: 28.0, rain: 1550, hum: 85, soil: 'alluvial_soil' },
  { id: 'Mangaluru', name_kn: 'ಮಂಗಳೂರು', name_en: 'Mangaluru', temp: 28.5, rain: 1600, hum: 85, soil: 'alluvial_soil' },
  { id: 'Shivamogga', name_kn: 'ಶಿವಮೊಗ್ಗ', name_en: 'Shivamogga', temp: 26.0, rain: 1400, hum: 75, soil: 'red_soil' },
  { id: 'Hassan', name_kn: 'ಹಾಸನ', name_en: 'Hassan', temp: 24.5, rain: 950, hum: 70, soil: 'red_soil' },
  { id: 'Ballari', name_kn: 'ಬಳ್ಳಾರಿ', name_en: 'Ballari', temp: 30.0, rain: 580, hum: 52, soil: 'black_soil' },
  { id: 'Vijayapura', name_kn: 'ವಿಜಯಪುರ', name_en: 'Vijayapura', temp: 29.5, rain: 600, hum: 54, soil: 'black_soil' },
  { id: 'Raichur', name_kn: 'ರಾಯಚೂರು', name_en: 'Raichur', temp: 31.0, rain: 620, hum: 50, soil: 'black_soil' }
];

// Soil Photos
const SOIL_IMAGES = {
  'red_soil': 'public/images/soils/red_soil.jpg',
  'black_soil': 'public/images/soils/black_soil.jpg',
  'sandy_soil': 'public/images/soils/sandy_soil.jpg',
  'alluvial_soil': 'public/images/soils/alluvial_soil.jpg'
};

// Crop Photos with Genuine Farm Photography (Optimized for 70x70 thumbnails)
const CROP_IMAGES = {
  'ragi': 'public/images/crops/ragi.jpg',
  'rice': 'public/images/crops/rice.jpg',
  'cotton': 'public/images/crops/cotton.jpg',
  'groundnut': 'public/images/crops/groundnut.jpg',
  'maize': 'public/images/crops/maize.jpg',
  'tomato': 'public/images/crops/tomato.jpg',
  'arecanut': 'public/images/crops/arecanut.jpg',
  'coffee': 'public/images/crops/coffee.jpg',
  'turmeric': 'public/images/crops/turmeric.jpg',
  'papaya': 'public/images/crops/papaya.jpg',
  'banana': 'public/images/crops/banana.jpg',
  'sugarcane': 'public/images/crops/sugarcane.jpg',
  'coconut': 'public/images/crops/coconut.jpg',
  'pepper': 'public/images/crops/pepper.jpg',
  'muskmelon': 'public/images/crops/muskmelon.jpg',
  'watermelon': 'public/images/crops/watermelon.jpg',
  'mango': 'public/images/crops/mango.jpg',
  'pomegranate': 'public/images/crops/pomegranate.jpg',
  'onion': 'public/images/crops/onion.jpg',
  'chilli': 'public/images/crops/chilli.jpg',
  'pigeonpeas': 'public/images/crops/pigeonpeas.jpg',
  'chickpea': 'public/images/crops/chickpea.jpg',
  'soybean': 'public/images/crops/soybean.svg',
  'default': 'public/images/crops/default_crop.svg'
};

function getCropVisualImage(cropId) {
  const c = (cropId || '').toLowerCase().trim();
  return CROP_IMAGES[c] || 'public/images/crops/default_crop.svg';
}

// District Agro-Climatic Zone Descriptions
const DISTRICT_ZONE_INFO = {
  'Mandya': { zone_kn: 'ದಕ್ಷಿಣ ಒಣ ವಲಯ (Zone 6)', zone_en: 'Southern Dry Zone (Zone 6)', desc_kn: 'ಕಾವೇರಿ ಕಣಿವೆ ಕೃಷಿ ವಲಯ — ರಾಗಿ, ಕಬ್ಬು, ಭತ್ತ, ಮೆಕ್ಕೆಜೋಳಕ್ಕೆ ಅತ್ಯಂತ ಪ್ರಶಸ್ತ.', desc_en: 'Cauvery basin agro-zone — highly optimal for Ragi, Sugarcane, Paddy, and Maize.' },
  'Bengaluru': { zone_kn: 'ಪೂರ್ವ ಒಣ ವಲಯ (Zone 5)', zone_en: 'Eastern Dry Zone (Zone 5)', desc_kn: 'ಕೆಂಪು ಮಣ್ಣಿನ ಬಯಲು ಸೀಮೆ — ರಾಗಿ, ಹಣ್ಣು-ತರಕಾರಿಗಳು ಮತ್ತು ಹೈನುಗಾರಿಕೆಗೆ ಪ್ರಶಸ್ತ.', desc_en: 'Red soil plateau — ideal for Ragi, horticulture, and vegetable farming.' },
  'Mysuru': { zone_kn: 'ದಕ್ಷಿಣ ಒಣ ವಲಯ (Zone 6)', zone_en: 'Southern Dry Zone (Zone 6)', desc_kn: 'ಕಾವೇರಿ-ಕಬಿನಿ ಜಲಾನಯನ — ರಾಗಿ, ಭತ್ತ, ಹತ್ತಿ, ಅರಿಶಿನ, ತಂಬಾಕಿಗೆ ಪ್ರಸಿದ್ಧ.', desc_en: 'Cauvery-Kabini basin — suitable for Ragi, Paddy, Cotton, and Turmeric.' },
  'Tumakuru': { zone_kn: 'ಮಧ್ಯ ಒಣ ವಲಯ (Zone 4)', zone_en: 'Central Dry Zone (Zone 4)', desc_kn: 'ಕಲ್ಪತರು ನಾಡು — ರಾಗಿ, ಕಡಲೆಕಾಯಿ, ಅಡಿಕೆ ಮತ್ತು ತೆಂಗಿಗೆ ಅತ್ಯುತ್ತಮ.', desc_en: 'Central dry plains — famous for Ragi, Groundnut, Arecanut, and Coconut.' },
  'Kolar': { zone_kn: 'ಪೂರ್ವ ಒಣ ವಲಯ (Zone 5)', zone_en: 'Eastern Dry Zone (Zone 5)', desc_kn: 'ಮರಳು ಮಿಶ್ರಿತ ಕೆಂಪು ಮಣ್ಣು — ಟೊಮೇಟೊ, ಕಡಲೆಕಾಯಿ, ರಾಗಿಗೆ ಪ್ರಶಸ್ತ.', desc_en: 'Sandy loam zone — famous for Tomato, Groundnut, and Ragi.' },
  'Dharwad': { zone_kn: 'ಉತ್ತರ ಪರಿವರ್ತನಾ ವಲಯ (Zone 8)', zone_en: 'Northern Transition Zone (Zone 8)', desc_kn: 'ಫಲವತ್ತಾದ ಕಪ್ಪು ಮಣ್ಣು — ಹತ್ತಿ, ಜೋಳ, ಮೆಕ್ಕೆಜೋಳ, ಗೋಧಿ ಮತ್ತು ಬೇಳೆಕಾಳುಗಳಿಗೆ ಉತ್ತಮ.', desc_en: 'Fertile black soil — great for Cotton, Jowar, Maize, Wheat, and Pulses.' },
  'Kalaburagi': { zone_kn: 'ಈಶಾನ್ಯ ಒಣ ವಲಯ (Zone 2)', zone_en: 'North Eastern Dry Zone (Zone 2)', desc_kn: 'ತೊಗರಿ ಕಣಜ — ಕಪ್ಪು ಮಣ್ಣಿನಲ್ಲಿ ತೊಗರಿ, ಕಡಲೆ, ಸೂರ್ಯಕಾಂತಿ ಬೆಳೆಗೆ ಪ್ರಸಿದ್ಧ.', desc_en: 'Pigeonpea bowl — deep black soil ideal for Tur/Red Gram and Chickpea.' },
  'Belagavi': { zone_kn: 'ಉತ್ತರ ಪರಿವರ್ತನಾ ವಲಯ (Zone 8)', zone_en: 'Northern Transition Zone (Zone 8)', desc_kn: 'ಸಮೃದ್ಧ ಕೃಷಿ ವಲಯ — ಕಬ್ಬು, ಮೆಕ್ಕೆಜೋಳ, ಹತ್ತಿ, ಭತ್ತ ಮತ್ತು ತರಕಾರಿಗಳಿಗೆ ಪ್ರಶಸ್ತ.', desc_en: 'Sugar & Maize belt — highly optimal for Sugarcane, Maize, and Cotton.' },
  'Udupi': { zone_kn: 'ಕರಾವಳಿ ವಲಯ (Zone 10)', zone_en: 'Coastal Zone (Zone 10)', desc_kn: 'ಕರಾವಳಿ ಮೆಕ್ಕಲು ಮಣ್ಣು — ಭತ್ತ, ಅಡಿಕೆ, ತೆಂಗು, ಗೋಡಂಬಿಗೆ ಅತ್ಯುತ್ತಮ.', desc_en: 'Coastal alluvial tract — highly fertile for Paddy, Arecanut, and Coconut.' },
  'Mangaluru': { zone_kn: 'ಕರಾವಳಿ ವಲಯ (Zone 10)', zone_en: 'Coastal Zone (Zone 10)', desc_kn: 'ಹೆಚ್ಚು ಮಳೆ ಬೀಳುವ ಕರಾವಳಿ — ಭತ್ತ, ಅಡಿಕೆ, ಕರಿಮೆಣಸು, ತೆಂಗಿಗೆ ಸೂಕ್ತ.', desc_en: 'High rainfall coast — suitable for Paddy, Arecanut, and Spices.' },
  'Shivamogga': { zone_kn: 'ದಕ್ಷಿಣ ಪರಿವರ್ತನಾ ವಲಯ (Zone 7)', zone_en: 'Southern Transition Zone (Zone 7)', desc_kn: 'ಮಲೆನಾಡಿನ ಹೆಬ್ಬಾಗಿಲು — ಭತ್ತ, ಅಡಿಕೆ, ಮೆಕ್ಕೆಜೋಳ ಮತ್ತು ಶುಂಠಿಗೆ ಪ್ರಶಸ್ತ.', desc_en: 'Gateway to Malnad — ideal for Paddy, Arecanut, Maize, and Ginger.' },
  'Hassan': { zone_kn: 'ದಕ್ಷಿಣ ಪರಿವರ್ತನಾ ವಲಯ (Zone 7)', zone_en: 'Southern Transition Zone (Zone 7)', desc_kn: 'ಕಾಫಿ & ರಾಗಿ ನಾಡು — ಆಲೂಗಡ್ಡೆ, ಮೆಕ್ಕೆಜೋಳ, ಅಡಿಕೆ ಮತ್ತು ಶುಂಠಿಗೆ ಸೂಕ್ತ.', desc_en: 'Coffee & Ragi tract — suitable for Potato, Maize, and Ginger.' },
  'Ballari': { zone_kn: 'ಉತ್ತರ ಒಣ ವಲಯ (Zone 3)', zone_en: 'Northern Dry Zone (Zone 3)', desc_kn: 'ತುಂಗಭದ್ರಾ ಅಚ್ಚುಕಟ್ಟು — ಹತ್ತಿ, ಮೆಕ್ಕೆಜೋಳ, ಮೆಣಸಿನಕಾಯಿ ಮತ್ತು ಭತ್ತಕ್ಕೆ ಪ್ರಸಿದ್ಧ.', desc_en: 'Tungabhadra command — famous for Cotton, Maize, Chilli, and Paddy.' },
  'Vijayapura': { zone_kn: 'ಉತ್ತರ ಒಣ ವಲಯ (Zone 3)', zone_en: 'Northern Dry Zone (Zone 3)', desc_kn: 'ಕೃಷ್ಣಾ ಕಣಿವೆ — ದ್ರಾಕ್ಷಿ, ದಾಳಿಂಬೆ, ಜೋಳ, ಕಡಲೆ ಮತ್ತು ತೊಗರಿಗೆ ಸೂಕ್ತ.', desc_en: 'Krishna valley — famous for Grapes, Pomegranate, Jowar, and Tur.' },
  'Raichur': { zone_kn: 'ಈಶಾನ್ಯ ಒಣ ವಲಯ (Zone 2)', zone_en: 'North Eastern Dry Zone (Zone 2)', desc_kn: 'ಭತ್ತ & ಹತ್ತಿಯ ದೊರೆ — ನಾರಿನ ಹತ್ತಿ, ಭತ್ತ, ಶೇಂಗಾ ಮತ್ತು ಬೇಳೆಕಾಳುಗಳಿಗೆ ಪ್ರಶಸ್ತ.', desc_en: 'Doab region — famous for Cotton, Paddy, Groundnut, and Pulses.' }
};

// API Base URL - Automatically routes to FastAPI backend on port 8000 if served from dev server (e.g. port 5500) or file://
const API_BASE = (function() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '8000')) {
      return 'http://127.0.0.1:8000';
    }
  }
  return '';
})();

// DOM Elements Cache
let el = {};

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('mannumitra_sidebar_collapsed') === 'true') {
    document.body.classList.add('sidebar-collapsed');
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('sidebar-collapsed');
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }
  cacheElements();
  setupEventListeners();
  initStreakData();
  state.lifecycleSowingDate = getDefaultSowingDate();
  const sowingInput = document.getElementById('lifecycle-sowing-input');
  if (sowingInput) sowingInput.value = state.lifecycleSowingDate;

  await loadSoilTypes();
  await loadWeatherDistricts();
  renderDistricts();
  updateLanguageDisplay();
  
  // Default to Mandya weather on startup
  fetchWeatherData('Mandya');
  
  navTo('home');
});

function cacheElements() {
  el = {
    sidebar: document.getElementById('app-sidebar'),
    overlay: document.getElementById('sidebar-overlay'),
    menuToggle: document.getElementById('menu-toggle-btn'),
    langToggle: document.getElementById('lang-toggle-btn'),
    langBtnText: document.getElementById('lang-btn-text'),
    navBrandHome: document.getElementById('nav-brand-home'),
    btnHomeStart: document.getElementById('btn-home-start'),
    
    // Views
    views: {
      home: document.getElementById('view-home'),
      recommend: document.getElementById('view-recommend'),
      weather: document.getElementById('view-weather'),
      cropcare: document.getElementById('view-crop-care'),
      results: document.getElementById('view-results'),
      guide: document.getElementById('view-guide'),
      settings: document.getElementById('view-settings'),
      about: document.getElementById('view-about'),
      economics: document.getElementById('view-economics'),
      disease: document.getElementById('view-disease'),
      fertilizer: document.getElementById('view-fertilizer'),
      soil_ocr: document.getElementById('view-soil-ocr'),
      water: document.getElementById('view-water'),
      market: document.getElementById('view-market')
    },

    // Home Actions & Weather Card Elements
    btnHomeWeather: document.getElementById('btn-home-weather'),
    homeWeatherDistrict: document.getElementById('home-weather-district'),
    homeWeatherDistrictEn: document.getElementById('home-weather-district-en'),
    homeWeatherIcon: document.getElementById('home-weather-icon'),
    homeWeatherCond: document.getElementById('home-weather-cond'),
    homeWeatherTemp: document.getElementById('home-weather-temp'),
    homeWeatherRain: document.getElementById('home-weather-rain'),
    homeWeatherHum: document.getElementById('home-weather-hum'),
    homeWeatherWind: document.getElementById('home-weather-wind'),
    homeFieldActionText: document.getElementById('home-field-action-text'),
    homeCropName: document.getElementById('home-crop-name'),
    homeCropStage: document.getElementById('home-crop-stage'),
    homeCropActionText: document.getElementById('home-crop-action-text'),

    // Weather View Elements
    btnUseMyLocation: document.getElementById('btn-use-my-location'),
    geoNoticeBanner: document.getElementById('geo-notice-banner'),
    weatherDistrictDropdown: document.getElementById('weather-district-dropdown'),
    weatherQuickChips: document.getElementById('weather-quick-chips'),
    weatherErrorBanner: document.getElementById('weather-error-banner'),
    weatherErrorTitle: document.getElementById('weather-error-title'),
    weatherErrorDesc: document.getElementById('weather-error-desc'),
    weatherCurrDistrict: document.getElementById('weather-curr-district'),
    weatherCurrZone: document.getElementById('weather-curr-zone'),
    weatherMainIcon: document.getElementById('weather-main-icon'),
    weatherCurrTemp: document.getElementById('weather-curr-temp'),
    weatherCurrFeels: document.getElementById('weather-curr-feels'),
    weatherCurrCond: document.getElementById('weather-curr-condition'),
    weatherWorkActionText: document.getElementById('weather-work-action-text'),
    weatherCurrHumidity: document.getElementById('weather-curr-humidity'),
    weatherCurrRainfall: document.getElementById('weather-curr-rainfall'),
    weatherCurrWind: document.getElementById('weather-curr-wind'),
    weatherCurrSeasonal: document.getElementById('weather-curr-seasonal'),
    adviceIcon: document.getElementById('advice-icon'),
    adviceKn: document.getElementById('advice-kn'),
    adviceEn: document.getElementById('advice-en'),
    adviceTipsList: document.getElementById('advice-tips-list'),
    weatherTempCanvas: document.getElementById('weather-temp-chart'),
    weatherRainCanvas: document.getElementById('weather-rain-chart'),
    forecastCardsContainer: document.getElementById('forecast-cards-container'),

    // Crop Care View Elements
    careCropSelect: document.getElementById('care-crop-select'),
    careDistrictSelect: document.getElementById('care-district-select'),
    careQuickChips: document.getElementById('care-quick-chips'),
    careHeroIcon: document.getElementById('care-hero-icon'),
    careHeroHeadline: document.getElementById('care-hero-headline'),
    careHeroCond: document.getElementById('care-hero-cond'),
    careHeroAction: document.getElementById('care-hero-action'),
    careHeroCaution: document.getElementById('care-hero-caution'),
    careHeroCautionText: document.getElementById('care-hero-caution-text'),
    careTodayDistrictPill: document.getElementById('care-today-district-pill'),
    careGuideIcon: document.getElementById('care-guide-icon'),
    careGuideHeading: document.getElementById('care-guide-heading'),
    careGuideAuthority: document.getElementById('care-guide-authority'),
    careStageIcon: document.getElementById('care-stage-icon'),
    careStageNumTitle: document.getElementById('care-stage-num-title'),
    careStageName: document.getElementById('care-stage-name'),
    careActiveActionMain: document.getElementById('care-active-action-main'),
    careActiveActionSub: document.getElementById('care-active-action-sub'),
    careStageStepperText: document.getElementById('care-stage-stepper-text'),
    btnCarePrev: document.getElementById('btn-care-prev'),
    btnCareNext: document.getElementById('btn-care-next'),
    careFullStagesContainer: document.getElementById('care-full-stages-container'),

    // Recommendation Screen Stage 5 Elements
    recTodayIcon: document.getElementById('rec-today-icon'),
    recTodayHeadline: document.getElementById('rec-today-headline'),
    recTodayCond: document.getElementById('rec-today-cond'),
    recTodayInstruction: document.getElementById('rec-today-instruction'),
    recTodayCaution: document.getElementById('rec-today-caution'),
    recTodayCautionText: document.getElementById('rec-today-caution-text'),
    recResultSoilTag: document.getElementById('rec-result-soil-tag'),
    recResultLocTag: document.getElementById('rec-result-loc-tag'),
    recStagesPreviewGrid: document.getElementById('rec-stages-preview-grid'),

    // Wizard Screens
    wizardScreens: {
      1: document.getElementById('screen-step1'),
      2: document.getElementById('screen-step2'),
      3: document.getElementById('screen-step3'),
      4: document.getElementById('screen-result')
    },

    // Wizard Controls
    stepperFill: document.getElementById('stepper-fill'),
    dots: [
      document.getElementById('dot-1'),
      document.getElementById('dot-2'),
      document.getElementById('dot-3'),
      document.getElementById('dot-4')
    ],
    btnBack: document.getElementById('btn-back'),
    btnNext: document.getElementById('btn-next'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),
    soilGrid: document.getElementById('soil-grid-container'),
    districtGrid: document.getElementById('district-container'),
    selectedSoilTitle: document.getElementById('selected-soil-title'),
    loadingOverlay: document.getElementById('loading-overlay'),

    // Redesigned Recommendation UI Elements
    recTopSoilLabel: document.getElementById('rec-top-soil-label'),
    recTopDistLabel: document.getElementById('rec-top-dist-label'),
    recLocZoneBadge: document.getElementById('rec-loc-zone-badge'),
    recLocSelectedTitle: document.getElementById('rec-loc-selected-title'),
    recConditionsDistTag: document.getElementById('rec-conditions-dist-tag'),
    recSummaryLine: document.getElementById('rec-summary-line'),
    heroSuitabilityScore: document.getElementById('hero-suitability-score'),
    btnRecSubmit: document.getElementById('btn-rec-submit'),
    btnGotoDisease: document.getElementById('btn-goto-disease'),

    // Step 3 Live Weather Controls
    btnRecUseLocation: document.getElementById('btn-rec-use-location'),
    recGeoNoticeBanner: document.getElementById('rec-geo-notice-banner'),
    recWeatherLiveBox: document.getElementById('rec-weather-live-box'),
    recLiveLocation: document.getElementById('rec-live-location'),
    recLiveTemp: document.getElementById('rec-live-temp'),
    recLiveRain: document.getElementById('rec-live-rain'),
    recLiveHum: document.getElementById('rec-live-hum'),
    recLiveWeatherText: document.getElementById('rec-live-weather-text'),
    btnRefreshWeather: document.getElementById('btn-refresh-weather'),

    // Sliders
    sliderPh: document.getElementById('slider-ph'),
    sliderN: document.getElementById('slider-n'),
    sliderP: document.getElementById('slider-p'),
    sliderK: document.getElementById('slider-k'),
    sliderTemp: document.getElementById('slider-temp'),
    sliderRain: document.getElementById('slider-rain'),
    sliderHum: document.getElementById('slider-hum'),

    // Badges
    valPh: document.getElementById('val-ph'),
    valN: document.getElementById('val-n'),
    valP: document.getElementById('val-p'),
    valK: document.getElementById('val-k'),
    valTemp: document.getElementById('val-temp'),
    valRain: document.getElementById('val-rain'),
    valHum: document.getElementById('val-hum'),

    // Disease Scanner View Elements
    diseaseDropzone: document.getElementById('disease-dropzone'),
    diseaseFileInput: document.getElementById('disease-file-input'),
    diseaseCameraInput: document.getElementById('disease-camera-input'),
    btnDiseaseBrowse: document.getElementById('btn-disease-browse'),
    btnDiseaseCamera: document.getElementById('btn-disease-camera'),
    btnDiseaseSample: document.getElementById('btn-disease-sample'),
    diseasePreviewContainer: document.getElementById('disease-preview-container'),
    diseasePreviewImg: document.getElementById('disease-preview-img'),
    diseaseFileName: document.getElementById('disease-file-name'),
    diseaseFileSize: document.getElementById('disease-file-size'),
    btnDiseaseClear: document.getElementById('btn-disease-clear'),
    btnDetectDisease: document.getElementById('btn-detect-disease'),
    detectBtnIcon: document.getElementById('detect-btn-icon'),
    detectBtnText: document.getElementById('detect-btn-text'),
    diseaseErrorBanner: document.getElementById('disease-error-banner'),
    diseaseErrorText: document.getElementById('disease-error-text'),
    diseaseCropMismatchCard: document.getElementById('disease-crop-mismatch-card'),
    mismatchDetailsBox: document.getElementById('mismatch-details-box'),
    mismatchTitleKn: document.getElementById('mismatch-title-kn'),
    mismatchTitleEn: document.getElementById('mismatch-title-en'),
    mismatchSelectedCrop: document.getElementById('mismatch-selected-crop'),
    mismatchDetectedCrop: document.getElementById('mismatch-detected-crop'),
    mismatchConfidence: document.getElementById('mismatch-confidence'),
    mismatchConfRow: document.getElementById('mismatch-conf-row'),
    mismatchMsgKn: document.getElementById('mismatch-msg-kn'),
    mismatchMsgEn: document.getElementById('mismatch-msg-en'),
    diseaseResultCard: document.getElementById('disease-result-card'),
    diseaseLowConfAlert: document.getElementById('disease-low-conf-alert'),
    resPlantIcon: document.getElementById('res-plant-icon'),
    resPlantName: document.getElementById('res-plant-name'),
    resDiseaseNameKn: document.getElementById('res-disease-name-kn'),
    resDiseaseNameEn: document.getElementById('res-disease-name-en'),
    resHealthBadge: document.getElementById('res-health-badge'),
    resSeverityTag: document.getElementById('res-severity-tag'),
    resConfidenceTxt: document.getElementById('res-confidence-txt'),
    resConfidenceBar: document.getElementById('res-confidence-bar'),
    resSymptomsList: document.getElementById('res-symptoms-list'),
    resOrganicList: document.getElementById('res-organic-list'),
    resChemicalList: document.getElementById('res-chemical-list'),
    resPreventionList: document.getElementById('res-prevention-list'),
    resDisclaimerText: document.getElementById('res-disclaimer-text')
  };
}

window.toggleSidebarCollapsed = function(force) {
  const isNow = document.body.classList.toggle('sidebar-collapsed', force);
  const shell = document.querySelector('.app-shell');
  if (shell) shell.classList.toggle('sidebar-collapsed', isNow);
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', isNow);
  localStorage.setItem('mannumitra_sidebar_collapsed', isNow ? 'true' : 'false');
  const btn = document.getElementById('sidebar-collapse-btn');
  if (btn) btn.setAttribute('aria-expanded', isNow ? 'false' : 'true');
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 260);
  return isNow;
};

function setupEventListeners() {
  // Mobile drawer toggle
  el.menuToggle.addEventListener('click', toggleMobileSidebar);
  el.overlay.addEventListener('click', closeMobileSidebar);

  // Desktop Sidebar Collapse Toggle
  const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
  if (sidebarCollapseBtn) {
    sidebarCollapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.toggleSidebarCollapsed();
    });
  }

  // Logo click -> Home
  el.navBrandHome.addEventListener('click', () => navTo('home'));

  // Sidebar navigation clicks
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      navTo(target);
      closeMobileSidebar();
    });
  });

  // Language toggle
  el.langToggle.addEventListener('click', toggleLanguage);

  // Home CTA -> Start Recommendation
  if (el.btnHomeStart) {
    el.btnHomeStart.addEventListener('click', () => {
      navTo('recommend');
      setWizardStep(1);
    });
  }

  // Home CTA -> Check Weather
  if (el.btnHomeWeather) {
    el.btnHomeWeather.addEventListener('click', () => {
      navTo('weather');
    });
  }

  // Weather View -> Use My Location
  if (el.btnUseMyLocation) {
    el.btnUseMyLocation.addEventListener('click', () => {
      useMyLocation('weather');
    });
  }

  // Recommendation Step 3 -> Use My Location
  if (el.btnRecUseLocation) {
    el.btnRecUseLocation.addEventListener('click', () => {
      useMyLocation('recommend');
    });
  }

  // Weather District Select Dropdown
  if (el.weatherDistrictDropdown) {
    el.weatherDistrictDropdown.addEventListener('change', e => {
      onWeatherDistrictSelected(e.target.value);
    });
  }

  // Crop Care View Listeners
  if (el.careCropSelect) {
    el.careCropSelect.addEventListener('change', e => {
      onCareCropChanged(e.target.value);
    });
  }

  if (el.careDistrictSelect) {
    el.careDistrictSelect.addEventListener('change', e => {
      onCareDistrictChanged(e.target.value);
    });
  }

  if (el.careQuickChips) {
    el.careQuickChips.querySelectorAll('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cropId = chip.getAttribute('data-crop');
        if (window.selectLifecycleCrop) {
          window.selectLifecycleCrop(cropId);
        } else {
          onCareCropChanged(cropId);
        }
      });
    });
  }

  // Lifecycle CTA in Recommendation Screen
  const btnStartLifecycle = document.getElementById('btn-start-lifecycle');
  if (btnStartLifecycle) {
    btnStartLifecycle.addEventListener('click', () => {
      window.startLifecycleForCurrent();
    });
  }

  // Farm Economics CTA in Recommendation Screen
  const btnEstimateEconomics = document.getElementById('btn-estimate-economics');
  if (btnEstimateEconomics) {
    btnEstimateEconomics.addEventListener('click', () => {
      window.openEconomicsForCurrent();
    });
  }

  // Complete Today's Task CTA
  const btnCompleteTask = document.getElementById('btn-complete-task');
  if (btnCompleteTask) {
    btnCompleteTask.addEventListener('click', () => {
      window.markTodayTaskComplete();
    });
  }

  // Lifecycle Tab Switchers
  const tabBtnTimeline = document.getElementById('tab-btn-timeline');
  if (tabBtnTimeline) {
    tabBtnTimeline.addEventListener('click', () => {
      window.switchLifecycleTab('timeline');
    });
  }
  const tabBtnCalendar = document.getElementById('tab-btn-calendar');
  if (tabBtnCalendar) {
    tabBtnCalendar.addEventListener('click', () => {
      window.switchLifecycleTab('calendar');
    });
  }

  // Refresh Weather in Step 3
  if (el.btnRefreshWeather) {
    el.btnRefreshWeather.addEventListener('click', () => {
      refreshWeatherForStep3();
    });
  }

  // Wizard Navigation
  el.btnBack.addEventListener('click', handleWizardBack);
  el.btnNext.addEventListener('click', handleWizardNext);
  if (el.btnRecSubmit) {
    el.btnRecSubmit.addEventListener('click', fetchRecommendation);
  }
  el.btnResetDefaults.addEventListener('click', resetToSoilDefaults);

  // Slider inputs
  el.sliderPh.addEventListener('input', e => {
    state.form.ph = parseFloat(e.target.value);
    el.valPh.textContent = state.form.ph.toFixed(1);
  });

  el.sliderN.addEventListener('input', e => {
    state.form.nitrogen = parseInt(e.target.value);
    el.valN.textContent = state.form.nitrogen;
  });

  el.sliderP.addEventListener('input', e => {
    state.form.phosphorus = parseInt(e.target.value);
    el.valP.textContent = state.form.phosphorus;
  });

  el.sliderK.addEventListener('input', e => {
    state.form.potassium = parseInt(e.target.value);
    el.valK.textContent = state.form.potassium;
  });

  el.sliderTemp.addEventListener('input', e => {
    state.form.temperature = parseFloat(e.target.value);
    el.valTemp.textContent = `${state.form.temperature.toFixed(1)} °C`;
  });

  el.sliderRain.addEventListener('input', e => {
    state.form.rainfall = parseFloat(e.target.value);
    el.valRain.textContent = `${state.form.rainfall.toFixed(0)} mm`;
  });

  el.sliderHum.addEventListener('input', e => {
    state.form.humidity = parseFloat(e.target.value);
    el.valHum.textContent = `${state.form.humidity.toFixed(0)} %`;
  });

  // Initialize Disease Scanner
  initDiseaseScannerEvents();
}

// Global View Switcher
function navTo(viewName) {
  state.currentView = viewName;

  // Toggle View Panels
  Object.keys(el.views).forEach(key => {
    if (el.views[key]) {
      el.views[key].classList.toggle('active', key === viewName);
    }
  });

  // Update Sidebar active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    const isTarget = btn.getAttribute('data-nav') === viewName;
    btn.classList.toggle('active', isTarget);
  });

  // If opening Soil Report OCR, initialize dropzone & actions
  if (viewName === 'soil_ocr') {
    initSoilOCRFeature();
  }

  // If opening Water Suitability, initialize calculator
  if (viewName === 'water') {
    initWaterFeature();
  }

  // If opening Market & Forecast, load live mandi prices
  if (viewName === 'market') {
    initMarketFeature();
  }

  // If opening Weather Report, make sure data is loaded
  if (viewName === 'weather') {
    if (!state.currentWeather) {
      fetchWeatherData(state.selectedWeatherDistrict);
    }
  }

  // If opening Crop Care / Lifecycle, make sure data is loaded
  if (viewName === 'cropcare') {
    populateCareDistricts();
    loadCropLifecycle(state.selectedCareCrop, state.selectedCareDistrict, state.lifecycleSowingDate);
  }

  // If opening Fertilizer Advisory, ensure selected crop panel is displayed
  if (viewName === 'fertilizer') {
    const activeChip = document.querySelector('#fert-crop-chips .fert-chip.active');
    const cropId = activeChip ? activeChip.getAttribute('data-crop') : 'ragi';
    if (typeof window.selectFertilizerCrop === 'function') {
      window.selectFertilizerCrop(cropId);
    }
  }

  // If opening Farm Economics, make sure benchmark defaults are loaded
    // If opening Government Schemes & Insurance, load verified schemes
  if (viewName === 'guide' || viewName === 'schemes') {
    if (typeof initSchemesFeature === 'function') {
      initSchemesFeature();
    }
  }

  if (viewName === 'economics') {
    initEconomicsView();
  }

  // If opening Recommendation, ensure wizard step is valid
  if (viewName === 'recommend') {
    if (state.wizardStep === 4 && !state.lastRecommendation) {
      setWizardStep(1);
    } else {
      setWizardStep(state.wizardStep);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.navTo = navTo; // Expose globally for inline buttons

// Crop Explorer click handler from Home page
window.openCropFromHome = function(cropId) {
  state.selectedCareCrop = cropId;
  const careSelect = document.getElementById('care-crop-select');
  if (careSelect) careSelect.value = cropId;
  navTo('cropcare');
  loadCropLifecycle(cropId, state.selectedCareDistrict, state.lifecycleSowingDate);
};


// Fertilizer Advisory Crop Switcher
window.selectFertilizerCrop = function(cropId, clickedBtn) {
  document.querySelectorAll('#fert-crop-chips .fert-chip').forEach(btn => {
    btn.classList.toggle('active', btn === clickedBtn || btn.getAttribute('data-crop') === cropId);
  });
  ['ragi', 'rice', 'maize', 'tomato', 'arecanut'].forEach(c => {
    const p = document.getElementById(`fert-panel-${c}`);
    if (p) {
      p.style.display = (c === cropId) ? 'block' : 'none';
    }
  });
};

// Mobile Sidebar Drawer
function toggleMobileSidebar() {
  el.sidebar.classList.toggle('open');
  el.overlay.classList.toggle('active');
}

function closeMobileSidebar() {
  el.sidebar.classList.remove('open');
  el.overlay.classList.remove('active');
}

// Wizard Step Management (1: Soil, 2: Location, 3: Conditions, 4: Result)
function setWizardStep(step) {
  state.wizardStep = step;

  // Toggle wizard screens
  Object.keys(el.wizardScreens).forEach(k => {
    const s = parseInt(k);
    if (el.wizardScreens[s]) {
      el.wizardScreens[s].classList.toggle('active', s === step);
    }
  });

  // Update Stepper dots and progress fill (4-Step Farming Journey)
  el.dots.forEach((dot, idx) => {
    if (!dot) return;
    const dotStep = idx + 1;
    dot.classList.remove('active', 'completed');
    if (dotStep === step) dot.classList.add('active');
    else if (dotStep < step) dot.classList.add('completed');
  });

  const fillPercent = ((step - 1) / 3) * 100;
  if (el.stepperFill) el.stepperFill.style.width = `${fillPercent}%`;

  // When opening Step 2 (Location), auto-fetch live weather for selected district
  if (step === 2) {
    const dObj = KARNATAKA_DISTRICTS.find(d => d.id === state.form.district) || KARNATAKA_DISTRICTS[0];
    fetchWeatherForStep3(dObj);
  }

  // Update Top Active Pill and Conditions Summary
  updateTopActivePillAndSummary();

  // Bottom Buttons configuration
  const nextTxt = t('common.next', 'Next');
  if (step === 1) {
    if (el.btnNext) {
      el.btnNext.classList.remove('btn-rec-main-action');
      el.btnNext.innerHTML = `<span>${nextTxt}</span> ➔`;
    }
    if (el.btnBack) el.btnBack.style.display = 'none';
  } else if (step === 2) {
    if (el.btnNext) {
      el.btnNext.classList.remove('btn-rec-main-action');
      el.btnNext.innerHTML = `<span>${nextTxt}</span> ➔`;
    }
    if (el.btnBack) el.btnBack.style.display = 'inline-flex';
  } else if (step === 3) {
    if (el.btnBack) el.btnBack.style.display = 'inline-flex';
    if (el.btnNext) {
      el.btnNext.classList.add('btn-rec-main-action');
      const submitTxt = state.lang === 'kn' ? '✨ ಬೆಳೆ ಶಿಫಾರಸು ಮಾಡಿ ➔' : '✨ Recommend Crop ➔';
      el.btnNext.innerHTML = `<span>${t('rec.btn_submit', submitTxt)}</span>`;
    }
  }

  const botBar = document.getElementById('recommend-bottom-bar');
  if (botBar) botBar.style.display = (step === 4) ? 'none' : 'flex';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update Top Active Pill and Conditions Summary
function updateTopActivePillAndSummary() {
  const isKn = state.lang === 'kn';
  const soilObj = state.soilTypes?.find(s => s.id === state.form.soil_type);
  const soilLabel = soilObj 
    ? (isKn ? `${soilObj.name_kn} (${soilObj.name_en})` : soilObj.name_en)
    : (state.form.soil_type || 'ಕೆಂಪು ಮಣ್ಣು (Red Soil)');

  const distObj = KARNATAKA_DISTRICTS.find(d => d.id === state.form.district) || { id: state.form.district || 'Mandya', name_en: 'Mandya', name_kn: 'ಮಂಡ್ಯ' };
  const distLabel = isKn ? `${distObj.name_kn} (${distObj.name_en})` : distObj.name_en;

  if (el.recTopSoilLabel) el.recTopSoilLabel.textContent = soilLabel;
  if (el.recTopDistLabel) el.recTopDistLabel.textContent = distLabel;

  if (el.recSummaryLine) {
    el.recSummaryLine.textContent = `${soilLabel} • ${distLabel}`;
  }
  if (el.recConditionsDistTag) {
    el.recConditionsDistTag.textContent = `📍 ${distLabel}`;
  }
}

// Wizard Next Handler
async function handleWizardNext() {
  if (state.wizardStep === 1) {
    setWizardStep(2);
  } else if (state.wizardStep === 2) {
    setWizardStep(3);
  } else if (state.wizardStep === 3) {
    await fetchRecommendation();
  } else if (state.wizardStep === 4) {
    // Reset back to Step 1
    setWizardStep(1);
  }
}

// Wizard Back Handler
function handleWizardBack() {
  if (state.wizardStep === 2) {
    setWizardStep(1);
  } else if (state.wizardStep === 3) {
    setWizardStep(2);
  }
}

// Fetch Soil Types from Backend
async function loadSoilTypes() {
  try {
    const res = await fetch(`${API_BASE}/api/soil-types`);
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    state.soilTypes = data.soil_types;
    renderSoilCards();
  } catch (err) {
    console.warn('Using local fallback for soil types:', err);
    state.soilTypes = [
      {
        id: 'red_soil',
        name_en: 'Red Soil',
        name_kn: 'ಕೆಂಪು ಮಣ್ಣು',
        description_en: 'Common in southern & eastern Karnataka. Ideal for Ragi, Maize, Groundnut.',
        description_kn: 'ದಕ್ಷಿಣ ಮತ್ತು ಪೂರ್ವ ಕರ್ನಾಟಕ. ರಾಗಿ, ಮೆಕ್ಕೆಜೋಳ, ಕಡಲೆಕಾಯಿಗೆ ಸೂಕ್ತ.',
        properties: { ph: { default: 6.5 }, nitrogen: { default: 180 }, phosphorus: { default: 18 }, potassium: { default: 200 } }
      },
      {
        id: 'black_soil',
        name_en: 'Black Soil',
        name_kn: 'ಕಪ್ಪು ಮಣ್ಣು',
        description_en: 'Northern Karnataka belt. Moisture retentive, great for Cotton & Jowar.',
        description_kn: 'ಉತ್ತರ ಕರ್ನಾಟಕದ ಪ್ರಧಾನ ಮಣ್ಣು. ಹತ್ತಿ, ಜೋಳ, ತೊಗರಿಗೆ ಸೂಕ್ತ.',
        properties: { ph: { default: 7.8 }, nitrogen: { default: 250 }, phosphorus: { default: 22 }, potassium: { default: 310 } }
      },
      {
        id: 'sandy_soil',
        name_en: 'Sandy Soil',
        name_kn: 'ಮರಳು ಮಣ್ಣು',
        description_en: 'Well-drained soil found in Kolar, Tumkur. Great for Groundnut.',
        description_kn: 'ಉತ್ತಮ ನೀರು ಬಸಿದುಹೋಗುವ ಮಣ್ಣು. ಕಡಲೆಕಾಯಿ, ಸಜ್ಜೆಗೆ ಸೂಕ್ತ.',
        properties: { ph: { default: 6.2 }, nitrogen: { default: 120 }, phosphorus: { default: 12 }, potassium: { default: 110 } }
      },
      {
        id: 'alluvial_soil',
        name_en: 'Alluvial Soil',
        name_kn: 'ಮೆಕ್ಕಲು ಮಣ್ಣು',
        description_en: 'River valleys and coastal tracts. Highly fertile for Rice & Sugarcane.',
        description_kn: 'ನದಿ ಜಲಾನಯನ ಮತ್ತು ಕರಾವಳಿ ಪ್ರದೇಶ. ಭತ್ತ, ಕಬ್ಬಿಗೆ ಅತ್ಯುತ್ತಮ.',
        properties: { ph: { default: 7.0 }, nitrogen: { default: 240 }, phosphorus: { default: 22 }, potassium: { default: 260 } }
      }
    ];
    renderSoilCards();
  }
}

// Render Step 1 Soil Cards with Genuine Photos
function renderSoilCards() {
  if (!el.soilGrid) return;
  el.soilGrid.innerHTML = '';

  state.soilTypes.forEach(soil => {
    const card = document.createElement('div');
    card.className = `soil-card ${soil.id === state.form.soil_type ? 'selected' : ''}`;
    card.id = `soil-card-${soil.id}`;
    card.addEventListener('click', () => selectSoil(soil));

    const imgSrc = SOIL_IMAGES[soil.id] || 'public/images/soils/red_soil.jpg';

    card.innerHTML = `
      <div class="soil-card-img-wrap">
        <img src="${imgSrc}" alt="${soil.name_en}" class="soil-card-img">
        <span class="soil-badge">✓ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ</span>
      </div>
      <div class="soil-card-body">
        <div class="soil-name-kn">${soil.name_kn}</div>
        <div class="soil-name-en">${soil.name_en}</div>
        <p class="soil-desc">${state.lang === 'kn' ? soil.description_kn : soil.description_en}</p>
      </div>
    `;
    el.soilGrid.appendChild(card);
  });
}

// Handle Soil Selection
function selectSoil(soil, forceDefaults = false) {
  state.selectedSoil = soil;
  state.form.soil_type = soil.id;

  document.querySelectorAll('.soil-card').forEach(c => c.classList.remove('selected'));
  const active = document.getElementById(`soil-card-${soil.id}`);
  if (active) active.classList.add('selected');

  const profile = (typeof window.getFarmerProfile === 'function') ? window.getFarmerProfile() : null;
  const isSHCVerified = profile && profile.soil_verified_by_farmer && !forceDefaults;

  if (isSHCVerified) {
    // Reuse verified parameters from uploaded Soil Health Card (SHC)
    state.form.ph = profile.ph ?? state.form.ph;
    state.form.nitrogen = profile.nitrogen ?? state.form.nitrogen;
    state.form.phosphorus = profile.phosphorus ?? state.form.phosphorus;
    state.form.potassium = profile.potassium ?? state.form.potassium;
  } else {
    // Pre-fill ICAR regional defaults for selected soil type
    const props = soil.properties || {};
    state.form.ph = props.ph?.default ?? 6.5;
    state.form.nitrogen = props.nitrogen?.default ?? 180;
    state.form.phosphorus = props.phosphorus?.default ?? 18;
    state.form.potassium = props.potassium?.default ?? 200;
  }

  syncSliders();
  if (el.selectedSoilTitle) {
    el.selectedSoilTitle.textContent = `${soil.name_kn} (${soil.name_en})`;
  }
  updateTopActivePillAndSummary();
  updateSoilNutrientsStatusUI();
}

// Reset to Defaults (Restores regional baseline if farmer wishes)
function resetToSoilDefaults() {
  const current = state.soilTypes.find(s => s.id === state.form.soil_type);
  if (current) {
    if (typeof window.saveFarmerProfile === 'function') {
      window.saveFarmerProfile({ soil_verified_by_farmer: false, soil_source: 'regional_baseline' });
    }
    selectSoil(current, true);
  }
}

// Update Soil Nutrients Section Status Indicator
function updateSoilNutrientsStatusUI(p) {
  if (!p && typeof window.getFarmerProfile === 'function') {
    p = window.getFarmerProfile();
  }
  const isKn = state.lang === 'kn';
  const indicator = document.getElementById('soil-nutrients-status-indicator');
  const icon = document.getElementById('soil-source-icon');
  const text = document.getElementById('soil-source-text');
  const badge = document.getElementById('soil-source-badge');

  if (indicator && text) {
    if (p && p.soil_verified_by_farmer) {
      indicator.style.background = '#ecfdf5';
      indicator.style.color = '#065f46';
      indicator.style.borderColor = '#a7f3d0';
      if (icon) icon.textContent = '✓';
      text.textContent = isKn
        ? 'ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್‌ನಿಂದ ಮೌಲ್ಯಗಳನ್ನು ಪಡೆಯಲಾಗಿದೆ (Reused from Verified SHC)'
        : 'Reused from Verified Soil Health Card (SHC)';
      if (badge) {
        badge.textContent = isKn ? 'ದೃಢೀಕೃತ / Verified' : 'Verified SHC';
        badge.style.background = 'rgba(6, 95, 70, 0.12)';
        badge.style.color = '#065f46';
      }
    } else {
      indicator.style.background = '#eff6ff';
      indicator.style.color = '#1e40af';
      indicator.style.borderColor = '#bfdbfe';
      if (icon) icon.textContent = '⚡';
      text.textContent = isKn
        ? 'ICAR ಪ್ರಾದೇಶಿಕ ಸರಾಸರಿ ಅನ್ವಯಿಸಲಾಗಿದೆ (Regional Baseline Auto-Filled)'
        : 'ICAR Regional Baseline Auto-Filled';
      if (badge) {
        badge.textContent = isKn ? 'ಸ್ವಯಂಚಾಲಿತ / Auto' : 'Regional Auto';
        badge.style.background = 'rgba(30, 64, 175, 0.1)';
        badge.style.color = '#1e40af';
      }
    }
  }
}
window.updateSoilNutrientsStatusUI = updateSoilNutrientsStatusUI;

// Sync Sliders with Form State
function syncSliders() {
  el.sliderPh.value = state.form.ph;
  el.valPh.textContent = state.form.ph.toFixed(1);

  el.sliderN.value = state.form.nitrogen;
  el.valN.textContent = state.form.nitrogen;

  el.sliderP.value = state.form.phosphorus;
  el.valP.textContent = state.form.phosphorus;

  el.sliderK.value = state.form.potassium;
  el.valK.textContent = state.form.potassium;

  el.sliderTemp.value = state.form.temperature;
  el.valTemp.textContent = `${state.form.temperature.toFixed(1)} °C`;

  el.sliderRain.value = state.form.rainfall;
  el.valRain.textContent = `${state.form.rainfall.toFixed(0)} mm`;

  el.sliderHum.value = state.form.humidity;
  el.valHum.textContent = `${state.form.humidity.toFixed(0)} %`;
}

// Render District Chips in Step 3
function renderDistricts() {
  if (!el.districtGrid) return;
  el.districtGrid.innerHTML = '';

  KARNATAKA_DISTRICTS.forEach(d => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `district-chip ${state.form.district === d.id ? 'selected' : ''}`;
    chip.id = `district-chip-${d.id}`;
    chip.innerHTML = `
      <span class="district-kn">${d.name_kn}</span>
      <span class="district-en">${d.name_en}</span>
    `;

    chip.addEventListener('click', () => {
      selectDistrictForStep3(d);
    });

    el.districtGrid.appendChild(chip);
  });
}

// Step 2 & 3 District Click with Live Weather Auto-Fetch & Visual Zone Mapping
async function selectDistrictForStep3(district) {
  state.form.district = district.id;
  document.querySelectorAll('.district-chip').forEach(c => c.classList.remove('selected'));
  const active = document.getElementById(`district-chip-${district.id}`);
  if (active) active.classList.add('selected');

  // Set seasonal rainfall normal (for ML model consistency!)
  state.form.rainfall = district.rain || 760;

  // Update district zone info and title in Location view
  const isKn = state.lang === 'kn';
  const zInfo = DISTRICT_ZONE_INFO[district.id] || {
    zone_kn: 'ಕರ್ನಾಟಕ ಕೃಷಿ ವಲಯ',
    zone_en: 'Karnataka Agro Zone',
    desc_kn: 'ಕರ್ನಾಟಕ ಕೃಷಿ-ಹವಾಮಾನ ವಲಯ.',
    desc_en: 'Karnataka agro-climatic zone.'
  };

  if (el.recLocZoneBadge) {
    el.recLocZoneBadge.textContent = isKn ? zInfo.zone_kn : zInfo.zone_en;
  }
  if (el.recLocSelectedTitle) {
    el.recLocSelectedTitle.innerHTML = isKn 
      ? `<span class="txt-kn">${district.name_kn} (${district.name_en}), ಕರ್ನಾಟಕ</span>`
      : `<span class="txt-en">${district.name_en}, Karnataka</span>`;
  }
  const descEl = document.querySelector('.rec-loc-desc');
  if (descEl) {
    descEl.innerHTML = isKn
      ? `<span class="txt-kn">${zInfo.desc_kn}</span>`
      : `<span class="txt-en">${zInfo.desc_en}</span>`;
  }

  updateTopActivePillAndSummary();

  // Fetch live Open-Meteo weather
  await fetchWeatherForStep3(district);
}

async function fetchWeatherForStep3(district) {
  if (!district) return;
  const isKn = state.lang === 'kn';

  if (el.recLiveLocation) {
    el.recLiveLocation.textContent = `📍 ${isKn ? district.name_kn : district.name_en}, Karnataka`;
  }
  if (el.recLiveWeatherText) {
    el.recLiveWeatherText.innerHTML = isKn
      ? `⏳ ಹವಾಮಾನ ಮಾಹಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ... (${district.name_kn || district.name_en})`
      : `⏳ Fetching live weather from Open-Meteo... (${district.name_en || district.name_kn})`;
  }

  try {
    const res = await fetch(`${API_BASE}/api/weather?district=${encodeURIComponent(district.id || district.name_en)}`);
    if (res.ok) {
      const wData = await res.json();
      state.form.temperature = wData.current.temperature;
      state.form.humidity = wData.current.humidity;
      // Do NOT overwrite state.form.rainfall with today's 0-10mm! Retain seasonal rainfall normal.
      syncSliders();

      if (el.recLiveTemp) el.recLiveTemp.textContent = `${wData.current.temperature.toFixed(1)}°C`;
      if (el.recLiveRain) el.recLiveRain.textContent = `${state.form.rainfall.toFixed(0)} mm`;
      if (el.recLiveHum) el.recLiveHum.textContent = `${wData.current.humidity}%`;

      if (el.recLiveWeatherText) {
        el.recLiveWeatherText.innerHTML = isKn
          ? `📡 <strong>${wData.name_kn}</strong> ನೈಜ ಹವಾಮಾನ: <strong>${wData.current.temperature.toFixed(1)}°C</strong>, ತೇವಾಂಶ <strong>${wData.current.humidity}%</strong> (ಇಂದಿನ ಮಳೆ: ${wData.current.rainfall} mm)`
          : `📡 <strong>${wData.name_en}</strong> Live Weather: <strong>${wData.current.temperature.toFixed(1)}°C</strong>, Humidity <strong>${wData.current.humidity}%</strong> (Today's Rain: ${wData.current.rainfall} mm)`;
      }
      return;
    }
  } catch (e) {
    console.warn('Live weather fetch failed, using presets:', e);
  }

  // Fallback if network or API fails
  state.form.temperature = district.temp || 25.5;
  state.form.humidity = district.hum || 65;
  syncSliders();
  if (el.recLiveTemp) el.recLiveTemp.textContent = `${state.form.temperature.toFixed(1)}°C`;
  if (el.recLiveRain) el.recLiveRain.textContent = `${state.form.rainfall.toFixed(0)} mm`;
  if (el.recLiveHum) el.recLiveHum.textContent = `${state.form.humidity}%`;

  if (el.recLiveWeatherText) {
    el.recLiveWeatherText.innerHTML = isKn
      ? `⚠️ ಹವಾಮಾನ ಸರ್ವರ್ ತಾತ್ಕಾಲಿಕ ಲಭ್ಯವಿಲ್ಲ. ಸಾಮಾನ್ಯ ಮೌಲ್ಯಗಳು ಭರ್ತಿಯಾಗಿವೆ.`
      : `⚠️ Weather service temporarily unavailable. Default values loaded.`;
  }
}

function refreshWeatherForStep3() {
  const currDistrict = KARNATAKA_DISTRICTS.find(d => d.id === state.form.district) || { id: state.form.district, name_en: state.form.district, name_kn: state.form.district };
  fetchWeatherForStep3(currDistrict);
}

// ==========================================================================
// STAGE 4: WEATHER SERVICE CLIENT FUNCTIONS
// ==========================================================================

// Chart instances for Stage 4 Weather View
let tempChartInstance = null;
let rainChartInstance = null;

// Load Weather Districts
async function loadWeatherDistricts() {
  try {
    const res = await fetch(`${API_BASE}/api/weather/districts`);
    if (!res.ok) throw new Error('Districts fetch failed');
    const data = await res.json();
    state.weatherDistricts = (data.districts && data.districts.length > 0) ? data.districts : [];
  } catch (err) {
    console.warn('Fallback weather districts list used:', err);
    state.weatherDistricts = KARNATAKA_DISTRICTS.map(d => ({
      id: d.id.toLowerCase(),
      name_kn: d.name_kn,
      name_en: d.name_en,
      zone: 'Karnataka Agro-Climatic Zone',
      seasonal_rainfall_normal_mm: d.rain
    }));
  }
  populateWeatherControls();
}

function populateWeatherControls() {
  if (!el.weatherDistrictDropdown) return;

  const currentSel = (state.selectedWeatherDistrict || 'mandya').toLowerCase();

  // Populate Dropdown
  el.weatherDistrictDropdown.innerHTML = '';
  state.weatherDistricts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.name_kn} (${d.name_en}) — ${d.zone || ''}`;
    if (d.id.toLowerCase() === currentSel || (d.name_en && d.name_en.toLowerCase() === currentSel)) {
      opt.selected = true;
    }
    el.weatherDistrictDropdown.appendChild(opt);
  });

  // Populate Quick Chips for Weather View (all 15 Karnataka districts)
  if (el.weatherQuickChips) {
    el.weatherQuickChips.innerHTML = '';
    state.weatherDistricts.forEach(d => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isSelected = d.id.toLowerCase() === currentSel || (d.name_en && d.name_en.toLowerCase() === currentSel);
      chip.className = `weather-chip-btn ${isSelected ? 'active' : ''}`;
      chip.id = `wchip-${d.id.toLowerCase()}`;
      chip.innerHTML = `<span class="chip-kn">${d.name_kn}</span> <span class="chip-sep">/</span> <span class="chip-en">${d.name_en}</span>`;
      chip.title = `${d.name_en} (${d.name_kn})`;
      chip.addEventListener('click', () => {
        el.weatherDistrictDropdown.value = d.id;
        onWeatherDistrictSelected(d.id);
      });
      el.weatherQuickChips.appendChild(chip);
    });
  }
}

function onWeatherDistrictSelected(districtId) {
  state.selectedWeatherDistrict = districtId;
  const targetId = districtId.toLowerCase();
  
  document.querySelectorAll('.weather-chip-btn').forEach(c => {
    c.classList.remove('active');
  });
  const activeChip = document.getElementById(`wchip-${targetId}`);
  if (activeChip) activeChip.classList.add('active');

  if (el.weatherDistrictDropdown && el.weatherDistrictDropdown.value !== districtId) {
    el.weatherDistrictDropdown.value = districtId;
  }

  fetchWeatherData(districtId);
}

// Browser Geolocation: "Use My Location" Handler
async function useMyLocation(target = 'weather') {
  const isKn = state.lang === 'kn';
  const noticeBanner = target === 'recommend' ? el.recGeoNoticeBanner : el.geoNoticeBanner;
  if (noticeBanner) noticeBanner.style.display = 'none';

  if (!navigator.geolocation) {
    if (noticeBanner) {
      noticeBanner.style.display = 'flex';
      const desc = noticeBanner.querySelector('.geo-notice-desc');
      if (desc) {
        desc.textContent = isKn
          ? "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳದ ಸೌಲಭ್ಯ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಪಟ್ಟಿಯಿಂದ ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆರಿಸಿ."
          : "Geolocation is not supported by your browser. Please select your district instead.";
      }
    }
    return;
  }

  const btn = target === 'recommend' ? el.btnRecUseLocation : el.btnUseMyLocation;
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-sm">📍</span> ${isKn ? 'ಸ್ಥಳ ಪತ್ತೆಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Detecting location...'}`;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      await fetchWeatherByCoordinates(lat, lon, target);
    },
    (error) => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
      console.warn('Geolocation permission denied or error:', error ? error.message : '');
      if (noticeBanner) {
        noticeBanner.style.display = 'flex';
        const desc = noticeBanner.querySelector('.geo-notice-desc');
        if (desc) {
          desc.textContent = isKn
            ? "ಸ್ಥಳದ ಅನುಮತಿಯನ್ನು ಅನುಮತಿಸಲಾಗಿಲ್ಲ. ಬದಲಿಗೆ ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ."
            : "Location permission was not allowed. Please select your district instead.";
        }
      }
      // Gently focus the district selector without re-prompting
      if (target === 'weather' && el.weatherDistrictDropdown) {
        el.weatherDistrictDropdown.focus();
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}
window.useMyLocation = useMyLocation;

// Fetch Weather Data by Coordinates (from Geolocation)
async function fetchWeatherByCoordinates(lat, lon, target = 'weather') {
  try {
    if (el.weatherErrorBanner) el.weatherErrorBanner.style.display = 'none';
    const res = await fetch(`${API_BASE}/api/weather/current?latitude=${lat}&longitude=${lon}`);
    if (!res.ok) throw new Error(`Weather API returned status ${res.status}`);
    const data = await res.json();
    state.currentWeather = data;

    // Sync active district chip if matched
    const nearestId = data.location?.nearest_district_id || data.district_id;
    if (nearestId) {
      state.selectedWeatherDistrict = nearestId;
      document.querySelectorAll('.weather-chip-btn').forEach(c => c.classList.remove('active'));
      const activeChip = document.getElementById(`wchip-${nearestId.toLowerCase()}`);
      if (activeChip) activeChip.classList.add('active');
      if (el.weatherDistrictDropdown) el.weatherDistrictDropdown.value = nearestId;
    }

    renderWeatherReport(data);
    renderHomeWeatherCard(data);
    updateStep3WeatherFromData(data);
  } catch (err) {
    console.error('Weather coords fetch error:', err);
    renderWeatherError(err);
  }
}

// Fetch Weather Data from Backend Open-Meteo Proxy
async function fetchWeatherData(districtName) {
  try {
    if (el.weatherErrorBanner) el.weatherErrorBanner.style.display = 'none';
    const res = await fetch(`${API_BASE}/api/weather/current?district=${encodeURIComponent(districtName)}`);
    if (!res.ok) throw new Error(`Weather API returned status ${res.status}`);
    const data = await res.json();
    state.currentWeather = data;
    renderWeatherReport(data);
    renderHomeWeatherCard(data);
    updateStep3WeatherFromData(data);
  } catch (err) {
    console.error('Weather error:', err);
    renderWeatherError(err);
  }
}

function retryWeatherFetch() {
  fetchWeatherData(state.selectedWeatherDistrict || 'Mandya');
}
window.retryWeatherFetch = retryWeatherFetch;

// Helper: Extract Non-Undefined Location Names
function extractLocationNames(data) {
  const loc = data?.location;
  let nameEn = (loc && loc.name)
    || (loc && loc.district)
    || (data?.district && typeof data.district === 'object' ? data.district.name_en : null)
    || data?.name_en
    || data?.district_name
    || (typeof data?.district === 'string' ? data.district : null)
    || (state.weatherDistricts.find(d => d.id.toLowerCase() === (state.selectedWeatherDistrict || '').toLowerCase())?.name_en)
    || state.selectedWeatherDistrict
    || 'Selected Location';

  let nameKn = (loc && loc.name_kn)
    || (loc && loc.district_kn)
    || (data?.district && typeof data.district === 'object' ? data.district.name_kn : null)
    || data?.name_kn
    || data?.district_kn
    || (state.weatherDistricts.find(d => d.id.toLowerCase() === (state.selectedWeatherDistrict || '').toLowerCase())?.name_kn)
    || (KARNATAKA_DISTRICTS.find(d => d.id.toLowerCase() === (state.selectedWeatherDistrict || '').toLowerCase())?.name_kn)
    || nameEn;

  // Strict string guard: never return literal string "undefined" or "null"
  if (!nameEn || nameEn === 'undefined' || nameEn === 'null') nameEn = 'Selected Location';
  if (!nameKn || nameKn === 'undefined' || nameKn === 'null') nameKn = nameEn;

  return { nameEn, nameKn };
}

function renderHomeWeatherCard(data) {
  if (!el.homeWeatherDistrict || !data) return;
  const isKn = state.lang === 'kn';

  const { nameEn, nameKn } = extractLocationNames(data);

  el.homeWeatherDistrict.textContent = `${nameKn}`;
  if (el.homeWeatherDistrictEn) el.homeWeatherDistrictEn.textContent = `${nameEn}`;
  if (el.homeWeatherIcon) el.homeWeatherIcon.textContent = data.current?.icon || '⛅';
  
  const temp = data.current?.temperature ?? data.current?.temp ?? 27.0;
  if (el.homeWeatherTemp) el.homeWeatherTemp.textContent = `${Number(temp).toFixed(0)}°C`;
  
  const condKn = data.current?.condition_text_kn || data.current?.condition_kn || data.current?.description_kn || 'ಭಾಗಶಃ ಮೋಡ';
  const condEn = data.current?.condition_text_en || data.current?.condition_en || data.current?.description || 'Partly Cloudy';
  const rainToday = data.current?.rainfall ?? data.current?.rainfall_today ?? data.current?.rainfall_today_mm ?? 0.0;
  const humidity = data.current?.humidity ?? 65;
  const wind = data.current?.wind_speed ?? data.current?.wind_speed_kmh ?? 12.0;

  if (el.homeWeatherRain) el.homeWeatherRain.textContent = `${Number(rainToday).toFixed(1)} mm`;
  if (el.homeWeatherHum) el.homeWeatherHum.textContent = `${Number(humidity).toFixed(0)} %`;
  if (el.homeWeatherWind) el.homeWeatherWind.textContent = `${Number(wind).toFixed(1)} km/h`;
  if (el.homeWeatherCond) {
    const rainNote = Number(rainToday) > 0.5 
      ? (isKn ? `🌧️ ${Number(rainToday).toFixed(1)}mm ಮಳೆ` : `🌧️ ${Number(rainToday).toFixed(1)}mm Rain`)
      : (isKn ? '🌧️ ಇಂದು ಮಳೆ ಇಲ್ಲ' : '🌧️ No Rain Today');
    el.homeWeatherCond.textContent = isKn ? `${condKn} • ${rainNote}` : `${condEn} • ${rainNote}`;
  }

  // Populate Field Action ("What should I do today?")
  if (el.homeFieldActionText) {
    let actionTxt = '';
    if (data.agricultural_advice && (data.agricultural_advice.headline_kn || data.agricultural_advice.headline_en)) {
      actionTxt = isKn ? data.agricultural_advice.headline_kn : data.agricultural_advice.headline_en;
    } else if (Number(rainToday) > 5) {
      actionTxt = isKn ? 'ಇಂದು ಮಳೆಯ ಸಾಧ್ಯತೆ — ಸಿಂಪರಣೆ ಹಾಗೂ ಗೊಬ್ಬರ ಹಾಕುವುದನ್ನು ಮುಂದೂಡಿ.' : 'Rain expected — Avoid spraying and fertilizer application.';
    } else {
      actionTxt = isKn ? 'ಕಳೆ ತೆಗೆಯಲು ಅಥವಾ ಮಣ್ಣು ಸಡಿಲಗೊಳಿಸಲು ಉತ್ತಮ ಸಮಯ.' : 'Good time for weeding and soil maintenance.';
    }
    el.homeFieldActionText.textContent = actionTxt;
  }

  // Populate Active Crop ("ನಿಮ್ಮ ಬೆಳೆ")
  updateHomeCropCard();
}

// Update Active Crop Card on Home
function updateHomeCropCard() {
  const isKn = state.lang === 'kn';
  if (state.lastRecommendation && state.lastRecommendation.primary_crop) {
    const c = state.lastRecommendation.primary_crop;
    if (el.homeCropName) el.homeCropName.textContent = isKn ? `${c.name_kn} (${c.name_en})` : c.name_en;
    if (el.homeCropStage) el.homeCropStage.textContent = isKn ? '🌿 ಬೆಳವಣಿಗೆ ಹಂತ' : '🌿 Growth Stage';
    if (el.homeCropActionText) el.homeCropActionText.textContent = isKn ? 'ಕಳೆ ತೆಗೆಯಿರಿ ಮತ್ತು ಹೊಲವನ್ನು ಸ್ವಚ್ಛವಾಗಿಡಿ.' : 'Remove weeds and keep the field clean.';
  } else {
    if (el.homeCropName) el.homeCropName.textContent = isKn ? 'ರಾಗಿ (Ragi)' : 'Ragi (Finger Millet)';
    if (el.homeCropStage) el.homeCropStage.textContent = isKn ? '🌿 ಬೆಳವಣಿಗೆ ಹಂತ' : '🌿 Growth Stage';
    if (el.homeCropActionText) el.homeCropActionText.textContent = isKn ? 'ಕಳೆ ತೆಗೆಯಿರಿ ಮತ್ತು ತೇವಾಂಶ ಕಾಪಾಡಿ.' : 'Remove weeds and maintain field moisture.';
  }
}

function getMoonPhaseInfo(date = new Date()) {
  const lp = 2551443;
  const now = date.getTime();
  const newMoon = new Date(1970, 0, 7, 20, 35, 0).getTime();
  const phase = ((now - newMoon) / 1000) % lp;
  const daysIntoCycle = phase / (24 * 3600);
  const illumination = Math.min(100, Math.max(0, Math.round((0.5 - 0.5 * Math.cos(2 * Math.PI * daysIntoCycle / 29.53)) * 100)));

  let nameEn = 'Waning Crescent';
  let nameKn = 'ಕುಸಿದ ಚಂದ್ರ';
  if (daysIntoCycle < 1.84) { nameEn = 'New Moon'; nameKn = 'ಅಮಾವಾಸ್ಯೆ'; }
  else if (daysIntoCycle < 7.38) { nameEn = 'Waxing Crescent'; nameKn = 'ಬೆಳೆಯುವ ಚಂದ್ರ'; }
  else if (daysIntoCycle < 9.22) { nameEn = 'First Quarter'; nameKn = 'ಮೊದಲ ತ್ರೈಮಾಸಿಕ'; }
  else if (daysIntoCycle < 14.76) { nameEn = 'Waxing Gibbous'; nameKn = 'ಉಬ್ಬಿದ ಚಂದ್ರ'; }
  else if (daysIntoCycle < 16.61) { nameEn = 'Full Moon'; nameKn = 'ಹುಣ್ಣಿಮೆ'; }
  else if (daysIntoCycle < 22.15) { nameEn = 'Waning Gibbous'; nameKn = 'ಇಳಿಯುವ ಉಬ್ಬಿದ ಚಂದ್ರ'; }
  else if (daysIntoCycle < 23.99) { nameEn = 'Third Quarter'; nameKn = 'ಕೊನೆಯ ತ್ರೈಮಾಸಿಕ'; }
  else { nameEn = 'Waning Crescent'; nameKn = 'ಕುಸಿದ ಚಂದ್ರ'; }

  return { nameEn, nameKn, illumination: illumination || 12 };
}

function renderWeatherReport(data) {
  if (!data) return;
  const isKn = state.lang === 'kn';

  // 1. Header & Location
  const { nameEn, nameKn } = extractLocationNames(data);
  const zone = (data?.district && typeof data.district === 'object' ? data.district.zone : null)
    || (data?.location && data.location.zone ? data.location.zone : null)
    || data?.zone
    || (state.weatherDistricts.find(d => d.id.toLowerCase() === (state.selectedWeatherDistrict || '').toLowerCase())?.zone)
    || 'Southern Dry Zone';

  if (el.weatherCurrDistrict) {
    el.weatherCurrDistrict.textContent = `${nameEn}, Karnataka`;
  }
  if (el.weatherCurrZone) el.weatherCurrZone.textContent = zone;

  // 2. Temperature & Main Weather
  const current = data.current || {};
  const temp = current.temperature ?? current.temp ?? 27.0;
  if (el.weatherCurrTemp) {
    el.weatherCurrTemp.innerHTML = `${Number(temp).toFixed(0)}<span class="deg-symbol" style="font-size: 26px;">°C</span>`;
  }

  // Feels like
  const feelsLike = current.feels_like ?? (Number(temp) + 1.2);
  if (el.weatherCurrFeels) {
    el.weatherCurrFeels.textContent = isKn
      ? `ಹಾಗೆ ಅನಿಸುತ್ತದೆ: ${Number(feelsLike).toFixed(1)}°C`
      : `Feels like ${Number(feelsLike).toFixed(1)}°C`;
  }

  const condKn = current.condition_text_kn || current.condition_kn || current.description_kn || 'ಭಾಗಶಃ ಮೋಡ';
  const condEn = current.condition_text_en || current.condition_en || current.description || 'Partly Cloudy';
  if (el.weatherCurrCond) {
    el.weatherCurrCond.textContent = `${condEn} / ${condKn}`;
  }
  if (el.weatherMainIcon) {
    el.weatherMainIcon.textContent = current.icon || '⛅';
  }

  // 3. Extract 7-Day Forecast Days
  const forecastDays = Array.isArray(data.daily) ? data.daily
    : Array.isArray(data.daily_forecast) ? data.daily_forecast
    : Array.isArray(data.forecast) ? data.forecast
    : (data.daily?.days || []);

  const todayForecast = (forecastDays && forecastDays.length > 0) ? forecastDays[0] : {};
  const rainProb = todayForecast.rain_probability ?? todayForecast.precipitation_probability ?? (current.rainfall > 0 ? 80 : 20);
  const rainToday = current.rainfall ?? current.rainfall_today ?? current.rainfall_today_mm ?? 0.0;
  const humidity = current.humidity ?? 84;
  const wind = current.wind_speed ?? current.wind_speed_kmh ?? 12.0;
  const windDir = current.wind_direction_compass || current.wind_direction || 'ENE';

  // 4. 4 Metrics in Hero Bar
  if (el.weatherCurrHumidity) el.weatherCurrHumidity.textContent = `${Number(humidity).toFixed(0)}%`;
  const rainChanceEl = document.getElementById('weather-curr-rain-chance');
  if (rainChanceEl) rainChanceEl.textContent = `${Math.round(rainProb)}%`;
  if (el.weatherCurrWind) el.weatherCurrWind.textContent = `${Number(wind).toFixed(0)} km/h`;
  const windDirEl = document.getElementById('weather-curr-wind-dir');
  if (windDirEl) windDirEl.textContent = windDir;

  // 5. Field Advisory inside Hero
  const advice = data.agricultural_advice || data.advice || {};
  const advTitleEl = document.getElementById('weather-work-action-title');
  const advSubEl = document.getElementById('weather-work-action-sub');
  const advKnTitleEl = document.getElementById('weather-work-action-kn-title');
  const advKnSubEl = document.getElementById('weather-work-action-kn-sub');
  const advIconEl = document.getElementById('advice-icon');

  const isRainLikely = rainProb >= 40 || Number(rainToday) > 2;
  const defAdvEn = isRainLikely ? 'Rain is expected soon.' : 'Good time for field operations.';
  const defSubEn = isRainLikely ? 'Avoid spraying pesticides before rain.' : 'Suitable for intercultural operations and weeding.';
  const defAdvKn = isRainLikely ? 'ಶೀಘ್ರದಲ್ಲೇ ಮಳೆ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ.' : 'ಹೊಲದ ಚಟುವಟಿಕೆಗಳಿಗೆ ಸೂಕ್ತ ಸಮಯ.';
  const defSubKn = isRainLikely ? 'ಮಳೆ ಬರಲು ಮುನ್ನ ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯಿಂದ ದೂರವಿರಿ.' : 'ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಗಮನಿಸಿ ಮತ್ತು ಕಳೆ ಕೀಳಲು ಸೂಕ್ತ.';

  if (advIconEl) advIconEl.textContent = advice.icon || (isRainLikely ? '🌧️' : '⛅');
  if (advTitleEl) advTitleEl.textContent = advice.headline_en || defAdvEn;
  if (advSubEl) advSubEl.textContent = advice.instruction_en || advice.caution_en || defSubEn;
  if (advKnTitleEl) advKnTitleEl.textContent = advice.headline_kn || defAdvKn;
  if (advKnSubEl) advKnSubEl.textContent = advice.instruction_kn || advice.caution_kn || defSubKn;

  // Backward compatibility for hidden action text
  if (el.weatherWorkActionText) {
    el.weatherWorkActionText.textContent = isKn ? (advice.headline_kn || defAdvKn) : (advice.headline_en || defAdvEn);
  }

  // 6. Secondary Agricultural Advisory Cards (Live Weather Data)
  const soilMoistureEl = document.getElementById('soil-moisture-status');
  const evapoRateEl = document.getElementById('evapo-rate');
  const recommendedIrrigationEl = document.getElementById('recommended-irrigation');
  const sprayWindowEl = document.getElementById('spray-window-status');
  const tillageWindowEl = document.getElementById('tillage-window-status');
  const harvestWindowEl = document.getElementById('harvest-window-status');

  const humVal = Number(current.relative_humidity ?? current.humidity ?? 65);
  const rainVal = Number(current.precipitation ?? current.rainfall ?? 0);
  const tempVal = Number(current.temperature ?? current.temp ?? 27);

  // Dynamic Soil Moisture estimation from live humidity & precipitation
  let moistureText = 'Adequate (60-70%)';
  let moistureColor = '#2e7d32';
  if (rainVal > 2.0 || humVal > 80) {
    moistureText = isKn ? 'ಹೆಚ್ಚಿನ ತೇವಾಂಶ (75-85%)' : 'High Moisture (75-85%)';
    moistureColor = '#1565c0';
  } else if (humVal < 45 && rainVal === 0) {
    moistureText = isKn ? 'ಕಡಿಮೆ ತೇವಾಂಶ (<50%)' : 'Low Moisture (<50%)';
    moistureColor = '#d97706';
  } else {
    moistureText = isKn ? 'ಸಾಧಾರಣ / ಸೂಕ್ತ (60-70%)' : 'Adequate (60-70%)';
    moistureColor = '#2e7d32';
  }
  if (soilMoistureEl) {
    soilMoistureEl.textContent = moistureText;
    soilMoistureEl.style.color = moistureColor;
  }

  // Dynamic Evapotranspiration (ET0) estimation based on temperature
  const et0Val = (Math.max(2.4, tempVal * 0.135)).toFixed(1);
  if (evapoRateEl) evapoRateEl.textContent = `${et0Val} mm/day`;

  // Recommended Irrigation
  let irrigAdvice = 'Light Irrigation in 2 days';
  if (rainVal > 2.0 || rainProb > 45) {
    irrigAdvice = isKn ? 'ಮಳೆ ಸಾಧ್ಯತೆ — ನೀರಾವರಿ ಬೇಡ' : 'No irrigation needed (Rain expected)';
  } else if (humVal < 45) {
    irrigAdvice = isKn ? '1-2 ದಿನಗಳಲ್ಲಿ ನೀರಾವರಿ ಅಗತ್ಯ' : 'Irrigation required in 1-2 days';
  } else {
    irrigAdvice = isKn ? '2-3 ದಿನಗಳಲ್ಲಿ ಲಘು ನೀರಾವರಿ' : 'Light Irrigation in 2-3 days';
  }
  if (recommendedIrrigationEl) recommendedIrrigationEl.textContent = irrigAdvice;

  // Field Operations Windows
  if (sprayWindowEl) {
    if (rainProb > 40 || rainVal > 1.0) {
      sprayWindowEl.textContent = isKn ? '⚠️ ಮಳೆ ಸಂಭವ — ಸಿಂಪರಣೆ ಬೇಡ' : '⚠️ Unfavorable (Rain expected)';
      sprayWindowEl.style.color = '#c62828';
    } else {
      sprayWindowEl.textContent = isKn ? '✓ ಅನುಕೂಲಕರ (ಬೆಳಿಗ್ಗೆ 7-10 AM)' : '✓ Favorable (Morning 7-10 AM)';
      sprayWindowEl.style.color = '#2e7d32';
    }
  }

  if (tillageWindowEl) {
    if (rainVal > 5.0) {
      tillageWindowEl.textContent = isKn ? '⚠️ ಮಣ್ಣು ಅತಿಯಾಗಿ ತೇವವಾಗಿದೆ' : '⚠️ Saturated soil (Delay tillage)';
      tillageWindowEl.style.color = '#d97706';
    } else {
      tillageWindowEl.textContent = isKn ? '✓ ಹೊಲ ಸಿದ್ಧತೆಗೆ ಸೂಕ್ತ' : '✓ Suitable for field prep';
      tillageWindowEl.style.color = '#2e7d32';
    }
  }

  if (harvestWindowEl) {
    if (rainProb > 30 || rainVal > 0.5) {
      harvestWindowEl.textContent = isKn ? '⚠️ ಮೋಡ / ಮಳೆ ಗಮನಿಸಿ' : '⚠️ Monitor cloud cover';
      harvestWindowEl.style.color = '#d97706';
    } else {
      harvestWindowEl.textContent = isKn ? '✓ ಕೊಯ್ಲು & ಒಣಗಿಸಲು ಸೂಕ್ತ' : '✓ Suitable for harvesting & drying';
      harvestWindowEl.style.color = '#2e7d32';
    }
  }

  // 7. Farming Tip for Today Banner
  const tipEnEl = document.getElementById('farming-tip-en');
  const tipKnEl = document.getElementById('farming-tip-kn');
  if (advice.tips && advice.tips.length > 0) {
    const tip = advice.tips[0];
    if (tipEnEl && (tip.en || tip.text_en)) tipEnEl.textContent = tip.en || tip.text_en;
    if (tipKnEl && (tip.kn || tip.text_kn)) tipKnEl.textContent = tip.kn || tip.text_kn;
  }

  // 8. Render Interactive Charts
  renderTemperatureChart(data, forecastDays);
  renderRainfallChart(data, forecastDays);

  // 9. Render 7-Day Forecast Cards
  renderForecastCards(forecastDays);
}

// Update Step 3 (Weather & Region) from Weather Data
function updateStep3WeatherFromData(data) {
  if (!data) return;
  const isKn = state.lang === 'kn';
  const { nameEn, nameKn } = extractLocationNames(data);

  if (el.recLiveLocation) {
    el.recLiveLocation.textContent = `📍 ${isKn ? nameKn : nameEn}, Karnataka`;
  }

  const currTemp = data.current?.temperature ?? data.current?.temp ?? 27.0;
  const currHum = data.current?.humidity ?? 65;
  const seasonalNormal = data.seasonal_rainfall_normal_mm ?? data.seasonal_rainfall_normal ?? (data.location?.seasonal_rainfall_normal || 760);

  if (el.recLiveTemp) el.recLiveTemp.textContent = `${Number(currTemp).toFixed(1)}°C`;
  if (el.recLiveRain) el.recLiveRain.textContent = `${Number(seasonalNormal).toFixed(0)} mm`;
  if (el.recLiveHum) el.recLiveHum.textContent = `${Number(currHum).toFixed(0)}%`;

  // Auto-sync into form state
  state.form.temperature = Number(Number(currTemp).toFixed(1));
  state.form.humidity = Number(Number(currHum).toFixed(0));
  state.form.rainfall = Number(Number(seasonalNormal).toFixed(0));

  const matchedDistrictId = data.location?.nearest_district_id || data.district_id || (typeof data.district === 'string' ? data.district.toLowerCase() : null);
  if (matchedDistrictId) {
    state.form.district = matchedDistrictId;
  }

  document.querySelectorAll('.district-chip').forEach(c => {
    if (c.id === `district-chip-${state.form.district}`) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });

  syncSliders();
}

// 7-Day Temperature Line Chart
function renderTemperatureChart(data, forecastDays) {
  const canvas = document.getElementById('weather-temp-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const isKn = state.lang === 'kn';
  const weekdayEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayKn = ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'];

  const labels = (forecastDays || []).slice(0, 7).map((d, i) => {
    if (d.date && typeof d.date === 'string' && d.date.includes('-')) {
      const parts = d.date.split('-');
      if (parts.length === 3) {
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(dt.getTime())) {
          const dayIdx = dt.getDay();
          const dayStr = isKn ? weekdayKn[dayIdx] : weekdayEn[dayIdx];
          if (i === 0) return isKn ? `ಇಂದು (${dayStr})` : `Today (${dayStr})`;
          if (i === 1) return isKn ? `ನಾಳೆ (${dayStr})` : `Tomorrow (${dayStr})`;
          return dayStr;
        }
      }
    }
    const defaultEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const defaultKn = ['ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ', 'ಭಾನು'];
    return isKn ? defaultKn[i % 7] : defaultEn[i % 7];
  });

  let maxTemps = [];
  let minTemps = [];

  if (forecastDays && forecastDays.length > 0) {
    maxTemps = forecastDays.slice(0, 7).map(d => Number(Number(d.temperature_max ?? d.temp_max ?? 28).toFixed(1)));
    minTemps = forecastDays.slice(0, 7).map(d => Number(Number(d.temperature_min ?? d.temp_min ?? 20).toFixed(1)));
  } else if (data.daily_chart_data && Array.isArray(data.daily_chart_data.temperature_2m_max)) {
    maxTemps = data.daily_chart_data.temperature_2m_max.slice(0, 7).map(v => Number(Number(v).toFixed(1)));
    minTemps = (data.daily_chart_data.temperature_2m_min || []).slice(0, 7).map(v => Number(Number(v).toFixed(1)));
  } else {
    maxTemps = [29, 30, 28, 27, 28, 29, 30];
    minTemps = [21, 21, 20, 19, 20, 21, 21];
  }

  if (tempChartInstance) {
    tempChartInstance.destroy();
    tempChartInstance = null;
  }

  const ctx = canvas.getContext('2d');
  tempChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: isKn ? 'ಗರಿಷ್ಠ ತಾಪಮಾನ (°C)' : 'Max Temperature (°C)',
          data: maxTemps,
          borderColor: '#c66a3d',
          backgroundColor: 'rgba(198, 106, 61, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#c66a3d',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        },
        {
          label: isKn ? 'ಕನಿಷ್ಠ ತಾಪಮಾನ (°C)' : 'Min Temperature (°C)',
          data: minTemps,
          borderColor: '#2f8f57',
          backgroundColor: 'rgba(47, 143, 87, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#2f8f57',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: 'inherit', size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 46, 33, 0.92)',
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} °C`;
            }
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: isKn ? 'ತಾಪಮಾನ (°C)' : 'Temperature (°C)',
            font: { weight: 'bold' }
          },
          ticks: {
            callback: function(val) { return `${val}°C`; }
          },
          grid: { color: '#f0f4f0' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

// 7-Day Rainfall Bar & Probability Chart
function renderRainfallChart(data, forecastDays) {
  const canvas = document.getElementById('weather-rain-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const isKn = state.lang === 'kn';
  const dayNamesEn = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const dayNamesKn = ['ಇಂದು', 'ನಾಳೆ', 'ದಿನ 3', 'ದಿನ 4', 'ದಿನ 5', 'ದಿನ 6', 'ದಿನ 7'];
  const labels = isKn ? dayNamesKn : dayNamesEn;

  let rainSums = [];
  let rainProbs = [];

  if (data.daily && Array.isArray(data.daily.precipitation_sum) && data.daily.precipitation_sum.length > 0) {
    rainSums = data.daily.precipitation_sum.slice(0, 7).map(v => Number(Number(v).toFixed(1)));
    rainProbs = (data.daily.precipitation_probability_max || []).slice(0, 7).map(v => Math.round(Number(v)));
  } else if (forecastDays && forecastDays.length > 0) {
    rainSums = forecastDays.slice(0, 7).map(d => Number(Number(d.precipitation_sum ?? d.rainfall_mm ?? 0).toFixed(1)));
    rainProbs = forecastDays.slice(0, 7).map(d => Math.round(Number(d.rain_probability ?? d.precipitation_probability ?? 0)));
  } else {
    rainSums = [0, 0, 2.5, 8.0, 1.2, 0, 0];
    rainProbs = [10, 15, 45, 80, 40, 10, 5];
  }

  if (rainChartInstance) {
    rainChartInstance.destroy();
    rainChartInstance = null;
  }

  const ctx = canvas.getContext('2d');
  rainChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: isKn ? 'ಮಳೆ (mm)' : 'Rainfall (mm)',
          data: rainSums,
          backgroundColor: 'rgba(42, 157, 244, 0.75)',
          borderColor: '#1976d2',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'yRain'
        },
        {
          type: 'line',
          label: isKn ? 'ಮಳೆ ಸಾಧ್ಯತೆ (%)' : 'Rain Chance (%)',
          data: rainProbs,
          borderColor: '#f39c12',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderWidth: 2.5,
          pointBackgroundColor: '#f39c12',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          tension: 0.3,
          yAxisID: 'yProb'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 14,
            font: { family: 'inherit', size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 46, 33, 0.92)',
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
            label: function(context) {
              if (context.dataset.yAxisID === 'yRain') {
                return `${context.dataset.label}: ${context.parsed.y} mm`;
              } else {
                return `${context.dataset.label}: ${context.parsed.y} %`;
              }
            }
          }
        }
      },
      scales: {
        yRain: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          suggestedMax: 15,
          title: {
            display: true,
            text: isKn ? 'ಮಳೆ (mm)' : 'Rainfall (mm)',
            font: { weight: 'bold' }
          },
          ticks: {
            callback: function(val) { return `${val}mm`; }
          },
          grid: { color: '#f0f4f0' }
        },
        yProb: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: isKn ? 'ಸಾಧ್ಯತೆ (%)' : 'Rain Chance (%)',
            font: { weight: 'bold' }
          },
          ticks: {
            callback: function(val) { return `${val}%`; }
          },
          grid: { display: false }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderForecastCards(forecastDays) {
  const container = document.getElementById('forecast-cards-container');
  if (!container) return;
  const isKn = state.lang === 'kn';
  container.innerHTML = '';

  const weekdayShortEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayShortKn = ['ಭಾನು', 'ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsKn = ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟೆಂ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ'];

  (forecastDays || []).slice(0, 7).forEach((day, idx) => {
    const card = document.createElement('div');
    card.className = `forecast-day-card ${idx === 0 ? 'today' : ''}`;

    let dayTitle = idx === 0 ? (isKn ? 'ಇಂದು' : 'Today')
      : (idx === 1 ? (isKn ? 'ನಾಳೆ' : 'Tomorrow') : (isKn ? `ದಿನ ${idx + 1}` : `Day ${idx + 1}`));
    let formattedDate = '';

    if (day.date && typeof day.date === 'string' && day.date.includes('-')) {
      const parts = day.date.split('-');
      if (parts.length === 3) {
        const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(dt.getTime())) {
          const dayIdx = dt.getDay();
          const monthIdx = dt.getMonth();
          if (idx > 1) {
            dayTitle = isKn ? weekdayShortKn[dayIdx] : weekdayShortEn[dayIdx];
          }
          const mStr = isKn ? monthsKn[monthIdx] : monthsEn[monthIdx];
          formattedDate = `${dt.getDate()} ${mStr}`;
        }
      }
    }

    const maxT = Math.round(day.temperature_max ?? day.temp_max ?? 28);
    const minT = Math.round(day.temperature_min ?? day.temp_min ?? 20);
    const rainProb = Math.round(day.rain_probability ?? day.precipitation_probability ?? 0);
    const rainMm = day.precipitation_sum ?? day.rainfall_mm ?? 0;
    const condKn = day.condition_kn || day.condition_text_kn || (rainProb > 50 ? 'ಮಳೆ' : (rainProb > 20 ? 'ಸಣ್ಣ ಮಳೆ' : 'ಭಾಗಶಃ ಮೋಡ'));
    const condEn = day.condition_en || day.condition_text_en || (rainProb > 50 ? 'Rain' : (rainProb > 20 ? 'Light Rain' : 'Partly Cloudy'));
    const condText = isKn ? condKn : condEn;

    card.innerHTML = `
      <div class="forecast-day-name">${dayTitle}</div>
      <div class="forecast-day-date">${formattedDate}</div>
      <div class="forecast-icon">${day.icon || (rainProb > 50 ? '🌧️' : '⛅')}</div>
      <div class="forecast-temps">
        <span class="forecast-temp-max">${maxT}°</span>
        <span class="forecast-temp-sep">/</span>
        <span class="forecast-temp-min">${minT}°</span>
      </div>
      <div class="forecast-cond-text" title="${condText}">${condText}</div>
      <div class="forecast-rain-prob">💧 ${rainProb}%</div>
      <div class="forecast-rain-mm">${Number(rainMm).toFixed(1)} mm</div>
    `;
    container.appendChild(card);
  });
}

// Window interactive helpers for Weather UI
window.toggleDetailedForecast = function() {
  const drawer = document.getElementById('weather-charts-drawer');
  if (!drawer) return;
  const isHidden = drawer.style.display === 'none' || drawer.style.display === '';
  drawer.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  }
};

window.openSatelliteModal = function() {
  const modal = document.getElementById('satellite-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeSatelliteModal = function(e) {
  const modal = document.getElementById('satellite-modal');
  if (modal) modal.style.display = 'none';
};

function renderWeatherError(err) {
  const isKn = state.lang === 'kn';
  if (el.weatherErrorBanner) {
    el.weatherErrorBanner.style.display = 'flex';
    if (el.weatherErrorTitle) {
      el.weatherErrorTitle.textContent = isKn
        ? 'ಹವಾಮಾನ ಮಾಹಿತಿ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ'
        : 'Unable to retrieve weather information';
    }
    if (el.weatherErrorDesc) {
      el.weatherErrorDesc.textContent = isKn
        ? 'ಆಯ್ಕೆಮಾಡಿದ ಜಿಲ್ಲೆಯ ಲೈವ್ ಹವಾಮಾನ ಸರ್ವರ್ ತಾತ್ಕಾಲಿಕವಾಗಿ ಸಂಪರ್ಕಕ್ಕೆ ಸಿಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.'
        : 'Weather server connection for the selected district is temporarily unavailable. Please retry.';
    }
  }

  const errMsg = isKn ? 'ಹವಾಮಾನ ಮಾಹಿತಿ ತಾತ್ಕಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.' : 'Weather information is temporarily unavailable.';
  if (el.homeWeatherCond) el.homeWeatherCond.textContent = errMsg;
  if (el.weatherCurrCond) el.weatherCurrCond.textContent = errMsg;
}

// ==========================================================================
// CROP RECOMMENDATION & RESULTS
// ==========================================================================

// Fetch Recommendation from API
async function fetchRecommendation() {
  showLoading(true);

  try {
    const payload = {
      soil_type: state.form.soil_type,
      ph: state.form.ph,
      nitrogen: state.form.nitrogen,
      phosphorus: state.form.phosphorus,
      potassium: state.form.potassium,
      temperature: state.form.temperature,
      humidity: state.form.humidity,
      rainfall: state.form.rainfall,
      district: state.form.district
    };

    const res = await fetch(`${API_BASE}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }

    const data = await res.json();
    state.lastRecommendation = data;
    renderRecommendationResult(data);
    setWizardStep(4);
  } catch (err) {
    alert(`ದೋಷ: ${err.message}\nError: ${err.message}`);
    console.error(err);
  } finally {
    showLoading(false);
  }
}

// Render Recommendation Result
function renderRecommendationResult(data) {
  if (!data || !data.primary_crop) return;
  const primary = data.primary_crop;
  const isKn = state.lang === 'kn';

  const cropIcons = {
    ragi: '🌾',
    groundnut: '🥜',
    rice: '🌾',
    maize: '🌽',
    cotton: '☁️',
    sugarcane: '🎋',
    tur: '🌱',
    bengal_gram: '🫘',
    tomato: '🍅',
    arecanut: '🌴',
    coffee: '☕',
    turmeric: '🌿',
    banana: '🍌',
    pomegranate: '🍎',
    soybean: '🫘'
  };

  const cleanIcon = document.getElementById('hero-clean-icon-symbol');
  if (cleanIcon) {
    cleanIcon.textContent = cropIcons[primary.id] || '🌱';
  }

  // Hero Crop Photo (Compact 70x70 thumbnail with genuine farm photography)
  const heroImg = document.getElementById('hero-crop-img');
  if (heroImg) {
    heroImg.src = getCropVisualImage(primary.id);
    heroImg.onerror = function() { this.onerror = null; this.src = 'public/images/crops/default_crop.svg'; };
    heroImg.style.display = 'block';
  }

  const nameKnEl = document.getElementById('hero-name-kn');
  const nameEnEl = document.getElementById('hero-name-en');
  if (nameKnEl) nameKnEl.textContent = primary.name_kn;
  if (nameEnEl) nameEnEl.textContent = primary.name_en;

  // Suitability Score Meter & Badge
  const matchPct = primary.match_percentage || Math.round((primary.confidence_score || 0.95) * 100);
  const scoreBadge = document.getElementById('hero-suitability-score');
  if (scoreBadge) {
    scoreBadge.innerHTML = `
      <span class="score-num">${matchPct}%</span>
      <span class="score-txt"><span class="txt-kn" style="display: ${isKn ? 'inline' : 'none'};">ಹೊಂದಾಣಿಕೆ</span><span class="txt-en" style="display: ${isKn ? 'none' : 'inline'};">Match</span></span>
    `;
  }

  // Suitability Tier Badge
  const tierKn = primary.suitability_tier_kn || 'ಅತ್ಯಂತ ಸೂಕ್ತ';
  const tierEn = primary.suitability_tier || 'Highly Suitable';
  const recStatusBadge = document.getElementById('rec-status-badge');
  if (recStatusBadge) {
    recStatusBadge.textContent = isKn ? `✓ ${tierKn}` : `✓ ${tierEn}`;
  }

  // Soil & Location tags on Hero Card
  const soilObj = state.soilTypes?.find(s => s.id === state.form.soil_type);
  const soilLabel = soilObj 
    ? (isKn ? `${soilObj.name_kn} (${soilObj.name_en})` : soilObj.name_en)
    : state.form.soil_type;
  if (el.recResultSoilTag) el.recResultSoilTag.textContent = soilLabel;

  const distObj = KARNATAKA_DISTRICTS.find(d => d.id === state.form.district) || { id: state.form.district || 'Mandya', name_en: 'Mandya', name_kn: 'ಮಂಡ್ಯ' };
  const distLabel = isKn ? `${distObj.name_kn} (${distObj.name_en})` : distObj.name_en;
  if (el.recResultLocTag) el.recResultLocTag.textContent = distLabel;

  // Recommendation Source Pill
  const isML = primary.source_type === 'ml_model';
  const icon = isML ? '🤖' : '📘';
  const sourcePill = document.getElementById('rec-source-pill');
  if (sourcePill) {
    sourcePill.textContent = `${icon} ${primary.source}`;
  }

  // Why this crop? Checklist
  const whyContainer = document.getElementById('why-list-container');
  if (whyContainer) {
    whyContainer.innerHTML = '';
    primary.explanations.forEach(exp => {
      const li = document.createElement('li');
      li.className = 'why-item';
      li.innerHTML = `
        <span style="color: var(--primary-green); font-size: 16px; font-weight: bold;">✓</span>
        <div>
          <span class="why-text-kn" style="display: ${isKn ? 'inline' : 'none'};">${exp.text_kn}</span>
          <span class="why-text-en" style="display: ${isKn ? 'none' : 'inline'};">${exp.text_en}</span>
        </div>
      `;
      whyContainer.appendChild(li);
    });
  }

  // Why other crops are less suitable
  const unsuitableSection = document.getElementById('unsuitable-section');
  const unsuitableList = document.getElementById('unsuitable-list-container');
  if (unsuitableSection && unsuitableList) {
    if (data.unsuitable_crops && data.unsuitable_crops.length > 0) {
      unsuitableSection.style.display = 'block';
      unsuitableList.innerHTML = '';
      data.unsuitable_crops.forEach(u => {
        const item = document.createElement('div');
        item.className = 'unsuitable-card';
        item.innerHTML = `
          <div style="font-weight: 700; color: #c62828; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span>✗</span> <span>${isKn ? u.name_kn : u.name_en}</span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted); line-height: 1.4;">${isKn ? u.reason_kn : u.reason_en}</p>
        `;
        unsuitableList.appendChild(item);
      });
    } else {
      unsuitableSection.style.display = 'none';
    }
  }

  // 2 Alternative Crops
  const altContainer = document.getElementById('alt-crops-container');
  if (altContainer) {
    altContainer.innerHTML = '';
    if (data.alternative_crops && data.alternative_crops.length > 0) {
      data.alternative_crops.slice(0, 2).forEach(alt => {
        const item = document.createElement('div');
        item.className = 'alt-crop-card';
        const altIcon = cropIcons[alt.id] || '🌱';
        const altTier = isKn ? (alt.suitability_tier_kn || 'ಸೂಕ್ತ') : (alt.suitability_tier || 'Suitable');
        const altMatch = alt.match_percentage || Math.round((alt.confidence_score || 0.85) * 100);
        const altImg = getCropVisualImage(alt.id);
        item.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="rec-thumb-wrap" style="width: 70px; height: 70px; min-width: 70px; min-height: 70px; border-radius: 10px; overflow: hidden; border: 1.5px solid #dcfce7; flex-shrink: 0; background: #f0fdf4;">
              <img src="${altImg}" alt="${isKn ? alt.name_kn : alt.name_en}" class="rec-crop-thumb" width="70" height="70" onerror="this.onerror=null; this.src='public/images/crops/default_crop.svg';">
            </div>
            <div>
              <strong style="font-size: 14px; color: #1a2e23;">${altIcon} ${isKn ? alt.name_kn : alt.name_en}</strong>
              <div style="font-size: 11.5px; color: var(--text-muted);">${isKn ? alt.name_en : alt.name_kn}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: 800; color: var(--primary-green);">${altMatch}%</div>
            <span style="font-size: 11px; font-weight: 700; background: #e8f5ed; color: #1a5c32; padding: 2px 8px; border-radius: 4px;">${altTier}</span>
          </div>
        `;
        altContainer.appendChild(item);
      });
    } else {
      altContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">${isKn ? 'ಯಾವುದೇ ಪರ್ಯಾಯ ಬೆಳೆಗಳಿಲ್ಲ' : 'No alternative crops'}</div>`;
    }
  }

  // Render Today's field action in recommendation
  const today = data.today_advice;
  if (today) {
    if (el.recTodayIcon) el.recTodayIcon.textContent = today.action_icon || '🌦️';
    if (el.recTodayHeadline) {
      el.recTodayHeadline.textContent = isKn ? today.headline_kn : today.headline_en;
    }
    if (el.recTodayCond) {
      el.recTodayCond.textContent = isKn ? today.weather_condition_kn : today.weather_condition_en;
    }
    if (el.recTodayInstruction) {
      el.recTodayInstruction.textContent = isKn ? today.action_kn : today.action_en;
    }
    if (el.recTodayCaution && el.recTodayCautionText) {
      const cautionText = isKn ? today.caution_kn : today.caution_en;
      if (cautionText) {
        el.recTodayCaution.style.display = 'flex';
        el.recTodayCautionText.textContent = cautionText;
      } else {
        el.recTodayCaution.style.display = 'none';
      }
    }
  }

  // Pre-configure Crop Care to follow this crop
  state.selectedCareCrop = primary.id;
  updateHomeCropCard();

  // Technical Details Drawer
  const techView = document.getElementById('tech-json-view');
  if (techView && data.technical_details) {
    techView.textContent = JSON.stringify({
      academic_evaluation: {
        ml_model: data.technical_details.ml_model,
        ml_predicted_class: data.technical_details.ml_predicted_class,
        confidence: data.technical_details.ml_confidence,
        crops_in_ml_model: data.technical_details.crops_in_ml_model,
        crops_in_reference: data.technical_details.crops_in_reference,
        feature_importance: data.technical_details.feature_importance,
        karnataka_expert_scores: data.technical_details.karnataka_expert_scores
      },
      provenance_note: data.technical_details.provenance_note,
      disclaimer: data.disclaimer_en,
      input_vector: data.input_received
    }, null, 2);
  }
}

// Open Disease Scanner with Recommended Crop Selected
window.openDiseaseForCurrent = function() {
  const rec = state.lastRecommendation;
  if (rec && rec.primary_crop) {
    const cropId = rec.primary_crop.id;
    const diseaseMap = {
      'rice': 'rice',
      'paddy': 'rice',
      'maize': 'maize',
      'corn': 'maize',
      'cotton': 'cotton',
      'tomato': 'tomato',
      'arecanut': 'arecanut'
    };
    const target = diseaseMap[cropId] || 'rice';
    if (typeof selectDiseaseCrop === 'function') {
      selectDiseaseCrop(target);
    }
  }
  navTo('disease');
};

// Language Toggle
function toggleLanguage() {
  state.lang = state.lang === 'kn' ? 'en' : 'kn';
  try {
    localStorage.setItem('mannumitra_lang', state.lang);
  } catch (e) {}

  if (window.i18n && typeof window.i18n.setLanguage === 'function') {
    window.i18n.setLanguage(state.lang);
  }

  updateLanguageDisplay();
  if (state.lastRecommendation) {
    renderRecommendationResult(state.lastRecommendation);
    renderMilestone1Top3DecisionCards(state.lastRecommendation);
  }
}

function updateLanguageDisplay() {
  const isKn = state.lang === 'kn';
  if (el.langBtnText) {
    el.langBtnText.textContent = isKn ? 'ಕನ್ನಡ / EN' : 'English / ಕನ್ನಡ';
  }

  // Update declarative data-i18n tags via shared engine and sync legacy spans
  if (window.i18n && typeof window.i18n.applyTranslations === 'function') {
    window.i18n.applyTranslations(document);
  } else {
    document.querySelectorAll('.txt-kn').forEach(e => {
      e.style.display = isKn ? 'inline' : 'none';
    });
    document.querySelectorAll('.txt-en').forEach(e => {
      e.style.display = isKn ? 'none' : 'inline';
    });
  }

  renderSoilCards();
  renderDistricts();
  populateWeatherControls();
  populateCareDistricts();

  if (state.currentWeather) {
    renderWeatherReport(state.currentWeather);
    renderHomeWeatherCard(state.currentWeather);
  }

  if (typeof window.renderCropLifecycleGuide === 'function') {
    window.renderCropLifecycleGuide(state.selectedCareCrop || 'rice');
  } else if (state.lifecycleData) {
    renderLifecycleCompanion(state.lifecycleData);
  } else if (state.currentCareData) {
    renderCropCarePage(state.currentCareData);
  }

  if (state.lastEconomicsResult) {
    renderEconomicsResults(state.lastEconomicsResult);
  }

  if (state.lastDiseaseResult) {
    if (state.lastDiseaseResult.crop_valid === false) {
      renderCropValidationMismatch(state.lastDiseaseResult);
    } else {
      renderDiseaseResult(state.lastDiseaseResult);
    }
  }

  const currDist = KARNATAKA_DISTRICTS.find(d => d.id === state.form.district) || KARNATAKA_DISTRICTS[0];
  const zInfo = DISTRICT_ZONE_INFO[currDist.id] || { zone_kn: 'ಕರ್ನಾಟಕ ಕೃಷಿ ವಲಯ', zone_en: 'Karnataka Agro Zone', desc_kn: 'ಕೃಷಿ ವಲಯ.', desc_en: 'Agro zone.' };
  if (el.recLocZoneBadge) el.recLocZoneBadge.textContent = isKn ? zInfo.zone_kn : zInfo.zone_en;
  if (el.recLocSelectedTitle) {
    el.recLocSelectedTitle.innerHTML = isKn
      ? `<span class="txt-kn">${currDist.name_kn} (${currDist.name_en}), ಕರ್ನಾಟಕ</span>`
      : `<span class="txt-en">${currDist.name_en}, Karnataka</span>`;
  }
  const descEl = document.querySelector('.rec-loc-desc');
  if (descEl) {
    descEl.innerHTML = isKn
      ? `<span class="txt-kn">${zInfo.desc_kn}</span>`
      : `<span class="txt-en">${zInfo.desc_en}</span>`;
  }

  setWizardStep(state.wizardStep);
}

// Loading overlay toggle
function showLoading(show) {
  if (show) el.loadingOverlay.classList.add('active');
  else el.loadingOverlay.classList.remove('active');
}

// =============================================================================
// STAGE 5: CROP LIFECYCLE & CALENDAR ENGINE (PHASE 1 IMPLEMENTATION)
// Pilot Crops: Arecanut (perennial), Ragi, Rice, Tomato, Maize (annual)
// =============================================================================

function populateCareDistricts() {
  if (!el.careDistrictSelect) return;

  const currentSel = (state.selectedCareDistrict || state.form.district || 'Mandya').toLowerCase();
  el.careDistrictSelect.innerHTML = '';

  const list = (state.weatherDistricts && state.weatherDistricts.length > 0)
    ? state.weatherDistricts
    : KARNATAKA_DISTRICTS.map(d => ({ id: d.id, name_en: d.name_en, name_kn: d.name_kn }));

  list.forEach(d => {
    const opt = document.createElement('option');
    const dName = d.name_en || d.id;
    opt.value = dName;
    opt.textContent = `${d.name_kn} (${dName})`;
    if (d.id.toLowerCase() === currentSel || dName.toLowerCase() === currentSel) {
      opt.selected = true;
    }
    el.careDistrictSelect.appendChild(opt);
  });
}

function getTodayISOString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultSowingDate() {
  // Default to 35 days ago for realistic farmer demonstration (e.g. Day 36 - Vegetative growth)
  const d = new Date();
  d.setDate(d.getDate() - 35);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// -----------------------------------------------------------------------------
// Farm Care Streak Engine
// -----------------------------------------------------------------------------

function initStreakData() {
  try {
    const stored = localStorage.getItem('mannumitra_completed_actions');
    if (stored) {
      state.completedActionDates = JSON.parse(stored);
    } else {
      // Default demo: past 7 days ending yesterday were completed!
      const dates = [];
      const now = new Date();
      for (let i = 7; i >= 1; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${dt}`);
      }
      state.completedActionDates = dates;
      localStorage.setItem('mannumitra_completed_actions', JSON.stringify(dates));
    }
  } catch (e) {
    state.completedActionDates = [];
  }
  calculateStreakStats();
}

function calculateStreakStats() {
  const set = new Set(state.completedActionDates || []);
  const sortedDates = Array.from(set).sort();
  const total = sortedDates.length;

  // Calculate longest streak across history
  let longest = 0;
  let tempStreak = 0;
  let prevDate = null;
  for (const dStr of sortedDates) {
    const cur = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((cur - prevDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longest) longest = tempStreak;
    prevDate = cur;
  }

  // Calculate current active streak
  const todayStr = getTodayISOString();
  let current = 0;
  let checkDate = new Date();
  if (set.has(todayStr)) {
    current = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    const yStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (set.has(yStr)) {
      current = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      current = 0;
    }
  }

  if (current > 0) {
    while (true) {
      const iso = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (set.has(iso)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  if (current > longest) longest = current;

  state.careStreak = current;
  state.longestStreak = longest;
  state.totalCompletedActions = total;
  return { current, longest, total };
}

window.markTodayTaskComplete = function() {
  const todayStr = getTodayISOString();
  if (!state.completedActionDates) state.completedActionDates = [];
  if (!state.completedActionDates.includes(todayStr)) {
    state.completedActionDates.push(todayStr);
    localStorage.setItem('mannumitra_completed_actions', JSON.stringify(state.completedActionDates));
  }
  calculateStreakStats();
  updateStreakUI();
  renderCalendarView();
};

function renderWeeklyStreakPills() {
  const container = document.getElementById('streak-week-pills');
  if (!container) return;

  const isKn = state.lang === 'kn';
  const todayStr = getTodayISOString();
  const completedSet = new Set(state.completedActionDates || []);

  const daysKn = ['ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ', 'ಭಾನು'];
  const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const names = isKn ? daysKn : daysEn;

  // Find Monday of the current week (Sunday is 0, Monday is 1)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);

  container.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;

    const isToday = (iso === todayStr);
    const isDone = completedSet.has(iso);
    const isPast = (iso < todayStr);

    const pill = document.createElement('div');
    pill.className = 'streak-pill-item';
    if (isToday) pill.classList.add('is-today');
    if (isDone) pill.classList.add('is-done');
    else pill.classList.add('is-pending');

    let symbol = '○';
    if (isDone) symbol = '✓';
    else if (isToday) symbol = '●';
    else if (isPast) symbol = '—';

    pill.innerHTML = `
      <span class="streak-pill-name">${names[i]}</span>
      <span class="streak-pill-check">${symbol}</span>
    `;
    container.appendChild(pill);
  }
}

function updateStreakUI() {
  const isKn = state.lang === 'kn';
  const todayStr = getTodayISOString();
  const isCompletedToday = (state.completedActionDates || []).includes(todayStr);
  const stats = calculateStreakStats();

  const streakDisplay = document.getElementById('streak-display-text');
  if (streakDisplay) {
    streakDisplay.textContent = isKn 
      ? `${stats.current} ದಿನಗಳ ಸತತತೆ (${stats.current} Days Streak)`
      : `${stats.current} Days Streak`;
  }

  const streakSummary = document.getElementById('streak-stats-summary');
  if (streakSummary) {
    streakSummary.textContent = isKn
      ? `ಪ್ರಸ್ತುತ: ${stats.current} ದಿನ • ಗರಿಷ್ಠ: ${stats.longest} ದಿನ • ಒಟ್ಟು: ${stats.total}`
      : `Current: ${stats.current} • Longest: ${stats.longest} • Total: ${stats.total}`;
  }

  // Render weekly Mon - Sun pills
  renderWeeklyStreakPills();

  const btn = document.getElementById('btn-complete-task');
  const btnLabel = document.getElementById('streak-btn-label');
  const icon = document.getElementById('streak-check-icon');

  if (btn && btnLabel) {
    if (isCompletedToday) {
      btn.classList.add('completed-state');
      btn.disabled = true;
      if (icon) icon.textContent = '✓';
      btnLabel.textContent = isKn ? 'ಇಂದು ಪೂರ್ಣಗೊಂಡಿದೆ (Completed) ✓' : 'Task Completed Today ✓';
    } else {
      btn.classList.remove('completed-state');
      btn.disabled = false;
      if (icon) icon.textContent = '✓';
      btnLabel.textContent = isKn ? 'ಇಂದಿನ ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Mark Task Complete';
    }
  }
}

// -----------------------------------------------------------------------------
// Interactive Controls (Presets, Tabs, Stage Navigation)
// -----------------------------------------------------------------------------

window.selectLifecycleCrop = function(cropId) {
  state.selectedCareCrop = cropId;
  // Always return to the visual overview when switching crops
  if (window.backToLifecycleOverview) {
    window.backToLifecycleOverview();
  }
  const chips = document.querySelectorAll('#care-quick-chips .lc-crop-pill, #care-quick-chips .quick-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-crop') === cropId);
  });
  loadCropLifecycle(cropId, state.selectedCareDistrict, state.lifecycleSowingDate);
};

window.onLifecycleDistrictChanged = function(district) {
  state.selectedCareDistrict = district;
  loadCropLifecycle(state.selectedCareCrop, district, state.lifecycleSowingDate);
};

window.onSowingDateChanged = function(val) {
  if (!val) return;
  state.lifecycleSowingDate = val;
  loadCropLifecycle(state.selectedCareCrop, state.selectedCareDistrict, val);
};

window.setSowingPresetDays = function(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  state.lifecycleSowingDate = dateStr;
  const sowingInput = document.getElementById('lifecycle-sowing-input');
  if (sowingInput) sowingInput.value = dateStr;

  loadCropLifecycle(state.selectedCareCrop, state.selectedCareDistrict, dateStr);
};

window.switchLifecycleTab = function(tabName) {
  state.lifecycleActiveTab = tabName;
  const tabTimeline = document.getElementById('lifecycle-tab-timeline');
  const tabCalendar = document.getElementById('lifecycle-tab-calendar');
  const btnTimeline = document.getElementById('tab-btn-timeline');
  const btnCalendar = document.getElementById('tab-btn-calendar');

  if (tabName === 'calendar') {
    if (tabTimeline) tabTimeline.style.display = 'none';
    if (tabCalendar) tabCalendar.style.display = 'block';
    if (btnTimeline) btnTimeline.classList.remove('active');
    if (btnCalendar) btnCalendar.classList.add('active');
    renderCalendarView();
  } else {
    if (tabTimeline) tabTimeline.style.display = 'block';
    if (tabCalendar) tabCalendar.style.display = 'none';
    if (btnTimeline) btnTimeline.classList.add('active');
    if (btnCalendar) btnCalendar.classList.remove('active');
  }
};

const CROP_HERO_META = {
  ragi: {
    en: 'Ragi',
    kn: 'ರಾಗಿ (Finger Millet)',
    sci: 'Eleusine coracana',
    tagline: 'Ragi (Finger Millet)',
    stateBadge: "Karnataka's Nutritional Grain",
    photo: 'public/images/crops/ragi.jpg'
  },
  rice: {
    en: 'Rice',
    kn: 'ಭತ್ತ (Paddy)',
    sci: 'Oryza sativa',
    tagline: 'Rice (Paddy)',
    stateBadge: "Karnataka's Staple Foodgrain",
    photo: 'public/images/crops/rice.jpg'
  },
  maize: {
    en: 'Maize',
    kn: 'ಮೆಕ್ಕೆ ಜೋಳ (Corn)',
    sci: 'Zea mays',
    tagline: 'Maize (Corn)',
    stateBadge: 'Major Kharif Cereal Crop',
    photo: 'public/images/crops/maize.jpg'
  },
  tomato: {
    en: 'Tomato',
    kn: 'ಟೊಮೇಟೊ (Tomato)',
    sci: 'Solanum lycopersicum',
    tagline: 'Tomato (Commercial Vegetable)',
    stateBadge: 'High-Value Horticultural Crop',
    photo: 'public/images/crops/tomato.jpg'
  },
  arecanut: {
    en: 'Arecanut',
    kn: 'ಅಡಿಕೆ (Betel Nut)',
    sci: 'Areca catechu',
    tagline: 'Arecanut (Betel Nut)',
    stateBadge: "Karnataka's Premier Commercial Plantation",
    photo: 'public/images/crops/arecanut.jpg'
  }
};

function renderBioAnimation(animType) {
  const container = document.getElementById('lc-bio-animation-box');
  if (!container) return;

  let svgHtml = '';
  switch (animType) {
    case 'seed_germination':
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <rect x="0" y="65" width="300" height="55" fill="#fef3c7" opacity="0.6"/>
          <line x1="0" y1="65" x2="300" y2="65" stroke="#b45309" stroke-width="2" stroke-dasharray="4 3"/>
          <text x="12" y="82" fill="#92400e" font-size="10" font-weight="bold">SOIL SEEDBED (ಮಣ್ಣಿನ ಬೀಜಮಡಿ)</text>
          <ellipse cx="150" cy="68" rx="8" ry="6" fill="#78350f" style="animation: seedGerminate 2.5s ease-in-out infinite;"/>
          <path d="M 150 72 Q 148 90 144 108" class="anim-root" stroke="#854d0e" stroke-width="2" fill="none"/>
          <path d="M 150 78 Q 155 94 160 106" class="anim-root" stroke="#854d0e" stroke-width="1.5" fill="none"/>
          <path d="M 150 65 Q 150 38 150 18" class="anim-stem" stroke="#2e7d32" stroke-width="3" fill="none"/>
          <ellipse cx="143" cy="18" rx="7" ry="4" fill="#4ade80" transform="rotate(-30 143 18)"/>
          <ellipse cx="157" cy="18" rx="7" ry="4" fill="#4ade80" transform="rotate(30 157 18)"/>
        </svg>
      `;
      break;
    case 'vegetative_tillering':
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <line x1="0" y1="80" x2="300" y2="80" stroke="#a16207" stroke-width="2"/>
          <rect x="0" y="80" width="300" height="40" fill="#fef9c3" opacity="0.45"/>
          <path d="M 150 80 Q 130 98 112 114" class="anim-root" stroke="#713f12" stroke-width="1.8" fill="none"/>
          <path d="M 150 80 Q 150 100 150 116" class="anim-root" stroke="#713f12" stroke-width="2" fill="none"/>
          <path d="M 150 80 Q 170 98 188 114" class="anim-root" stroke="#713f12" stroke-width="1.8" fill="none"/>
          <path d="M 150 80 Q 150 42 150 12" class="anim-stem" stroke="#15803d" stroke-width="3.5" fill="none"/>
          <path d="M 150 75 Q 132 50 120 25" class="anim-stem" stroke="#22c55e" stroke-width="2.5" fill="none"/>
          <path d="M 150 75 Q 168 50 180 25" class="anim-stem" stroke="#22c55e" stroke-width="2.5" fill="none"/>
          <ellipse cx="120" cy="24" rx="9" ry="4" fill="#4ade80" transform="rotate(-35 120 24)"/>
          <ellipse cx="180" cy="24" rx="9" ry="4" fill="#4ade80" transform="rotate(35 180 24)"/>
          <ellipse cx="150" cy="12" rx="10" ry="5" fill="#22c55e"/>
          <text x="150" y="112" text-anchor="middle" font-size="10.5" fill="#15803d" font-weight="bold">Tillering & Canopy Expansion (ಕವಲೊಡೆಯುವಿಕೆ)</text>
        </svg>
      `;
      break;
    case 'flowering_panicle':
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <path d="M 150 115 Q 150 65 150 35" stroke="#15803d" stroke-width="3.5" fill="none"/>
          <path d="M 150 75 Q 120 70 95 85" stroke="#22c55e" stroke-width="2" fill="none"/>
          <path d="M 150 65 Q 180 60 205 75" stroke="#22c55e" stroke-width="2" fill="none"/>
          <g class="anim-flower" transform="translate(150, 28)">
            <circle cx="0" cy="0" r="10" fill="#eab308" opacity="0.85"/>
            <circle cx="-12" cy="-6" r="6" fill="#facc15"/>
            <circle cx="12" cy="-6" r="6" fill="#facc15"/>
            <circle cx="-8" cy="-15" r="5" fill="#fef08a"/>
            <circle cx="8" cy="-15" r="5" fill="#fef08a"/>
            <circle cx="0" cy="-22" r="4" fill="#fef9c3"/>
          </g>
          <text x="150" y="112" text-anchor="middle" font-size="10.5" fill="#854d0e" font-weight="bold">Anthesis & Flowering Active (ಹೂವರಳುವಿಕೆ)</text>
        </svg>
      `;
      break;
    case 'grain_filling':
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <path d="M 150 115 Q 150 75 150 42" stroke="#16a34a" stroke-width="3.5" fill="none"/>
          <g class="anim-flower" transform="translate(150, 36)">
            <ellipse cx="0" cy="-5" rx="8" ry="16" fill="#ca8a04"/>
            <ellipse cx="-10" cy="2" rx="7" ry="14" fill="#eab308" transform="rotate(-15 -10 2)"/>
            <ellipse cx="10" cy="2" rx="7" ry="14" fill="#eab308" transform="rotate(15 10 2)"/>
            <ellipse cx="-16" cy="14" rx="6" ry="12" fill="#facc15" transform="rotate(-30 -16 14)"/>
            <ellipse cx="16" cy="14" rx="6" ry="12" fill="#facc15" transform="rotate(30 16 14)"/>
          </g>
          <text x="150" y="112" text-anchor="middle" font-size="10.5" fill="#713f12" font-weight="bold">Grain Filling & Starch Accumulation (ಕಾಳು ತುಂಬುವಿಕೆ)</text>
        </svg>
      `;
      break;
    case 'harvest_curing':
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <circle cx="60" cy="28" r="14" fill="#fef08a" opacity="0.6"/>
          <circle cx="60" cy="28" r="10" fill="#eab308"/>
          <line x1="60" y1="10" x2="60" y2="4" stroke="#f59e0b" stroke-width="2"/>
          <line x1="80" y1="28" x2="86" y2="28" stroke="#f59e0b" stroke-width="2"/>
          <path d="M 160 115 Q 165 70 180 35" stroke="#a16207" stroke-width="3" fill="none"/>
          <ellipse cx="180" cy="35" rx="10" ry="22" fill="#d97706" transform="rotate(25 180 35)"/>
          <path d="M 220 85 Q 235 65 250 80 Q 240 95 220 85" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
          <rect x="215" y="85" width="6" height="15" fill="#78350f" rx="1"/>
          <text x="150" y="114" text-anchor="middle" font-size="10.5" fill="#78350f" font-weight="bold">Physiological Maturity & Harvest Curing (ಕೊಯ್ಲು & ಒಣಗಿಸುವಿಕೆ)</text>
        </svg>
      `;
      break;
    case 'irrigation_root':
    default:
      svgHtml = `
        <svg viewBox="0 0 300 120" style="width: 100%; max-width: 320px; height: 110px;">
          <line x1="0" y1="50" x2="300" y2="50" stroke="#92400e" stroke-width="2"/>
          <rect x="135" y="0" width="30" height="50" fill="#78350f"/>
          <path d="M 150 50 Q 110 80 80 115" class="anim-root" stroke="#854d0e" stroke-width="2.5" fill="none"/>
          <path d="M 150 50 Q 150 85 150 118" class="anim-root" stroke="#854d0e" stroke-width="3" fill="none"/>
          <path d="M 150 50 Q 190 80 220 115" class="anim-root" stroke="#854d0e" stroke-width="2.5" fill="none"/>
          <line x1="100" y1="55" x2="100" y2="75" class="anim-water"/>
          <line x1="140" y1="55" x2="140" y2="80" class="anim-water"/>
          <line x1="160" y1="55" x2="160" y2="80" class="anim-water"/>
          <line x1="200" y1="55" x2="200" y2="75" class="anim-water"/>
          <text x="150" y="114" text-anchor="middle" font-size="10.5" fill="#0369a1" font-weight="bold">Root Zone Moisture & Basin Care (ಬುಡದ ತೇವಾಂಶ & ನೀರಾವರಿ)</text>
        </svg>
      `;
      break;
  }

  container.innerHTML = svgHtml;
}

window.openStageDetailPage = async function(cropId, stageId) {
  cropId = cropId || state.selectedCareCrop || 'ragi';
  const isKn = state.lang === 'kn';

  // 1. Switch views: hide overview, show dedicated stage page
  const overviewEl = document.getElementById('lc-main-overview');
  const detailEl = document.getElementById('lc-stage-detail-page');
  if (overviewEl) overviewEl.style.display = 'none';
  if (detailEl) detailEl.style.display = 'block';

  state.selectedLifecycleStageId = stageId;

  // 2. Fetch or find stage details
  let stage = null;
  if (state.lifecycleFullDefinition?.stages) {
    stage = state.lifecycleFullDefinition.stages.find(s => s.stage_id === stageId);
  }

  try {
    const res = await fetch(`${API_BASE}/api/lifecycle/${encodeURIComponent(cropId)}/stage/${encodeURIComponent(stageId)}`);
    if (res.ok) {
      const fetchedStage = await res.json();
      if (fetchedStage) stage = fetchedStage;
    }
  } catch (err) {
    console.warn('Could not fetch stage detail endpoint, using cached definition', err);
  }

  if (!stage) return;

  // 3. Header info
  const cropMeta = CROP_HERO_META[cropId] || { en: cropId, kn: cropId };
  const cropTag = document.getElementById('lc-detail-crop-tag');
  if (cropTag) cropTag.textContent = `${cropMeta.en.toUpperCase()} • ${cropMeta.kn}`;

  const titleEl = document.getElementById('lc-detail-stage-title');
  const titleKnEl = document.getElementById('lc-detail-stage-title-kn');
  if (titleEl) titleEl.textContent = stage.name_en;
  if (titleKnEl) titleKnEl.textContent = stage.name_kn;

  const daysPill = document.getElementById('lc-detail-days-pill');
  if (daysPill) {
    if (stage.start_day != null && stage.end_day != null) {
      daysPill.textContent = isKn ? `📅 ದಿನ ${stage.start_day} – ${stage.end_day}` : `📅 Day ${stage.start_day} – ${stage.end_day}`;
    } else if (stage.start_month != null && stage.end_month != null) {
      daysPill.textContent = isKn ? `📅 ${stage.start_month}–${stage.end_month} ನೇ ತಿಂಗಳು` : `📅 Month ${stage.start_month} – ${stage.end_month}`;
    } else {
      daysPill.textContent = '';
    }
  }

  // Status & Progress
  let statusLabel = 'upcoming';
  if (state.lifecycleData) {
    if (state.lifecycleData.completed_stages.includes(stageId)) statusLabel = 'completed';
    else if (state.lifecycleData.current_stage.stage_id === stageId) statusLabel = 'current';
  }

  const badgeEl = document.getElementById('lc-stage-detail-badge');
  if (badgeEl) {
    badgeEl.className = `stage-status-badge status-${statusLabel}`;
    if (statusLabel === 'completed') badgeEl.textContent = isKn ? '✓ ಪೂರ್ಣಗೊಂಡಿದೆ / Completed' : '✓ Completed';
    else if (statusLabel === 'current') badgeEl.textContent = isKn ? '● ಪ್ರಸ್ತುತ ಹಂತ / Current Stage' : '● Current Stage';
    else badgeEl.textContent = isKn ? '○ ಮುಂಬರುವ ಹಂತ / Upcoming Stage' : '○ Upcoming Stage';
  }

  const progressPill = document.getElementById('lc-detail-progress-pill');
  const stageBar = document.getElementById('lc-detail-stage-bar');
  if (statusLabel === 'completed') {
    if (progressPill) progressPill.textContent = isKn ? '100% ಪೂರ್ಣಗೊಂಡಿದೆ' : '100% Completed';
    if (stageBar) { stageBar.style.width = '100%'; stageBar.style.background = '#2e7d32'; }
  } else if (statusLabel === 'current') {
    const pct = state.lifecycleData?.stage_progress_percentage || 65;
    if (progressPill) progressPill.textContent = state.lifecycleData?.stage_progress_text || `${pct}% Active`;
    if (stageBar) { stageBar.style.width = `${pct}%`; stageBar.style.background = '#f59e0b'; }
  } else {
    if (progressPill) progressPill.textContent = isKn ? 'ಮುಂಬರುವ ಹಂತ' : 'Upcoming Stage';
    if (stageBar) { stageBar.style.width = '0%'; stageBar.style.background = '#cbd5e1'; }
  }

  // 4. Large Real Photo
  const mainImg = document.getElementById('lc-detail-main-img');
  const photoCaption = document.getElementById('lc-detail-photo-caption');
  const photoSource = document.getElementById('lc-detail-photo-source');

  const photoUrl = stage.main_photo?.url || stage.image_url || stage.thumbnail || `public/images/crops/${cropId}.jpg`;
  if (mainImg) {
    mainImg.src = photoUrl;
    mainImg.alt = stage.name_en;
  }
  if (photoCaption) {
    photoCaption.textContent = isKn 
      ? (stage.main_photo?.caption_kn || stage.main_photo?.caption_en || stage.name_kn) 
      : (stage.main_photo?.caption_en || stage.name_en);
  }
  if (photoSource) {
    const src = stage.main_photo?.source || 'ICAR / University of Agricultural Sciences';
    photoSource.textContent = isKn ? `ಮೂಲ: ${src}` : `Source: ${src}`;
  }

  // 5. What happens now?
  const happeningEn = document.getElementById('lc-detail-happening-en');
  const happeningKn = document.getElementById('lc-detail-happening-kn');
  if (happeningEn) happeningEn.textContent = stage.what_happens_en || stage.description_en || '-';
  if (happeningKn) happeningKn.textContent = stage.what_happens_kn || stage.description_kn || '-';

  // 6. Biological Animation
  renderBioAnimation(stage.animation_type || 'vegetative_tillering');

  // 7. What the Farmer Should Do: Structured Actions (Zero Empty Card Policy)
  const actionsSec = document.getElementById('lc-detail-actions-section');
  const careBox = document.getElementById('lc-action-box-care');
  const waterBox = document.getElementById('lc-action-box-water');
  const weedBox = document.getElementById('lc-action-box-weed');
  const nutBox = document.getElementById('lc-action-box-nutrients');
  const protBox = document.getElementById('lc-action-box-protection');
  const fallbackMsg = document.getElementById('lc-actions-fallback-msg');

  const careEl = document.getElementById('lc-action-care');
  const waterEl = document.getElementById('lc-action-water');
  const weedEl = document.getElementById('lc-action-weed');
  const nutEl = document.getElementById('lc-action-nutrients');
  const protEl = document.getElementById('lc-action-protection');
  const nutScheduleBox = document.getElementById('lc-action-nutrients-schedule');

  function extractActionText(act) {
    if (!act) return null;
    if (typeof act === 'string') {
      const clean = act.trim();
      return (clean && clean !== '-') ? clean : null;
    }
    if (typeof act === 'object') {
      const val = isKn ? (act.action_kn || act.action_en) : (act.action_en || act.action_kn);
      if (val && typeof val === 'string') {
        const clean = val.trim();
        return (clean && clean !== '-') ? clean : null;
      }
    }
    return null;
  }

  const fa = stage.farmer_actions || {};
  let visibleActionCount = 0;

  // Crop Care
  const careText = extractActionText(fa.crop_care) || 
    (stage.tasks_en && stage.tasks_en.length > 0 ? (isKn ? (stage.tasks_kn?.[0] || stage.tasks_en[0]) : stage.tasks_en[0]) : null);
  if (careBox && careEl) {
    if (careText) {
      careEl.textContent = careText;
      careBox.style.display = 'block';
      visibleActionCount++;
    } else {
      careBox.style.display = 'none';
    }
  }

  // Water Management
  const waterText = extractActionText(fa.water || fa.water_management) ||
    (stage.weather_sensitivity ? (isKn ? stage.weather_sensitivity.action_on_rain_kn : stage.weather_sensitivity.action_on_rain_en) : null);
  if (waterBox && waterEl) {
    if (waterText) {
      waterEl.textContent = waterText;
      waterBox.style.display = 'block';
      visibleActionCount++;
    } else {
      waterBox.style.display = 'none';
    }
  }

  // Weed Control
  const weedText = extractActionText(fa.weed || fa.weed_control) ||
    (stage.tasks_en && stage.tasks_en.length > 1 ? (isKn ? (stage.tasks_kn?.[1] || stage.tasks_en[1]) : stage.tasks_en[1]) : null);
  if (weedBox && weedEl) {
    if (weedText) {
      weedEl.textContent = weedText;
      weedBox.style.display = 'block';
      visibleActionCount++;
    } else {
      weedBox.style.display = 'none';
    }
  }

  // Nutrient Management (with Sourced NPK Schedule if available)
  const nutObj = fa.nutrients || fa.nutrient_management;
  const nutText = extractActionText(nutObj);
  if (nutBox && nutEl) {
    if (nutText) {
      nutEl.textContent = nutText;
      nutBox.style.display = 'block';
      visibleActionCount++;

      if (nutScheduleBox) {
        if (nutObj && typeof nutObj === 'object' && nutObj.npk_schedule) {
          nutScheduleBox.style.display = 'flex';
          nutScheduleBox.innerHTML = `
            <div class="lc-npk-badge"><strong>N:P:K:</strong> ${nutObj.npk_schedule}</div>
            ${nutObj.timing_en ? `<div class="lc-npk-timing">⏱️ ${isKn ? (nutObj.timing_kn || nutObj.timing_en) : nutObj.timing_en}</div>` : ''}
            ${nutObj.source ? `<div class="lc-npk-src">🏛️ ${nutObj.source}</div>` : ''}
          `;
        } else {
          nutScheduleBox.style.display = 'none';
        }
      }
    } else {
      nutBox.style.display = 'none';
      if (nutScheduleBox) nutScheduleBox.style.display = 'none';
    }
  }

  // Protection / Scouting
  const protText = extractActionText(fa.protection) ||
    (stage.key_observations_en ? (isKn ? (stage.key_observations_kn || stage.key_observations_en) : stage.key_observations_en) : null);
  if (protBox && protEl) {
    if (protText) {
      protEl.textContent = protText;
      protBox.style.display = 'block';
      visibleActionCount++;
    } else {
      protBox.style.display = 'none';
    }
  }

  if (fallbackMsg) {
    fallbackMsg.style.display = visibleActionCount === 0 ? 'block' : 'none';
  }

  // 8. Watch & Learn Video Section (Strict Zero Black Box Policy)
  const videoSec = document.getElementById('lc-detail-video-section');
  const videoEl = document.getElementById('lc-detail-video-container');
  if (videoSec && videoEl) {
    if (stage.video && stage.video.url && stage.video.title_en) {
      videoSec.style.display = 'block';
      videoEl.innerHTML = `
        <div class="lc-video-inner">
          <div class="lc-video-thumb-wrap">
            <img src="${stage.video.thumbnail || 'public/images/crops/' + cropId + '.jpg'}" alt="${stage.video.title_en}" class="lc-video-thumb">
            <span class="lc-video-play-btn">▶</span>
            <span class="lc-video-duration">${stage.video.duration || 'Institutional'}</span>
          </div>
          <div class="lc-video-meta">
            <div class="lc-video-publisher">🏛️ ${stage.video.publisher}</div>
            <h4 class="lc-video-title">${isKn ? (stage.video.title_kn || stage.video.title_en) : stage.video.title_en}</h4>
            <p class="lc-video-desc">${isKn ? (stage.video.description_kn || stage.video.description_en) : stage.video.description_en}</p>
            <a href="${stage.video.url}" target="_blank" rel="noopener noreferrer" class="btn-watch-video">
              ▶ <span class="txt-kn">ಅಧಿಕೃತ ವಿಡಿಯೋ ವೀಕ್ಷಿಸಿ</span><span class="txt-en" style="display: none;">Watch Official Video</span>
            </a>
          </div>
        </div>
      `;
    } else {
      // Never render a black video player or empty card: hide the section entirely
      videoSec.style.display = 'none';
      videoEl.innerHTML = '';
    }
  }

  // 9. Stage Real Photos Gallery (Hide entirely if no photos)
  const gallerySec = document.getElementById('lc-detail-gallery-section');
  const galleryEl = document.getElementById('lc-detail-gallery');
  if (gallerySec && galleryEl) {
    const photos = (stage.gallery_photos || []).filter(p => p && p.url);
    if (photos.length > 0) {
      gallerySec.style.display = 'block';
      galleryEl.innerHTML = '';
      photos.forEach(p => {
        const item = document.createElement('div');
        item.className = 'lc-gallery-item';
        item.innerHTML = `
          <img src="${p.url}" alt="${p.caption_en || 'Stage photo'}" class="lc-gallery-img" onerror="this.src='public/images/crops/${cropId}.jpg'">
          <div class="lc-gallery-info">
            <div class="lc-gallery-caption">${isKn ? (p.caption_kn || p.caption_en) : p.caption_en}</div>
            <div class="lc-gallery-src">${p.source ? (isKn ? 'ಮೂಲ: ' + p.source : 'Source: ' + p.source) : ''}</div>
          </div>
        `;
        galleryEl.appendChild(item);
      });
    } else {
      // Hide entire gallery section if no additional photos exist
      gallerySec.style.display = 'none';
      galleryEl.innerHTML = '';
    }
  }

  // 10. Quick Practical Tip (Hide if empty)
  const tipSec = document.getElementById('lc-detail-quicktip-section');
  const tipEnEl = document.getElementById('lc-detail-quicktip-en');
  const tipKnEl = document.getElementById('lc-detail-quicktip-kn');
  const tipEn = stage.quick_tip_en?.trim();
  const tipKn = stage.quick_tip_kn?.trim();
  if (tipSec) {
    if (tipEn || tipKn) {
      tipSec.style.display = 'flex';
      if (tipEnEl) tipEnEl.textContent = tipEn || tipKn;
      if (tipKnEl) tipKnEl.textContent = tipKn || tipEn;
    } else {
      tipSec.style.display = 'none';
    }
  }

  // 11. Authoritative Sources & References (Hide if empty)
  const refsSec = document.getElementById('lc-detail-references-section');
  const refsList = document.getElementById('lc-detail-references-list');
  if (refsSec && refsList) {
    const refs = (stage.references || []).filter(r => r && (r.title || r.source));
    if (refs.length > 0) {
      refsSec.style.display = 'block';
      refsList.innerHTML = '';
      refs.forEach(ref => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        li.innerHTML = `
          <strong>${ref.title}</strong> — <span style="color: var(--text-muted);">${ref.source}</span>
          <span style="font-size: 11px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${ref.type || 'Official Guide'}</span>
        `;
        refsList.appendChild(li);
      });
    } else {
      refsSec.style.display = 'none';
      refsList.innerHTML = '';
    }
  }

  // 12. Bottom Navigation Controls & Step Numbers
  const allStages = state.lifecycleFullDefinition?.stages || [];
  const currentIndex = allStages.findIndex(s => s.stage_id === stageId);

  const pillsEl = document.getElementById('lc-stage-step-pills');
  if (pillsEl) {
    pillsEl.innerHTML = '';
    allStages.forEach((stg, i) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `lc-step-pill ${i === currentIndex ? 'active' : ''}`;
      pill.textContent = i + 1;
      pill.title = `${i + 1}. ${stg.name_en}`;
      pill.onclick = () => window.openStageDetailPage(cropId, stg.stage_id);
      pillsEl.appendChild(pill);
    });
  }

  const prevBtn = document.getElementById('btn-prev-stage');
  const nextBtn = document.getElementById('btn-next-stage');
  const lblPrev = document.getElementById('lbl-prev-stage');
  const lblNext = document.getElementById('lbl-next-stage');

  if (prevBtn) {
    if (currentIndex > 0) {
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      prevBtn.onclick = () => window.openStageDetailPage(cropId, allStages[currentIndex - 1].stage_id);
      if (lblPrev) lblPrev.textContent = isKn ? `${allStages[currentIndex - 1].name_kn}` : allStages[currentIndex - 1].name_en;
    } else {
      prevBtn.disabled = true;
      prevBtn.style.opacity = '0.35';
      if (lblPrev) lblPrev.textContent = isKn ? 'ಆರಂಭಿಕ ಹಂತ' : 'First Stage';
    }
  }

  if (nextBtn) {
    if (currentIndex >= 0 && currentIndex < allStages.length - 1) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.onclick = () => window.openStageDetailPage(cropId, allStages[currentIndex + 1].stage_id);
      if (lblNext) lblNext.textContent = isKn ? `${allStages[currentIndex + 1].name_kn}` : allStages[currentIndex + 1].name_en;
    } else {
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.35';
      if (lblNext) lblNext.textContent = isKn ? 'ಅಂತಿಮ ಹಂತ' : 'Last Stage';
    }
  }

  const careView = document.getElementById('view-crop-care');
  if (careView) careView.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.backToLifecycleOverview = function() {
  const overviewEl = document.getElementById('lc-main-overview');
  const detailEl = document.getElementById('lc-stage-detail-page');
  if (detailEl) detailEl.style.display = 'none';
  if (overviewEl) overviewEl.style.display = 'block';
  const careView = document.getElementById('view-crop-care');
  if (careView) careView.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.navigateStage = function(direction) {
  const allStages = state.lifecycleFullDefinition?.stages || [];
  if (!allStages.length) return;
  const currentIndex = allStages.findIndex(s => s.stage_id === state.selectedLifecycleStageId);
  const nextIndex = currentIndex + direction;
  if (nextIndex >= 0 && nextIndex < allStages.length) {
    window.openStageDetailPage(state.selectedCareCrop, allStages[nextIndex].stage_id);
  }
};

window.selectTimelineStage = function(stageId) {
  window.openStageDetailPage(state.selectedCareCrop, stageId);
};

// -----------------------------------------------------------------------------
// Dynamic Rendering: Visual Timeline Track (Main Page)
// -----------------------------------------------------------------------------

function renderTimelineTrack(timelineNodes, activeStageId) {
  const track = document.getElementById('lc-timeline-track');
  if (!track || !timelineNodes) return;
  const isKn = state.lang === 'kn';
  const cropId = state.selectedCareCrop || 'ragi';

  track.innerHTML = '';
  timelineNodes.forEach((node, idx) => {
    const isCurrent = node.status === 'current';
    const isCompleted = node.status === 'completed';
    const isUpcoming = node.status === 'upcoming';
    const statusClass = isCurrent ? 'current' : (isCompleted ? 'completed' : 'upcoming');
    const isSelected = activeStageId ? (node.stage_id === activeStageId) : isCurrent;

    const wrap = document.createElement('div');
    wrap.className = 'lc-timeline-step-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lc-stage-node ${statusClass} ${isSelected ? 'selected' : ''}`;
    btn.setAttribute('data-stage-id', node.stage_id);
    btn.setAttribute('title', `${node.name_en} (${node.name_kn}) — Click to view stage details`);
    btn.onclick = () => window.openStageDetailPage(cropId, node.stage_id);

    const pinMarker = isCompleted ? '✓' : (isCurrent ? '●' : '○');
    const stageTitleEn = `${idx + 1}. ${node.name_en}`;
    const stageTitleKn = node.name_kn;
    const currentBadgeHtml = isCurrent 
      ? `<span class="lc-current-badge-pill">${isKn ? 'ಪ್ರಸ್ತುತ ಹಂತ' : 'Current Stage'}</span>` 
      : '';

    const imgUrl = node.image_url || `public/images/stages/${cropId}_stage${idx + 1}.jpg`;

    btn.innerHTML = `
      ${currentBadgeHtml}
      <div class="lc-stage-photo-box">
        <img src="${imgUrl}" alt="${node.name_en}" onerror="this.src='public/images/crops/${cropId}.jpg'">
      </div>
      <div class="lc-node-pin">${pinMarker}</div>
      <div class="lc-stage-name-en">${stageTitleEn}</div>
      <div class="lc-stage-name-kn">${stageTitleKn}</div>
    `;

    wrap.appendChild(btn);

    // Connector line to next node
    if (idx < timelineNodes.length - 1) {
      const line = document.createElement('div');
      line.className = `lc-timeline-connector-bar ${isCompleted ? 'completed' : ''}`;
      wrap.appendChild(line);
    }

    track.appendChild(wrap);
  });
}

function renderActiveStageDetail(stage, status) {
  if (!stage) return;
  if (state.selectedLifecycleStageId === stage.stage_id) {
    const detailEl = document.getElementById('lc-stage-detail-page');
    if (detailEl && detailEl.style.display !== 'none') {
      window.openStageDetailPage(state.selectedCareCrop, stage.stage_id);
    }
  }
}

function renderCalendarView() {
  const calGrid = document.getElementById('cal-month-grid');
  const monthTitle = document.getElementById('cal-month-title');
  if (!calGrid) return;

  const isKn = state.lang === 'kn';
  const todayStr = getTodayISOString();
  const sowingStr = state.lifecycleSowingDate || getDefaultSowingDate();
  const todayDate = new Date();
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth(); // 0-indexed

  // Month Title
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesKn = ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'];
  if (monthTitle) {
    monthTitle.textContent = isKn 
      ? `${monthNamesKn[month]} ${year}`
      : `${monthNamesEn[month]} ${year}`;
  }

  calGrid.innerHTML = '';

  // Day Headers (Mon - Sun)
  const dayHeadersKn = ['ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ', 'ಭಾನು'];
  const dayHeadersEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const headers = isKn ? dayHeadersKn : dayHeadersEn;
  headers.forEach(h => {
    const th = document.createElement('div');
    th.className = 'calendar-header-cell';
    th.textContent = h;
    calGrid.appendChild(th);
  });

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const completedSet = new Set(state.completedActionDates || []);

  // Previous month padding cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    const padDay = prevMonthDays - firstDayOfWeek + 1 + i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="calendar-day-num">${padDay}</span>`;
    calGrid.appendChild(cell);
  }

    // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    cell.setAttribute('data-date', dStr);

    const isToday = (dStr === todayStr);
    const isPast = (dStr < todayStr);
    const isUpcoming = (dStr > todayStr);
    const isCompleted = completedSet.has(dStr);

    let markerHtml = '';
    if (isToday) {
      cell.classList.add('cal-today');
      markerHtml = isCompleted ? '🔥' : '●';
    } else if (isPast) {
      if (isCompleted) {
        cell.classList.add('cal-completed');
        markerHtml = '✓';
      } else if (dStr >= sowingStr) {
        markerHtml = '<span style="color: #bbb; font-size: 11px;">—</span>';
      }
    } else if (isUpcoming) {
      cell.classList.add('cal-upcoming');
      markerHtml = '○';
    }

    cell.innerHTML = `
      <span class="calendar-day-num">${d}</span>
      <span class="calendar-day-marker">${markerHtml}</span>
    `;

    // Interactive inspection on tap/click
    cell.title = isKn ? `ದಿನಾಂಕ ${dStr} ರ ಹಂತ ಮತ್ತು ಕೆಲಸ ವೀಕ್ಷಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ` : `Click to inspect stage & tasks for ${dStr}`;
    cell.onclick = () => window.inspectCalendarDate(dStr);

    calGrid.appendChild(cell);
  }
}

// -----------------------------------------------------------------------------
// Interactive Calendar Day Inspector
// -----------------------------------------------------------------------------

window.inspectCalendarDate = async function(targetDateStr) {
  const cropId = state.selectedCareCrop || 'ragi';
  const sowingDate = state.lifecycleSowingDate || getDefaultSowingDate();
  const isKn = state.lang === 'kn';

  // Highlight clicked cell
  document.querySelectorAll('.calendar-day-cell').forEach(c => {
    c.classList.toggle('cal-selected', c.getAttribute('data-date') === targetDateStr);
  });

  const card = document.getElementById('cal-day-inspector-card');
  if (!card) return;

  try {
    const res = await fetch(`${API_BASE}/api/lifecycle/${encodeURIComponent(cropId)}/day-detail?sowing_date=${encodeURIComponent(sowingDate)}&date=${encodeURIComponent(targetDateStr)}`);
    if (!res.ok) throw new Error('Failed to fetch day detail');
    const detail = await res.json();

    card.style.display = 'block';

    const iconEl = document.getElementById('cal-inspect-icon');
    const titleEl = document.getElementById('cal-inspect-date-title');
    const dayBadgeEl = document.getElementById('cal-inspect-day-badge');
    const statusBadgeEl = document.getElementById('cal-inspect-status-badge');
    const stageNameEl = document.getElementById('cal-inspect-stage-name');
    const taskDescEl = document.getElementById('cal-inspect-task-desc');

    if (iconEl) iconEl.textContent = detail.stage_icon || '📅';
    if (titleEl) titleEl.textContent = detail.date;
    if (dayBadgeEl) dayBadgeEl.textContent = isKn ? `ದಿನ ${detail.crop_day}` : `Day ${detail.crop_day}`;

    if (statusBadgeEl) {
      statusBadgeEl.className = `stage-status-badge status-${detail.status}`;
      if (detail.status === 'completed') {
        statusBadgeEl.textContent = isKn ? '✓ ಪೂರ್ಣಗೊಂಡಿದೆ / Completed' : '✓ Completed';
      } else if (detail.status === 'current') {
        statusBadgeEl.textContent = isKn ? '● ಇಂದಿನ ದಿನ / Today' : '● Today';
      } else {
        statusBadgeEl.textContent = isKn ? '○ ಮುಂಬರುವ ದಿನ / Upcoming' : '○ Upcoming';
      }
    }

    if (stageNameEl) {
      stageNameEl.textContent = `${detail.stage_icon || '🌱'} ${isKn ? detail.stage_name_kn : detail.stage_name_en}`;
    }

    if (taskDescEl) {
      taskDescEl.textContent = isKn ? detail.planned_action_kn : detail.planned_action_en;
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    console.error('Failed to inspect calendar date:', err);
  }
};

// -----------------------------------------------------------------------------
// Simplified Crop Growth Stages Visual Guide
// Clean visual presentation: Photo, Name, Duration, 1-2 sentence explanation
// Grounded in credible agricultural benchmarks: IRRI RKB, ICAR-NRRI, ICAR-IIMR,
// ICAR-IIHR, ICAR-CPCRI, ICAR-CICR, UAS Bengaluru & UAS Dharwad.
// -----------------------------------------------------------------------------

const CROP_LIFECYCLE_GUIDE = {
  rice: {
    id: 'rice',
    name_en: 'Rice (Paddy)',
    name_kn: 'ಭತ್ತ (Paddy)',
    photo: 'public/images/crops/rice.jpg',
    desc_en: 'Staple wetland cereal crop widely cultivated across river basins and command irrigation areas in Karnataka. Annual crop duration spans approx. 115 to 140 days depending on variety (e.g. Sona Masuri, Jyothi, MTU-1010).',
    desc_kn: 'ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ಆಹಾರ ಧಾನ್ಯ ಬೆಳೆ. ನೀರಾವರಿ ಮತ್ತು ಮಳೆಯಾಶ್ರಿತ ಪ್ರದೇಶಗಳಲ್ಲಿ ಬೆಳೆಯಲಾಗುವ ಈ ವಾರ್ಷಿಕ ಬೆಳೆಯ ಒಟ್ಟು ಅವಧಿ ತಳಿಗೆ ಅನುಗುಣವಾಗಿ ಸುಮಾರು 115 ರಿಂದ 140 ದಿನಗಳು (ಸೋನಾ ಮಸೂರಿ, ಜ್ಯೋತಿ).',
    official_references: [
      {
        title_en: 'UAS Bengaluru — Package of Practices (Wetland Rice)',
        title_kn: 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು — ಭತ್ತದ ಸಮಗ್ರ ಬೇಸಾಯ ಕ್ರಮಗಳು',
        url: 'https://www.uasbangalore.edu.in/',
        desc_en: 'Standard Package of Practices for irrigated and rainfed paddy cultivation in Karnataka.',
        desc_kn: 'ಕರ್ನಾಟಕದ ನೀರಾವರಿ ಹಾಗೂ ಮಳೆಯಾಶ್ರಿತ ಭತ್ತದ ಅಧಿಕೃತ ಕೃಷಿ ಶಿಫಾರಸುಗಳು.'
      },
      {
        title_en: 'ICAR — National Rice Research Institute (NRRI) & Kharif Advisories',
        title_kn: 'ಐಸಿಎಆರ್ — ರಾಷ್ಟ್ರೀಯ ಭತ್ತ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ ಮತ್ತು ಬೆಳೆ ಸಲಹೆಗಳು',
        url: 'https://icar.gov.in/',
        desc_en: 'National agronomic research, varietal guidelines, and nutrient management advisories.',
        desc_kn: 'ರಾಷ್ಟ್ರೀಯ ಮಟ್ಟದ ಭತ್ತದ ತಳಿ ಸಂಶೋಧನೆ ಮತ್ತು ಪೋಷಕಾಂಶ ನಿರ್ವಹಣಾ ಮಾರ್ಗಸೂಚಿಗಳು.'
      },
      {
        title_en: 'FAO — Crop Growth Stages & Water Requirements (Rice)',
        title_kn: 'ಎಫ್‌ಎಒ — ಭತ್ತದ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳು ಮತ್ತು ನೀರಾವರಿ ಮಾರ್ಗದರ್ಶಿ',
        url: 'https://www.fao.org/4/s2022e/s2022e07.htm',
        desc_en: 'United Nations FAO agricultural water management benchmarks across physiological rice stages.',
        desc_kn: 'ವಿಶ್ವಸಂಸ್ಥೆಯ ಎಫ್‌ಎಒ ಜಾಗತಿಕ ಬೆಳೆ ಬೆಳವಣಿಗೆ ಹಾಗೂ ನೀರು ನಿರ್ವಹಣಾ ಮಾನದಂಡಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/rice_stage1_nursery.jpg',
        name_en: 'Stage 1 — Seedling & Nursery Bed',
        name_kn: 'ಹಂತ 1 — ಮೊಳಕೆ ಮತ್ತು ಸಸಿ ಮಡಿ ಹಂತ',
        duration_en: 'Approx. 20–25 days (Days 1–25)',
        duration_kn: 'ಸುಮಾರು 20–25 ದಿನಗಳು (1 ರಿಂದ 25 ದಿನಗಳು)',
        what_happens_en: 'Seeds sprout in moist nursery beds, producing primary roots and 4–5 sturdy green leaves with fibrous root mats.',
        what_happens_kn: 'ಬೀಜಗಳು ಮಡಿಯಲ್ಲಿ ಮೊಳಕೆಯೊಡೆದು ತಾಯಿಬೇರು ಮತ್ತು 4-5 ಬಲಿತ ಎಲೆಗಳುಳ್ಳ ಗಟ್ಟಿಮುಟ್ಟಾದ ಸಸಿಗಳಾಗಿ ಬೆಳೆಯುತ್ತವೆ.',
        farmer_tip_en: 'Maintain 2 cm shallow standing water in nursery. Drench with carbendazim or pseudomonas if seedling damping-off occurs.',
        farmer_tip_kn: 'ಸಸಿಮಡಿಯಲ್ಲಿ 2 ಸೆಂ.ಮೀ ಆಳದ ತಿಳಿನೀರು ನಿಲ್ಲಿಸಿ. ಎಲೆ ಹಳದಿಯಾದರೆ ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 5 ಗ್ರಾಂ ಜಿಂಕ್ ಸಲ್ಫೇಟ್ ಸಿಂಪಡಿಸಿ.'
      },
      {
        photo: 'public/images/stages/rice_stage2_transplant.jpg',
        name_en: 'Stage 2 — Main Field Transplanting & Tillering',
        name_kn: 'ಹಂತ 2 — ನಾಟಿ ಮತ್ತು ಸಕ್ರಿಯ ಕವಲೊಡೆಯುವಿಕೆ',
        duration_en: 'Approx. 30–35 days (Days 26–60)',
        duration_kn: 'ಸುಮಾರು 30–35 ದಿನಗಳು (26 ರಿಂದ 60 ದಿನಗಳು)',
        what_happens_en: 'Transplanted seedlings establish new crown roots in puddled soil, producing 10–16 productive tillers per hill.',
        what_happens_kn: 'ಕೆಸರು ಗದ್ದೆಯಲ್ಲಿ ನಾಟಿ ಮಾಡಿದ ಸಸಿಗಳು ಭದ್ರವಾಗಿ ಬೇರೂರಿ, ಪ್ರತಿ ಬುಡಕ್ಕೆ 10-16 ಹುಲುಸಾದ ಕವಲುಗಳನ್ನು ಉತ್ಪಾದಿಸುತ್ತವೆ.',
        farmer_tip_en: 'Transplant 2–3 seedlings per hill at 20×10 cm spacing. Apply second split of nitrogen (urea) at peak tillering; maintain 3–5 cm water.',
        farmer_tip_kn: '20×10 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ ಪ್ರತಿ ಗುಂಡಿಗೆ 2-3 ಸಸಿ ನಾಟಿ ಮಾಡಿ. ಕವಲೊಡೆಯುವಾಗ ಮೊದಲ ಕಳೆ ತೆಗೆದು ಎರಡನೇ ಕಂತಿನ ಯೂರಿಯಾ ಗೊಬ್ಬರ ಕೊಡಿ.'
      },
      {
        photo: 'public/images/stages/rice_stage3_tillering.jpg',
        name_en: 'Stage 3 — Panicle Initiation & Booting',
        name_kn: 'ಹಂತ 3 — ತೆನೆ ಕಟ್ಟುವುದು ಮತ್ತು ಸುಳಿ ಹಂತ',
        duration_en: 'Approx. 20–25 days (Days 61–85)',
        duration_kn: 'ಸುಮಾರು 20–25 ದಿನಗಳು (61 ರಿಂದ 85 ದಿನಗಳು)',
        what_happens_en: 'Reproductive phase initiates within the culm; microscopic embryonic panicles develop and the upper flag leaf sheath swells.',
        what_happens_kn: 'ಕಾಂಡದೊಳಗೆ ಸಂತಾನೋತ್ಪತ್ತಿ ಹಂತ ಪ್ರಾರಂಭವಾಗಿ, ಭ್ರೂಣಾವಸ್ಥೆಯ ತೆನೆ ರೂಪುಗೊಂಡು ಬಾವುಟ ಎಲೆಯ ಸುಳಿ ಉಬ್ಬಿಕೊಳ್ಳುತ್ತದೆ.',
        farmer_tip_en: 'Extremely critical water stage — never allow soil to crack. Scout for stem borer (dead hearts) and apply protective neem cake or cartap.',
        farmer_tip_kn: 'ಈ ಹಂತದಲ್ಲಿ ಗದ್ದೆ ಒಣಗಬಾರದು; 5 ಸೆಂ.ಮೀ ನೀರು ಕಡ್ಡಾಯ. ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು ಕಂಡರೆ ಸೂಕ್ತ ರಕ್ಷಣಾ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ.'
      },
      {
        photo: 'public/images/stages/rice_stage4_flower.jpg',
        name_en: 'Stage 4 — Flowering & Anthesis',
        name_kn: 'ಹಂತ 4 — ಹೂವಾಡಿಕೆ ಮತ್ತು ಪರಾಗಸ್ಪರ್ಶ',
        duration_en: 'Approx. 10–14 days (Days 86–100)',
        duration_kn: 'ಸುಮಾರು 10–14 ದಿನಗಳು (86 ರಿಂದ 100 ದಿನಗಳು)',
        what_happens_en: 'Panicles fully emerge from boot leaves; spikelets open in morning hours for wind pollination and fertilization.',
        what_happens_kn: 'ಸುಳಿಯಿಂದ ತೆನೆಗಳು ಹೊರಬಂದು ಮುಂಜಾನೆ ವೇಳೆ ಹೂಗಳು ಅರಳಿ ಗಾಳಿಯ ಮೂಲಕ ನೈಸರ್ಗಿಕ ಪರಾಗಸ್ಪರ್ಶ ನಡೆಯುತ್ತದೆ.',
        farmer_tip_en: 'Avoid foliar pesticide spraying during active morning pollination (9 AM to 12 PM). Maintain continuous shallow water layer.',
        farmer_tip_kn: 'ಬೆಳಗಿನ ಹೂವಾಡಿಕೆ ಸಮಯದಲ್ಲಿ (9 ರಿಂದ 12 ರವರೆಗೆ) ಯಾವುದೇ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಬೇಡಿ. ಗದ್ದೆಯಲ್ಲಿ ತೇವಾಂಶ ಸ್ಥಿರವಾಗಿರಲಿ.'
      },
      {
        photo: 'public/images/stages/rice_stage5_harvest.jpg',
        name_en: 'Stage 5 — Grain Filling & Ripening to Harvest',
        name_kn: 'ಹಂತ 5 — ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಕಟಾವು',
        duration_en: 'Approx. 25–35 days (Days 101–135)',
        duration_kn: 'ಸುಮಾರು 25–35 ದಿನಗಳು (101 ರಿಂದ 135 ದಿನಗಳು)',
        what_happens_en: 'Grains accumulate starch, progressing from milk to soft dough and hard yellow grain as moisture content drops to 18–20%.',
        what_happens_kn: 'ಕಾಳುಗಳಲ್ಲಿ ಹಾಲು ತುಂಬಿ ಗಟ್ಟಿಯಾಗಿ, ತೆನೆಯ ಶೇ. 85 ರಷ್ಟು ಕಾಳುಗಳು ಬಂಗಾರದ ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಕಟಾವಿಗೆ ಸಿದ್ಧವಾಗುತ್ತವೆ.',
        farmer_tip_en: 'Drain standing water completely 10–12 days prior to harvest to promote uniform drying and facilitate harvest machinery.',
        farmer_tip_kn: 'ಕಟಾವಿಗೆ 10-12 ದಿನ ಮುಂಚಿತವಾಗಿ ಗದ್ದೆಯ ನೀರನ್ನು ಪೂರ್ಣವಾಗಿ ಬಸಿದುಬಿಡಿ; ಕಾಳುಗಳು ಚೆನ್ನಾಗಿ ಒಣಗಿ ಕಟಾವಿಗೆ ಸುಲಭವಾಗುತ್ತದೆ.'
      }
    ]
  },
  maize: {
    id: 'maize',
    name_en: 'Maize (Corn)',
    name_kn: 'ಮೆಕ್ಕೆಜೋಳ (Corn)',
    photo: 'public/images/crops/maize.jpg',
    desc_en: 'Major dual-purpose annual grain and fodder cereal cultivated in Karnataka. Field duration spans approx. 95 to 120 days depending on hybrid maturity (e.g. CP-818, Hema, Hybrid Yellow).',
    desc_kn: 'ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ಆಹಾರ ಮತ್ತು ಮೇವಿನ ವಾರ್ಷಿಕ ಧಾನ್ಯ ಬೆಳೆ. ಹೈಬ್ರಿಡ್ ತಳಿಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಇದರ ಒಟ್ಟು ಅವಧಿ ಸುಮಾರು 95 ರಿಂದ 120 ದಿನಗಳು (ಉದಾ: ಸಿಪಿ-818, ಹೇಮ).',
    official_references: [
      {
        title_en: 'ICAR — Indian Institute of Maize Research (IIMR)',
        title_kn: 'ಐಸಿಎಆರ್ — ಭಾರತೀಯ ಮೆಕ್ಕೆಜೋಳ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ',
        url: 'https://icar.gov.in/',
        desc_en: 'National maize crop research, Fall Armyworm advisories, and hybrid crop calendars.',
        desc_kn: 'ಮೆಕ್ಕೆಜೋಳದ ಅಧಿಕೃತ ತಳಿ ಸಂಶೋಧನೆ, ಸೈನಿಕ ಹುಳು ನಿರ್ವಹಣೆ ಹಾಗೂ ಕೃಷಿ ಮಾರ್ಗಸೂಚಿಗಳು.'
      },
      {
        title_en: 'UAS Bengaluru — Package of Practices (Cereal Crops)',
        title_kn: 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು — ಮೆಕ್ಕೆಜೋಳದ ಸಮಗ್ರ ಬೇಸಾಯ ಕ್ರಮಗಳು',
        url: 'https://www.uasbangalore.edu.in/',
        desc_en: 'Recommended agronomy, plant spacing, and fertilizer schedules for Karnataka farmers.',
        desc_kn: 'ಕರ್ನಾಟಕದ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನಕ್ಕೆ ಸೂಕ್ತವಾದ ಬಿತ್ತನೆ ಅಂತರ ಹಾಗೂ ರಸಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳು.'
      },
      {
        title_en: 'FAO — Maize Growth Stages & Water Requirements',
        title_kn: 'ಎಫ್‌ಎಒ — ಮೆಕ್ಕೆಜೋಳದ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳು ಮತ್ತು ನೀರಿನ ಅಗತ್ಯತೆ',
        url: 'https://www.fao.org/4/s2022e/s2022e07.htm',
        desc_en: 'FAO physiological water-stress sensitivity benchmarks across vegetative and tasseling stages.',
        desc_kn: 'ವಿಶ್ವಸಂಸ್ಥೆಯ ಎಫ್‌ಎಒ ಜಾಗತಿಕ ನೀರಾವರಿ ಹಾಗೂ ಬೆಳೆ ಬೆಳವಣಿಗೆಯ ಮಾನದಂಡಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/maize_stage1_sowing.jpg',
        name_en: 'Stage 1 — Germination & Seedling Emergence',
        name_kn: 'ಹಂತ 1 — ಮೊಳಕೆ ಮತ್ತು ಸಸಿ ಹಂತ (VE–V3)',
        duration_en: 'Approx. 10–15 days (Days 1–15)',
        duration_kn: 'ಸುಮಾರು 10–15 ದಿನಗಳು (1 ರಿಂದ 15 ದಿನಗಳು)',
        what_happens_en: 'Seed absorbs soil moisture, coleoptile pushes through soil, and the first 2–4 broad true leaves expand.',
        what_happens_kn: 'ಬೀಜ ಮೊಳಕೆಯೊಡೆದು ಸಸಿ ಮೇಲಕ್ಕೆ ಬರುತ್ತದೆ ಮತ್ತು ಮೊದಲ 2–4 ಅಗಲವಾದ ಎಲೆಗಳು ಹರಡಿಕೊಳ್ಳುತ್ತವೆ.',
        farmer_tip_en: 'Sow at 60×20 cm spacing and 4–5 cm depth. Scout for early Fall Armyworm pinholes on whorl leaves; apply neem-based spray.',
        farmer_tip_kn: '60×20 ಸೆಂ.ಮೀ ಅಂತರದಲ್ಲಿ 4-5 ಸೆಂ.ಮೀ ಆಳಕ್ಕೆ ಬಿತ್ತನೆ ಮಾಡಿ. ಸೈನಿಕ ಹುಳು ತಡೆಗಟ್ಟಲು ಮೊಳಕೆ ಹಂತದಲ್ಲೇ ಬೇವಿನ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಿ.'
      },
      {
        photo: 'public/images/stages/maize_stage2_veg.jpg',
        name_en: 'Stage 2 — Rapid Vegetative Growth (Knee-High)',
        name_kn: 'ಹಂತ 2 — ಕಾಯಿಕ ಬೆಳವಣಿಗೆ (ಮೊಣಕಾಲು ಎತ್ತರ V4–V12)',
        duration_en: 'Approx. 30–35 days (Days 16–50)',
        duration_kn: 'ಸುಮಾರು 30–35 ದಿನಗಳು (16 ರಿಂದ 50 ದಿನಗಳು)',
        what_happens_en: 'Stalk thickens rapidly, brace roots anchor the plant, and embryonic tassel differentiates inside the whorl.',
        what_happens_kn: 'ಕಾಂಡ ವೇಗವಾಗಿ ದಪ್ಪಗಾಗಿ ಬೆಳೆಯುತ್ತದೆ, ಊರುಗೋಲು ಬೇರುಗಳು ಗಟ್ಟಿಯಾಗಿ ಹಿಡಿದುಕೊಳ್ಳುತ್ತವೆ ಮತ್ತು ಒಳಗೆ ತೆನೆ ರೂಪುಗೊಳ್ಳುತ್ತದೆ.',
        farmer_tip_en: 'Apply top-dressing nitrogen (urea) at knee-high stage (30 days) followed by earthing-up. Keep field weed-free during this critical period.',
        farmer_tip_kn: 'ಬಿತ್ತನೆಯ 30ನೇ ದಿನಕ್ಕೆ ಮೇಲುಗೊಬ್ಬರವಾಗಿ ಯೂರಿಯಾ ನೀಡಿ ಸಾಲುಗಳಿಗೆ ಮಣ್ಣು ಏರಿಸಿ. ಕಳೆಗಳನ್ನು ನಿಯಂತ್ರಿಸಿ.'
      },
      {
        photo: 'public/images/stages/maize_stage3_tassel.jpg',
        name_en: 'Stage 3 — Tasseling & Silking Stage',
        name_kn: 'ಹಂತ 3 — ಜೊಂಡು ಮತ್ತು ರೇಷ್ಮೆ ಹಂತ (VT–R1)',
        duration_en: 'Approx. 12–16 days (Days 51–66)',
        duration_kn: 'ಸುಮಾರು 12–16 ದಿನಗಳು (51 ರಿಂದ 66 ದಿನಗಳು)',
        what_happens_en: 'Terminal tassel sheds millions of pollen grains; silky sticky threads emerge from the ear shoot to receive pollen.',
        what_happens_kn: 'ತುದಿಯಲ್ಲಿ ಜೊಂಡು ಅರಳಿ ಪರಾಗ ಚೆಲ್ಲುತ್ತದೆ ಮತ್ತು ಕೆಳಗಿನ ತೆನೆಯಿಂದ ರೇಷ್ಮೆ ಎಳೆಗಳು ಹೊರಬಂದು ಗರ್ಭಧಾರಣೆ ನಡೆಯುತ್ತದೆ.',
        farmer_tip_en: 'Highest water sensitivity stage. Soil moisture deficit during silking causes barren cobs and severe yield reduction; irrigate on priority.',
        farmer_tip_kn: 'ಅತ್ಯಂತ ಸೂಕ್ಷ್ಮ ಹಂತ. ಈ ಸಮಯದಲ್ಲಿ ನೀರಿನ ಕೊರತೆಯಾದರೆ ತೆನೆಯಲ್ಲಿ ಕಾಳು ಕಟ್ಟುವುದಿಲ್ಲ; ಕಡ್ಡಾಯವಾಗಿ ನೀರು ಹಾಯಿಸಿ.'
      },
      {
        photo: 'public/images/stages/maize_stage4_cob.jpg',
        name_en: 'Stage 4 — Cob Development & Grain Filling',
        name_kn: 'ಹಂತ 4 — ತೆನೆ ವಿಕಾಸ ಮತ್ತು ಕಾಳು ತುಂಬುವಿಕೆ (R2–R4)',
        duration_en: 'Approx. 25–30 days (Days 67–95)',
        duration_kn: 'ಸುಮಾರು 25–30 ದಿನಗಳು (67 ರಿಂದ 95 ದಿನಗಳು)',
        what_happens_en: 'Fertilized kernels swell rapidly with nutrients, advancing from clear blister fluid to sweet milk and firm starch dough.',
        what_happens_kn: 'ತೆನೆಯಲ್ಲಿ ಕಾಳುಗಳು ಹಾಲಿನಂತಿದ್ದು ಕ್ರಮೇಣ ಗಟ್ಟಿಯಾದ ಹಿಟ್ಟಿನ ರೂಪಕ್ಕೆ ಬದಲಾಗಿ ದಪ್ಪಗಾಗುತ್ತವೆ.',
        farmer_tip_en: 'Maintain regular irrigation intervals until dough stage. Protect developing cobs against bird and wild boar intrusion.',
        farmer_tip_kn: 'ಕಾಳು ಗಟ್ಟಿಯಾಗುವವರೆಗೆ ತೇವಾಂಶ ಕಾಪಾಡಿಕೊಳ್ಳಿ. ಹಕ್ಕಿಗಳು ಮತ್ತು ಕೀಟಗಳಿಂದ ತೆನೆಗಳನ್ನು ರಕ್ಷಿಸಲು ನಿಗಾವಹಿಸಿ.'
      },
      {
        photo: 'public/images/stages/maize_stage5_harvest.jpg',
        name_en: 'Stage 5 — Black Layer Maturity & Harvest',
        name_kn: 'ಹಂತ 5 — ಪಕ್ವತೆ ಮತ್ತು ಕಟಾವು (R5–R6)',
        duration_en: 'Approx. 15–20 days (Days 96–115)',
        duration_kn: 'ಸುಮಾರು 15–20 ದಿನಗಳು (96 ರಿಂದ 115 ದಿನಗಳು)',
        what_happens_en: 'Black abscission layer forms at kernel tips signaling maturity; outer protective husks dry to light straw-brown.',
        what_happens_kn: 'ಕಾಳುಗಳ ಬುಡದಲ್ಲಿ ಕಪ್ಪು ಪದರ ಉಂಟಾಗಿ, ತೆನೆಯ ಹೊರ ಹೊದಿಕೆ ಒಣಗಿ ಒಣಹುಲ್ಲಿನ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಕಟಾವಿಗೆ ಸಿದ್ಧವಾಗುತ್ತದೆ.',
        farmer_tip_en: 'Harvest when husks turn completely brown and dry. Shell cobs and sun-dry grain to 12% moisture before bagging or Mandi sale.',
        farmer_tip_kn: 'ಹೊದಿಕೆ ಸಂಪೂರ್ಣ ಒಣಗಿದಾಗ ಕೊಯ್ಲು ಮಾಡಿ. ಕಾಳುಗಳನ್ನು ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿ ಶೇ. 12 ಕ್ಕಿಂತ ಕಡಿಮೆ ತೇವಾಂಶದಲ್ಲಿ ಶೇಖರಿಸಿ.'
      }
    ]
  },
  tomato: {
    id: 'tomato',
    name_en: 'Tomato',
    name_kn: 'ಟೊಮೇಟೊ (Tomato)',
    photo: 'public/images/crops/tomato.jpg',
    desc_en: 'High-value commercial horticultural crop cultivated in open fields and protected polyhouses. Total duration spans approx. 100 to 135 days (approx. 25 days nursery + 75 to 110 days field harvest).',
    desc_kn: 'ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ವಾಣಿಜ್ಯ ತರಕಾರಿ ಬೆಳೆ. ನರ್ಸರಿಯ 25 ದಿನಗಳು ಸೇರಿದಂತೆ ಒಟ್ಟು ಅವಧಿ ಸುಮಾರು 100 ರಿಂದ 135 ದಿನಗಳವರೆಗೆ ಇರುತ್ತದೆ (ಉದಾ: ಅರ್ಕ ರಕ್ಷಕ್, ಶಿವಂ).',
    official_references: [
      {
        title_en: 'ICAR-KVK Hirehalli — Package of Practices (Horticultural Crops)',
        title_kn: 'ಐಸಿಎಆರ್-ಕೆವಿಕೆ ಹಿರೇಹಳ್ಳಿ — ತೋಟಗಾರಿಕಾ ಬೆಳೆಗಳ ಬೇಸಾಯ ಪದ್ಧತಿ',
        url: 'https://iihrkvk.org/package-of-practices/',
        desc_en: 'Official package of practices for tomato cultivation, disease control, and trellising in Karnataka.',
        desc_kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಟೊಮೇಟೊ ನಾಟಿ, ರೋಗ ನಿಯಂತ್ರಣ ಹಾಗೂ ತಂತಿಕಂಬ ಕೃಷಿಯ ಅಧಿಕೃತ ಶಿಫಾರಸುಗಳು.'
      },
      {
        title_en: 'ICAR — Indian Institute of Horticultural Research (IIHR) Bengaluru',
        title_kn: 'ಐಸಿಎಆರ್ — ಭಾರತೀಯ ತೋಟಗಾರಿಕಾ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ (ಐಐಹೆಚ್‌ಆರ್)',
        url: 'https://icar.gov.in/',
        desc_en: 'Pioneer research on disease-resistant tomato hybrids (Arka Rakshak, Arka Abhed) and integrated pest management.',
        desc_kn: 'ರೋಗ ನಿರೋಧಕ ಟೊಮೇಟೊ ತಳಿಗಳ ಸಂಶೋಧನೆ ಮತ್ತು ಕೀಟ ನಿರ್ವಹಣಾ ಸಲಹೆಗಳು.'
      },
      {
        title_en: 'FAO — Vegetable Crop Growth Stages & Irrigation Criteria',
        title_kn: 'ಎಫ್‌ಎಒ — ತರಕಾರಿ ಬೆಳೆಗಳ ಬೆಳವಣಿಗೆಯ ಹಂತಗಳು ಮತ್ತು ನೀರಾವರಿ ಮಾರ್ಗಸೂಚಿ',
        url: 'https://www.fao.org/4/s2022e/s2022e07.htm',
        desc_en: 'International standard guidelines for vegetable evapotranspiration and critical growth stages.',
        desc_kn: 'ವಿಶ್ವಸಂಸ್ಥೆಯ ಎಫ್‌ಎಒ ತರಕಾರಿ ಬೆಳೆಗಳ ನೀರಿನ ನಿರ್ವಹಣಾ ಮಾನದಂಡಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/tomato_stage1_nursery.jpg',
        name_en: 'Stage 1 — Pro-Tray Nursery & Seedling',
        name_kn: 'ಹಂತ 1 — ಪ್ರೊ-ಟ್ರೇ ನರ್ಸರಿ ಮತ್ತು ಸಸಿ ಮಡಿ',
        duration_en: 'Approx. 22–28 days (Days 1–25)',
        duration_kn: 'ಸುಮಾರು 22–28 ದಿನಗಳು (1 ರಿಂದ 25 ದಿನಗಳು)',
        what_happens_en: 'Seeds sprout in protected shade-net pro-trays in sterilized cocopeat, developing sturdy seedlings with 4–5 true leaves.',
        what_happens_kn: 'ಪ್ರೊ-ಟ್ರೇಗಳಲ್ಲಿ ಕೊಕೊಪೀಟ್ ಮಾಧ್ಯಮದಲ್ಲಿ ಬೀಜಗಳು ಮೊಳಕೆಯೊಡೆದು 4-5 ಬಲಿತ ಎಲೆಗಳುಳ್ಳ ಗಟ್ಟಿ ಸಸಿಗಳಾಗಿ ಬೆಳೆಯುತ್ತವೆ.',
        farmer_tip_en: 'Drench seedlings with Trichoderma or Pseudomonas 3 days before transplanting to prevent root rot and damping-off.',
        farmer_tip_kn: 'ನಾಟಿಗೆ 3 ದಿನ ಮುಂಚೆ ಸಸಿಗಳಿಗೆ ಟ್ರೈಕೋಡರ್ಮ ಅಥವಾ ಸೂಡೋಮೊನಾಸ್ ದ್ರಾವಣ ಕೊಡಿ. ನೆರಳಿನಿಂದ ಹೊರಗಿಟ್ಟು ಸಸಿಗಳನ್ನು ಗಟ್ಟಿಗೊಳಿಸಿ.'
      },
      {
        photo: 'public/images/stages/tomato_stage2_transplant.jpg',
        name_en: 'Stage 2 — Main Field Establishment & Staking',
        name_kn: 'ಹಂತ 2 — ನಾಟಿ, ಬೇರೂರುವಿಕೆ ಮತ್ತು ಆಸರೆ ಕಟ್ಟುವುದು',
        duration_en: 'Approx. 25–30 days after transplanting (Days 26–55)',
        duration_kn: 'ಸುಮಾರು 25–30 ದಿನಗಳು (26 ರಿಂದ 55 ದಿನಗಳು)',
        what_happens_en: 'Seedlings anchor deep roots in raised beds with silver-black mulch; vines elongate with robust lateral branches.',
        what_happens_kn: 'ಏರುಮಡಿಗಳಲ್ಲಿ ಸಸಿಗಳು ಬೇರೂರಿ, ಬಲವಾದ ಮುಖ್ಯ ಕಾಂಡ ಮತ್ತು ಪಕ್ಕದ ಸಮೃದ್ಧ ರೆಂಬೆಗಳನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳುತ್ತವೆ.',
        farmer_tip_en: 'Stake plants with bamboo poles and trellising twine to keep fruit off wet soil. Fertigate with 19:19:19 water-soluble fertilizer.',
        farmer_tip_kn: 'ಗಿಡಗಳು ನೆಲಕ್ಕೆ ತಾಗದಂತೆ ಬಿದಿರಿನ ಕಡ್ಡಿ ಅಥವಾ ತಂತಿಯ ಆಸರೆ ಕಟ್ಟಿ. ಹನಿ ನೀರಾವರಿ ಮೂಲಕ ಸಮತೋಲಿತ ರಸಗೊಬ್ಬರ ನೀಡಿ.'
      },
      {
        photo: 'public/images/stages/tomato_stage4_flower.jpg',
        name_en: 'Stage 3 — Flowering & Fruit Setting',
        name_kn: 'ಹಂತ 3 — ಹೂಬಿಡುವಿಕೆ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವುದು',
        duration_en: 'Approx. 18–25 days (Days 56–75)',
        duration_kn: 'ಸುಮಾರು 18–25 ದಿನಗಳು (56 ರಿಂದ 75 ದಿನಗಳು)',
        what_happens_en: 'Yellow flower cymes open; buzz pollination and natural breezes prompt ovary fertilization to form marble-sized green fruits.',
        what_happens_kn: 'ಹಳದಿ ಹೂವುಗಳ ಗೊಂಚಲುಗಳು ಅರಳಿ, ಪರಾಗಸ್ಪರ್ಶದ ನಂತರ ಸಣ್ಣ ನೆಲ್ಲಿಕಾಯಿ ಗಾತ್ರದ ಹಸಿರು ಕಾಯಿಗಳು ಕಟ್ಟಲಾರಂಭಿಸುತ್ತವೆ.',
        farmer_tip_en: 'Foliar spray Boron 20% (1 g/L) to prevent flower drop and improve fruit set. Scout for whitefly vectors to prevent leaf curl virus.',
        farmer_tip_kn: 'ಹೂವು ಉದುರುವುದನ್ನು ತಡೆಯಲು ಬೋರಾನ್ ಸಿಂಪಡಿಸಿ. ಎಲೆ ಮುದುರು ರೋಗ ಹರಡುವ ಬಿಳಿನೊಣಗಳ ನಿಯಂತ್ರಣಕ್ಕೆ ಹಳದಿ ಜಿಗುಟು ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ.'
      },
      {
        photo: 'public/images/stages/tomato_stage3_veg.jpg',
        name_en: 'Stage 4 — Fruit Development & Sizing',
        name_kn: 'ಹಂತ 4 — ಕಾಯಿ ಬೆಳವಣಿಗೆ ಮತ್ತು ಗಾತ್ರ ಹೆಚ್ಚಳ',
        duration_en: 'Approx. 20–28 days (Days 76–100)',
        duration_kn: 'ಸುಮಾರು 20–28 ದಿನಗಳು (76 ರಿಂದ 100 ದಿನಗಳು)',
        what_happens_en: 'Green fruits expand rapidly in cell volume, accumulating lycopene precursors and sugars while skins remain glossy green.',
        what_happens_kn: 'ಕಾಯಿಗಳು ಪೂರ್ಣ ಪ್ರಮಾಣದ ಗಾತ್ರಕ್ಕೆ ಬೆಳೆಯುತ್ತವೆ ಮತ್ತು ನಯವಾದ ಹೊಳಪುಳ್ಳ ಹಸಿರು ಬಣ್ಣದಲ್ಲಿರುತ್ತವೆ.',
        farmer_tip_en: 'Apply Calcium Nitrate via fertigation to prevent Blossom End Rot (black sunken patch at fruit base). Maintain steady moisture.',
        farmer_tip_kn: 'ಕಾಯಿಯ ತಳ ಕೊಳೆಯುವುದನ್ನು (ಬ್ಲಾಸಮ್ ಎಂಡ್ ರಾಟ್) ತಡೆಯಲು ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್ ಒದಗಿಸಿ. ನೀರಾವರಿಯಲ್ಲಿ ವ್ಯತ್ಯಾಸವಾಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.'
      },
      {
        photo: 'public/images/stages/tomato_stage5_harvest.jpg',
        name_en: 'Stage 5 — Breaker Stage to Red Ripe Harvest',
        name_kn: 'ಹಂತ 5 — ಕಾಯಿ ಬಲಿಯುವಿಕೆ ಮತ್ತು ಹಂತಹಂತದ ಕೊಯ್ಲು',
        duration_en: 'Approx. 25–40 days across sequential pickings (Days 101–135)',
        duration_kn: 'ಸುಮಾರು 25–40 ದಿನಗಳ ಕಾಲ 6-8 ಕೊಯ್ಲುಗಳು (101 ರಿಂದ 135 ದಿನಗಳು)',
        what_happens_en: 'Fruits mature from green to breaker stage (slight pink at blossom end) and uniform bright red as carotenoids peak.',
        what_happens_kn: 'ಕಾಯಿಗಳು ಕೆಂಪು ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತವೆ. ವಾರಕ್ಕೆ 2 ಬಾರಿ ನಿಯಮಿತವಾಗಿ ಕಟಾವು ಮಾಡಲಾಗುತ್ತದೆ.',
        farmer_tip_en: 'Harvest at breaker/turning stage for long-distance transport to Mandi. Pick during morning hours with stems attached.',
        farmer_tip_kn: 'ದೂರದ ಮಾರುಕಟ್ಟೆಗೆ ಕಳುಹಿಸಲು ಕಾಯಿ ತಿಳಿ ಗುಲಾಬಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ (ಬ್ರೇಕರ್ ಹಂತ) ತೊಟ್ಟು ಸಮೇತ ಕೊಯ್ಲು ಮಾಡಿ.'
      }
    ]
  },
  arecanut: {
    id: 'arecanut',
    name_en: 'Arecanut (Betel Nut Palm)',
    name_kn: 'ಅಡಿಕೆ (Betel Nut Palm)',
    photo: 'public/images/crops/arecanut.jpg',
    desc_en: 'High-value PERENNIAL plantation palm with a productive lifespan of 35 to 45+ years. Unlike annual crops, it requires 5 to 7 years to begin bearing and follows an annual reproductive cycle on mature palms (Reference: ICAR-CPCRI / ICAR-KVK Hirehalli).',
    desc_kn: 'ಮಲೆನಾಡು ಮತ್ತು ಕರಾವಳಿಯ ಪ್ರಮುಖ ಬಹುವಾರ್ಷಿಕ ತೋಟಗಾರಿಕಾ ಬೆಳೆ (ಆಯಸ್ಸು 35 ರಿಂದ 45+ ವರ್ಷಗಳು). ವಾರ್ಷಿಕ ಬೆಳೆಗಳಂತಲ್ಲದೆ, ಇದು ಆದಾಯ ನೀಡಲು 5-7 ವರ್ಷಗಳ ದೀರ್ಘಾವಧಿ ಬೇಡುತ್ತದೆ (ಆಧಾರ: ಐಸಿಎಆರ್-ಸಿಪಿಸಿಆರ್‌ಐ).',
    official_references: [
      {
        title_en: 'ICAR-KVK Hirehalli — Horticultural Package of Practices (Arecanut)',
        title_kn: 'ಐಸಿಎಆರ್-ಕೆವಿಕೆ ಹಿರೇಹಳ್ಳಿ — ಅಡಿಕೆ ಬೆಳೆಯ ಸಮಗ್ರ ಬೇಸಾಯ ಪದ್ಧತಿ',
        url: 'https://iihrkvk.org/package-of-practices/',
        desc_en: 'Official field manual for arecanut plantation management, Bordeaux spray protocols, and nutrient schedules.',
        desc_kn: 'ಅಡಿಕೆ ತೋಟ ನಿರ್ವಹಣೆ, ಬೋರ್ಡೋ ಸಿಂಪಡಣೆ ಹಾಗೂ ರಸಗೊಬ್ಬರ ವೇಳಾಪಟ್ಟಿಯ ಅಧಿಕೃತ ಕೈಪಿಡಿ.'
      },
      {
        title_en: 'ICAR — Central Plantation Crops Research Institute (CPCRI)',
        title_kn: 'ಐಸಿಎಆರ್ — ಕೇಂದ್ರೀಯ ತೋಟದ ಬೆಳೆಗಳ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ (ಸಿಪಿಸಿಆರ್‌ಐ)',
        url: 'https://icar.gov.in/',
        desc_en: 'National authority on arecanut breeding (Mangala, Sumangala, Mohitnagar), Koleroga disease, and drip fertigation.',
        desc_kn: 'ಅಡಿಕೆ ತಳಿ ಸುಧಾರಣೆ, ಕೊಳೆರೋಗ ಸಂಶೋಧನೆ ಮತ್ತು ಹನಿ ನೀರಾವರಿ ಮಾರ್ಗಸೂಚಿಗಳು.'
      },
      {
        title_en: 'UAS Bengaluru & KSNUAHS Shivamogga — Plantation Research',
        title_kn: 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು ಮತ್ತು ಕೆಎಸ್‌ಎನ್‌ಯುಎಹೆಚ್‌ಎಸ್ ಶಿವಮೊಗ್ಗ',
        url: 'https://www.uasbangalore.edu.in/',
        desc_en: 'Karnataka agro-climatic plantation research, basin mulching, and intercropping models.',
        desc_kn: 'ಕರ್ನಾಟಕದ ಮಲೆನಾಡು ಹಾಗೂ ಬಯಲುಸೀಮೆ ಅಡಿಕೆ ತೋಟಗಳ ಅಂತರಬೆಳೆ ಹಾಗೂ ಸಂಶೋಧನೆಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/arecanut_stage1_summer.jpg',
        name_en: 'Stage 1 — Nursery & Polybag Seedling Phase',
        name_kn: 'ಹಂತ 1 — ನರ್ಸರಿ ಮತ್ತು ಸಸಿ ಮಡಿ ಹಂತ (ಬಹುವಾರ್ಷಿಕ ಆರಂಭ)',
        duration_en: 'Approx. 12–18 months in nursery',
        duration_kn: 'ನರ್ಸರಿಯಲ್ಲಿ ಸುಮಾರು 12–18 ತಿಂಗಳುಗಳು',
        what_happens_en: 'Selected mother nuts sprout in sand beds; transferred to polybags with potting soil under 50% shade until 5–6 dark green leaves form.',
        what_happens_kn: 'ಆಯ್ದ ಬೀಜದ ಅಡಿಕೆಯನ್ನು ಮರಳಿನಲ್ಲಿ ಮೊಳಕೆ ಬರಿಸಿ, ಪಾಲಿಬ್ಯಾಗ್‌ಗಳಲ್ಲಿ 5-6 ದಟ್ಟ ಹಸಿರು ಎಲೆಗಳು ಬರುವವರೆಗೆ ನೆರಳಿನಲ್ಲಿ ಪೋಷಿಸಲಾಗುತ್ತದೆ.',
        farmer_tip_en: 'Select 12–18 month old vigorous seedlings with maximum collar girth and short internodes. Avoid thin, tall, leggy seedlings.',
        farmer_tip_kn: 'ದಪ್ಪ ಬುಡ ಮತ್ತು ಹತ್ತಿರದ ಗಣ್ಣುಗಳಿರುವ 12-18 ತಿಂಗಳ ಬಲಿತ ಸಸಿಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ಸಪೂರಾದ ಉದ್ದನೆಯ ಸಸಿಗಳನ್ನು ತ್ಯಜಿಸಿ.'
      },
      {
        photo: 'public/images/stages/arecanut_stage2_premonsoon.jpg',
        name_en: 'Stage 2 — Young Palm Establishment (Non-Bearing)',
        name_kn: 'ಹಂತ 2 — ತೋಟದಲ್ಲಿ ನಾಟಿ ಮತ್ತು ಸಸಿ ಬೆಳೆಸುವ ಹಂತ (1 ರಿಂದ 4 ವರ್ಷಗಳು)',
        duration_en: 'Approx. 1 to 4 years after planting in field',
        duration_kn: 'ನಾಟಿ ಮಾಡಿದ 1 ರಿಂದ 4 ವರ್ಷಗಳವರೆಗೆ',
        what_happens_en: 'Seedlings planted in 90×90×90 cm pits spaced 2.7×2.7 m. Palm expands green crown, thickens trunk, and anchors deep adventitious roots.',
        what_happens_kn: '2.7×2.7 ಮೀ ಅಂತರದಲ್ಲಿ 3 ಅಡಿ ಗುಂಡಿಗಳಲ್ಲಿ ನಾಟಿ ಮಾಡಿದ ಸಸಿಗಳು ಕಾಂಡವನ್ನು ಗಟ್ಟಿಗೊಳಿಸಿ ವಿಸ್ತಾರವಾದ ಬೇರುಗಳನ್ನು ಹರಡುತ್ತವೆ.',
        farmer_tip_en: 'Grow shade crops (banana) to prevent sun-scorch on south-west trunk sides. Mulch basins with green leaves to conserve moisture.',
        farmer_tip_kn: 'ಎಳೆಯ ಕಾಂಡಕ್ಕೆ ಬಿಸಿಲು ತಾಗದಂತೆ ಬಾಳೆ ಅಂತರಬೆಳೆ ಬೆಳೆಸಿ. ಬೇಸಿಗೆಯಲ್ಲಿ ಬುಡಕ್ಕೆ ಹಸಿರೆಲೆ ಹೊದಿಕೆ ಹಾಕಿ ಹನಿ ನೀರಾವರಿ ಒದಗಿಸಿ.'
      },
      {
        photo: 'public/images/stages/arecanut_stage4_fertilizer.jpg',
        name_en: 'Stage 3 — Inflorescence Initiation & First Bearing',
        name_kn: 'ಹಂತ 3 — ಹಿಂಗಾರ ಮೂಡುವುದು ಮತ್ತು ಆರಂಭಿಕ ಇಳುವರಿ (5 ರಿಂದ 7 ವರ್ಷಗಳು)',
        duration_en: 'Palm age approx. 5 to 7 years onwards',
        duration_kn: 'ಗಿಡಕ್ಕೆ ಸುಮಾರು 5 ರಿಂದ 7 ವರ್ಷ ವಯಸ್ಸಾದಾಗ',
        what_happens_en: 'Palm reaches reproductive maturity; spathes emerge from leaf sheaths and burst open to reveal male and female florets.',
        what_happens_kn: 'ಮರವು ಪ್ರೌಢಾವಸ್ಥೆಗೆ ತಲುಪಿ, ಎಲೆಗಳ ಕಂಕುಳಿನಿಂದ ಹಿಂಗಾರ ಹೊರಬಂದು ಅರಳಿ ಹೂವುಗಳು ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.',
        farmer_tip_en: 'Apply full adult fertilizer dose per palm: 100g N, 40g P2O5, 140g K2O + 12kg FYM in two splits (post-monsoon & pre-monsoon).',
        farmer_tip_kn: 'ಪ್ರತಿ ಮರಕ್ಕೆ ವಾರ್ಷಿಕ 100 ಗ್ರಾಂ ಸಾರಜನಕ, 40 ಗ್ರಾಂ ರಂಜಕ, 140 ಗ್ರಾಂ ಪೊಟ್ಯಾಷ್ ಮತ್ತು 12 ಕೆಜಿ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರವನ್ನು ಎರಡು ಕಂತುಗಳಲ್ಲಿ ನೀಡಿ.'
      },
      {
        photo: 'public/images/stages/arecanut_stage3_monsoon.jpg',
        name_en: 'Stage 4 — Annual Bunch Growth & Monsoon Protection',
        name_kn: 'ಹಂತ 4 — ವಾರ್ಷಿಕ ಗೊನೆ ಬೆಳವಣಿಗೆ ಮತ್ತು ಕೊಳೆರೋಗ ರಕ್ಷಣೆ (ವಾರ್ಷಿಕ ಚಕ್ರ)',
        duration_en: 'Approx. 8–9 months per annual bearing cycle (May to October)',
        duration_kn: 'ವಾರ್ಷಿಕ ಚಕ್ರದಲ್ಲಿ ಸುಮಾರು 8–9 ತಿಂಗಳುಗಳು (ಮೇ ನಿಂದ ಅಕ್ಟೋಬರ್)',
        what_happens_en: 'Fertilized button nuts swell into dense green bunches; heavy monsoons introduce critical risk of fruit rot (Koleroga / Mahali).',
        what_happens_kn: 'ಕಾಯಿ ಕಟ್ಟಿದ ನಂತರ ಗೊನೆಗಳು ದಪ್ಪಗಾಗುತ್ತವೆ; ಭಾರಿ ಮಳೆಗಾಲದಲ್ಲಿ ಕೊಳೆರೋಗದ (ಫೈಟೋಪ್ತೊರಾ) ತೀವ್ರ ಅಪಾಯವಿರುತ್ತದೆ.',
        farmer_tip_en: 'Spray 1% Bordeaux mixture on all bunches before monsoon onset (late May) and repeat 40 days later. Cover bunches with polybags.',
        farmer_tip_kn: 'ಮುಂಗಾರು ಮಳೆ ಆರಂಭಕ್ಕೂ ಮುನ್ನ (ಮೇ ಅಂತ್ಯದಲ್ಲಿ) ಗೊನೆಗಳಿಗೆ ಶೇ. 1 ರ ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ; ಅತಿಯಾದ ಮಳೆ ಇರುವಲ್ಲಿ ಪಾಲಿಥಿನ್ ಕವರ್ ಕಟ್ಟಿ.'
      },
      {
        photo: 'public/images/stages/arecanut_stage5_harvest.jpg',
        name_en: 'Stage 5 — Bunch Maturity & Harvest / Curing',
        name_kn: 'ಹಂತ 5 — ಗೊನೆ ಪಕ್ವತೆ, ಕಟಾವು ಮತ್ತು ಸಂಸ್ಕರಣೆ (ವಾರ್ಷಿಕ ಚಕ್ರ)',
        duration_en: 'Approx. 2–3 months seasonal window (November to February)',
        duration_kn: 'ಸುಮಾರು 2–3 ತಿಂಗಳುಗಳ ಕೊಯ್ಲಿನ ಅವಧಿ (ನವೆಂಬರ್‌ನಿಂದ ಫೆಬ್ರವರಿ)',
        what_happens_en: 'Bunches ripen from green to bright orange-red; harvested either as tender nuts for boiled Chali/Bette or fully ripe for dried Chali.',
        what_happens_kn: 'ಅಡಿಕೆ ಗೊನೆಗಳು ಬಲಿತು ಹಳದಿ-ಕಿತ್ತಳೆ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತವೆ. ಹಸಿಯಡಿಕೆ ಅಥವಾ ಕೆಂಪಡಿಕೆ/ಚಾಲಿಗಾಗಿ ನುರಿತ ಕಾರ್ಮಿಕರಿಂದ ಕೊಯ್ಲು ಮಾಡಲಾಗುತ್ತದೆ.',
        farmer_tip_en: 'De-husk tender nuts immediately and boil with kalchappe for red bette; for chali, sun-dry unhusked ripe nuts for 40 days on clean tarpaulins.',
        farmer_tip_kn: 'ಚಾಲಿಗೆ ಪೂರ್ಣ ಬಲಿತ ಅಡಿಕೆಯನ್ನು 40-45 ದಿನ ಬಿಸಿಲಿನಲ್ಲಿ ಚೆನ್ನಾಗಿ ಒಣಗಿಸಿ. ಶಿಲೀಂಧ್ರ ಬಾರದಂತೆ ಎಚ್ಚರವಹಿಸಿ ಮಾರುಕಟ್ಟೆಗೆ ಸಾಗಿಸಿ.'
      }
    ]
  },
  cotton: {
    id: 'cotton',
    name_en: 'Cotton',
    name_kn: 'ಹತ್ತಿ (Cotton)',
    photo: 'public/images/crops/cotton.jpg',
    desc_en: 'Premier commercial cash fiber crop cultivated extensively in black cotton soils. Annual crop duration spans approx. 140 to 170 days depending on hybrid maturity (e.g. DCH-32, Bt Cotton Hybrids).',
    desc_kn: 'ಕರ್ನಾಟಕದ ಕಪ್ಪು ಮಣ್ಣಿನ ಪ್ರಮುಖ ವಾಣಿಜ್ಯ ನಾರಿನ ಬೆಳೆ. ಹೈಬ್ರಿಡ್ ತಳಿಗಳ ಪ್ರಕಾರ ಈ ವಾರ್ಷಿಕ ಬೆಳೆಯ ಒಟ್ಟು ಅವಧಿ ಸುಮಾರು 140 ರಿಂದ 170 ದಿನಗಳು (ಉದಾ: ಡಿಸಿಹೆಚ್-32, ಬಿಟಿ ಹತ್ತಿ).',
    official_references: [
      {
        title_en: 'ICAR — Central Institute for Cotton Research (CICR) Nagpur',
        title_kn: 'ಐಸಿಎಆರ್ — ಕೇಂದ್ರೀಯ ಹತ್ತಿ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ (ಸಿಐಸಿಆರ್)',
        url: 'https://icar.gov.in/',
        desc_en: 'National cotton research, pink bollworm advisories, and fiber quality benchmarks.',
        desc_kn: 'ಹತ್ತಿ ತಳಿಗಳ ಸಂಶೋಧನೆ, ಗುಲಾಬಿ ಕಾಯಿಕೊರೆಯುವ ಹುಳು ನಿರ್ವಹಣೆ ಹಾಗೂ ನಾರಿನ ಗುಣಮಟ್ಟದ ಮಾನದಂಡಗಳು.'
      },
      {
        title_en: 'UAS Dharwad & UAS Bengaluru — Package of Practices (Cotton)',
        title_kn: 'ಯುಎಎಸ್ ಧಾರವಾಡ ಮತ್ತು ಬೆಂಗಳೂರು — ಹತ್ತಿ ಬೇಸಾಯ ಕ್ರಮಗಳು',
        url: 'https://www.uasbangalore.edu.in/',
        desc_en: 'Recommended agronomic practices, spacing, and integrated pest management for Karnataka cotton farmers.',
        desc_kn: 'ಕರ್ನಾಟಕದ ಹತ್ತಿ ಬೆಳೆಗಾರರಿಗೆ ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ ಹಾಗೂ ಗೊಬ್ಬರ ಶಿಫಾರಸುಗಳ ಅಧಿಕೃತ ಮಾರ್ಗದರ್ಶಿ.'
      },
      {
        title_en: 'FAO — Cotton Growth Stages & Water Management Guidelines',
        title_kn: 'ಎಫ್‌ಎಒ — ಹತ್ತಿ ಬೆಳೆಯ ಹಂತಗಳು ಮತ್ತು ನೀರಾವರಿ ಮಾರ್ಗಸೂಚಿ',
        url: 'https://www.fao.org/4/s2022e/s2022e07.htm',
        desc_en: 'United Nations FAO guidelines on cotton crop evapotranspiration and critical flowering water needs.',
        desc_kn: 'ವಿಶ್ವಸಂಸ್ಥೆಯ ಎಫ್‌ಎಒ ಹತ್ತಿ ಬೆಳೆಯ ನೀರಿನ ಅಗತ್ಯತೆ ಮತ್ತು ಹಂತವಾರು ನಿರ್ವಹಣಾ ಮಾನದಂಡಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/cotton_stage1_emergence.jpg',
        name_en: 'Stage 1 — Germination & Seedling Emergence',
        name_kn: 'ಹಂತ 1 — ಮೊಳಕೆ ಮತ್ತು ಸಸಿ ಹಂತ',
        duration_en: 'Approx. 15–20 days (Days 1–20)',
        duration_kn: 'ಸುಮಾರು 15–20 ದಿನಗಳು (1 ರಿಂದ 20 ದಿನಗಳು)',
        what_happens_en: 'Acid-delinted seeds absorb moisture, taproot drives deep into soil, and kidney-shaped cotyledons unfold above ground.',
        what_happens_kn: 'ಬೀಜ ಮೊಳಕೆಯೊಡೆದು ತಾಯಿಬೇರು ಆಳಕ್ಕೆ ಇಳಿಯುತ್ತದೆ ಮತ್ತು ಮೊದಲ ಎರಡು ದಳದ ಎಲೆಗಳು ಮಣ್ಣಿನಿಂದ ಹೊರಬರುತ್ತವೆ.',
        farmer_tip_en: 'Gap-fill within 10 days of sowing to ensure optimal plant stand. Treat seeds with imidacloprid to protect from early sucking pests.',
        farmer_tip_kn: '10 ದಿನಗಳೊಳಗೆ ಸಸಿ ಇಲ್ಲದ ಜಾಗದಲ್ಲಿ ಮರುಬಿತ್ತನೆ ಮಾಡಿ ಸಾಂದ್ರತೆ ಕಾಪಾಡಿ. ಹೀರುವ ಕೀಟಗಳ ಬಾಧೆ ತಡೆಯಲು ಬೀಜೋಪಚಾರ ಮಾಡಿ.'
      },
      {
        photo: 'public/images/stages/cotton_stage2_squaring.jpg',
        name_en: 'Stage 2 — Vegetative Growth & Squaring (Bud Formation)',
        name_kn: 'ಹಂತ 2 — ಕಾಯಿಕ ಬೆಳವಣಿಗೆ ಮತ್ತು ಚೌಕಟ್ಟು (ಮೊಗ್ಗು) ಹಂತ',
        duration_en: 'Approx. 30–35 days (Days 21–55)',
        duration_kn: 'ಸುಮಾರು 30–35 ದಿನಗಳು (21 ರಿಂದ 55 ದಿನಗಳು)',
        what_happens_en: 'Sympodial fruiting branches emerge; triangular flower buds (squares) form encased by three fringed protective bracts.',
        what_happens_kn: 'ರೆಂಬೆಗಳು ಕವಲೊಡೆದು ತ್ರಿಕೋನಾಕಾರದ ಹೂಮೊಗ್ಗುಗಳು (ಸ್ಕ್ವೇರ್ಸ್) ರಕ್ಷಣಾತ್ಮಕ ಎಲೆಗಳ ನಡುವೆ ಮೂಡುತ್ತವೆ.',
        farmer_tip_en: 'Install yellow sticky traps for whitefly and pheromone traps for bollworms. Apply first top-dress of nitrogen (urea) after weeding.',
        farmer_tip_kn: 'ಜಿಗಿಹುಳು ಮತ್ತು ಕಾಯಿಕೊರೆಯುವ ಹುಳುಗಳ ನಿಗಾಕ್ಕೆ ಮೋಹಕ ಬಲೆಗಳನ್ನು ಅಳವಡಿಸಿ. ಕಳೆ ತೆಗೆದು ಯೂರಿಯಾ ಗೊಬ್ಬರ ಕೊಡಿ.'
      },
      {
        photo: 'public/images/stages/cotton_stage3_boll.jpg',
        name_en: 'Stage 3 — Flowering & Boll Setting',
        name_kn: 'ಹಂತ 3 — ಹೂಬಿಡುವಿಕೆ ಮತ್ತು ಕಾಯಿ ಕಟ್ಟುವುದು',
        duration_en: 'Approx. 25–35 days (Days 56–90)',
        duration_kn: 'ಸುಮಾರು 25–35 ದಿನಗಳು (56 ರಿಂದ 90 ದಿನಗಳು)',
        what_happens_en: 'Creamy flowers bloom, turning pinkish-purple on day two; pollinated ovaries swell into green spherical 3–5 chambered bolls.',
        what_happens_kn: 'ಬಿಳಿ ಹೂಗಳು ಅರಳಿ ಮರುದಿನ ಗುಲಾಬಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತವೆ; ಪರಾಗಸ್ಪರ್ಶದ ನಂತರ ಸಣ್ಣ ಹಸಿರು ಕಾಯಿಗಳು ಬೆಳೆಯುತ್ತವೆ.',
        farmer_tip_en: 'Peak water and nutrient uptake stage. Spray 1% Potassium Nitrate (13:0:45) to prevent premature square and young boll shedding.',
        farmer_tip_kn: 'ಹೂವು-ಮೊಗ್ಗು ಉದುರುವುದನ್ನು ತಡೆಯಲು ಶೇ. 1 ರ ಪೊಟ್ಯಾಷಿಯಂ ನೈಟ್ರೇಟ್ ಸಿಂಪಡಿಸಿ. ತೇವಾಂಶ ಕೊರತೆಯಾಗದಂತೆ ನೀರು ಹಾಯಿಸಿ.'
      },
      {
        photo: 'public/images/stages/cotton_stage3_boll.jpg',
        name_en: 'Stage 4 — Boll Development & Fiber Filling',
        name_kn: 'ಹಂತ 4 — ಕಾಯಿ ಬಲಿಯುವಿಕೆ ಮತ್ತು ನಾರು ತುಂಬುವಿಕೆ',
        duration_en: 'Approx. 30–40 days (Days 91–130)',
        duration_kn: 'ಸುಮಾರು 30–40 ದಿನಗಳು (91 ರಿಂದ 130 ದಿನಗಳು)',
        what_happens_en: 'Seed fibers undergo rapid cell elongation followed by secondary wall cellulose deposition, maximizing lint density inside bolls.',
        what_happens_kn: 'ಹಸಿರು ಕಾಯಿಗಳೊಳಗೆ ಹತ್ತಿಯ ನಾರು ದಪ್ಪಗಾಗಿ ಸೆಲ್ಯುಲೋಸ್ ತುಂಬಿಕೊಳ್ಳುತ್ತದೆ ಮತ್ತು ಬೀಜಗಳು ಪಕ್ವಗೊಳ್ಳುತ್ತವೆ.',
        farmer_tip_en: 'Scout regularly for Pink Bollworm (PBW) rosetted flowers and bore holes. Cease nitrogen application to prevent excessive rank vegetative growth.',
        farmer_tip_kn: 'ಗುಲಾಬಿ ಕಾಯಿಕೊರೆಯುವ ಹುಳುವಿನ ಬಾಧೆ ಪರಿಶೀಲಿಸಿ. ಅತಿಯಾದ ಸಾರಜನಕ ಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ನಿಲ್ಲಿಸಿ ಕಾಯಿ ಬಲಿಯಲು ಬಿಡಿ.'
      },
      {
        photo: 'public/images/stages/cotton_stage4_harvest.jpg',
        name_en: 'Stage 5 — Boll Bursting & Clean Picking',
        name_kn: 'ಹಂತ 5 — ಕಾಯಿ ಒಡೆಯುವಿಕೆ ಮತ್ತು ಹತ್ತಿ ಬಿಡಿಸುವಿಕೆ',
        duration_en: 'Approx. 30–40 days across 2–3 pickings (Days 131–170)',
        duration_kn: 'ಸುಮಾರು 30–40 ದಿನಗಳ ಕಾಲ 2-3 ಬಾರಿ ಬಿಡಿಸುವಿಕೆ (131 ರಿಂದ 170 ದಿನಗಳು)',
        what_happens_en: 'Mature bolls crack along sutures under sunny dry weather, fluffing out brilliant white locks of seed cotton ready for harvest.',
        what_happens_kn: 'ಬಲಿತ ಕಾಯಿಗಳು ಬಿಸಿಲಿನಲ್ಲಿ ಒಡೆದು ಬಿಳಿ ಹತ್ತಿ ಹೊರಬರುತ್ತದೆ. ಒಣ ಹವೆಯಲ್ಲಿ 2-3 ಬಾರಿ ಕೈಯಿಂದ ಹತ್ತಿ ಬಿಡಿಸಲಾಗುತ್ತದೆ.',
        farmer_tip_en: 'Pick cotton in dry morning hours after dew has evaporated. Store in clean cotton bags to prevent plastic and leaf trash contamination.',
        farmer_tip_kn: 'ಇಬ್ಬನಿ ಆರಿದ ನಂತರ ಒಣಗಿದ ಹತ್ತಿ ಬಿಡಿಸಿ. ಪ್ಲಾಸ್ಟಿಕ್ ಅಥವಾ ಕಸ ಸೇರದಂತೆ ಕಾಟನ್ ಬಟ್ಟೆಯ ಚೀಲಗಳಲ್ಲಿ ಶುದ್ಧವಾಗಿ ಶೇಖರಿಸಿ.'
      }
    ]
  },
  ragi: {
    id: 'ragi',
    name_en: 'Ragi (Finger Millet)',
    name_kn: 'ರಾಗಿ (Finger Millet)',
    photo: 'public/images/crops/ragi.jpg',
    desc_en: 'Hardy, highly nutritious, drought-resilient annual millet of Southern Karnataka. Total field duration spans approx. 105 to 125 days depending on variety (e.g. GPU-28, MR-1, ML-365) (Reference: UAS Bengaluru Small Millets Research / ICAR-IIMR).',
    desc_kn: 'ದಕ್ಷಿಣ ಕರ್ನಾಟಕದ ಮುಖ್ಯ ಪೌಷ್ಟಿಕ ಹಾಗೂ ಬರನಿರೋಧಕ ವಾರ್ಷಿಕ ಸಿರಿಧಾನ್ಯ ಬೆಳೆ. ತಳಿಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ಇದರ ಒಟ್ಟು ಅವಧಿ ಸುಮಾರು 105 ರಿಂದ 125 ದಿನಗಳು (ಉದಾ: ಜಿಪಿಯು-28, ಎಂಆರ್-1, ಎಂಎಲ್-365) (ಆಧಾರ: ಯುಎಎಸ್ ಬೆಂಗಳೂರು).',
    official_references: [
      {
        title_en: 'UAS Bengaluru — Small Millets Research (ZARS GKVK Bengaluru)',
        title_kn: 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು — ಸಿರಿಧಾನ್ಯ ಸಂಶೋಧನಾ ಕೇಂದ್ರ (ಜಿಕೆವಿಕೆ)',
        url: 'https://www.uasbangalore.edu.in/en/small-millets-zars-gkvk-bengaluru/',
        desc_en: 'Lead scientific center for finger millet breeding, drought-resilience trials, and package of practices in Karnataka.',
        desc_kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ರಾಗಿ ತಳಿ ಸಂಶೋಧನೆ, ರೋಗ ನಿಯಂತ್ರಣ ಮತ್ತು ಅಧಿಕ ಇಳುವರಿ ಬೇಸಾಯ ಪದ್ಧತಿಯ ಪ್ರಧಾನ ಕೇಂದ್ರ.'
      },
      {
        title_en: 'UAS Bengaluru — Package of Practices (Dryland Ragi)',
        title_kn: 'ಯುಎಎಸ್ ಬೆಂಗಳೂರು — ಮಳೆಯಾಶ್ರಿತ ರಾಗಿ ಬೇಸಾಯ ಕ್ರಮಗಳು',
        url: 'https://www.uasbangalore.edu.in/',
        desc_en: 'Comprehensive package of practices for direct-seeded and transplanted ragi across southern dry zones.',
        desc_kn: 'ದಕ್ಷಿಣ ಕರ್ನಾಟಕದ ಜಿಲ್ಲೆಗಳಿಗೆ ಸೂಕ್ತವಾದ ಕೂರಿಗೆ ಬಿತ್ತನೆ ಹಾಗೂ ನಾಟಿ ರಾಗಿ ಬೇಸಾಯ ಶಿಫಾರಸುಗಳು.'
      },
      {
        title_en: 'ICAR — Indian Institute of Millets Research (IIMR) & Advisories',
        title_kn: 'ಐಸಿಎಆರ್ — ಭಾರತೀಯ ಸಿರಿಧಾನ್ಯ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ',
        url: 'https://icar.gov.in/',
        desc_en: 'National millets research, nutritional biofortification, and Kharif season agro-advisories.',
        desc_kn: 'ರಾಷ್ಟ್ರೀಯ ಸಿರಿಧಾನ್ಯ ಸಂಶೋಧನೆ, ಪೋಷಕಾಂಶ ಗುಣಮಟ್ಟ ಮತ್ತು ಕೃಷಿ ಸಲಹೆಗಳು.'
      }
    ],
    stages: [
      {
        photo: 'public/images/stages/ragi_stage2_sowing.jpg',
        name_en: 'Stage 1 — Seedling & Establishment',
        name_kn: 'ಹಂತ 1 — ಮೊಳಕೆ ಮತ್ತು ಸಸಿ ಬೇರೂರುವಿಕೆ',
        duration_en: 'Approx. 18–22 days (Days 1–22)',
        duration_kn: 'ಸುಮಾರು 18–22 ದಿನಗಳು (1 ರಿಂದ 22 ದಿನಗಳು)',
        what_happens_en: 'Seeds sprout vigorously even with minimal rainfall, forming fibrous root systems with 3–4 leaves ready for field establishment.',
        what_happens_kn: 'ಕಡಿಮೆ ತೇವಾಂಶದಲ್ಲೂ ಬೀಜಗಳು ಚುರುಕಾಗಿ ಮೊಳಕೆಯೊಡೆದು ಗಟ್ಟಿಮುಟ್ಟಾದ ಸಸಿಗಳಾಗಿ ಬೇರೂರುತ್ತವೆ.',
        farmer_tip_en: 'For transplanted ragi, use 20–22 day old sturdy seedlings. Treat seeds with Azospirillum (500 g/ha) and Trichoderma before sowing.',
        farmer_tip_kn: 'ನಾಟಿ ರಾಗಿಗೆ 20-22 ದಿನದ ಬಲಿತ ಸಸಿಗಳನ್ನು ಬಳಸಿ. ಬಿತ್ತನೆಗೆ ಮುನ್ನ ಅಜೋಸ್ಪೈರಿಲಂ ಮತ್ತು ಟ್ರೈಕೋಡರ್ಮಾದಿಂದ ಬೀಜೋಪಚಾರ ಮಾಡಿ.'
      },
      {
        photo: 'public/images/stages/ragi_stage3_veg.jpg',
        name_en: 'Stage 2 — Tillering & Vegetative Canopy',
        name_kn: 'ಹಂತ 2 — ಕವಲೊಡೆಯುವಿಕೆ ಮತ್ತು ಕಾಯಿಕ ಬೆಳವಣಿಗೆ',
        duration_en: 'Approx. 25–30 days (Days 23–50)',
        duration_kn: 'ಸುಮಾರು 25–30 ದಿನಗಳು (23 ರಿಂದ 50 ದಿನಗಳು)',
        what_happens_en: 'Plants tiller prolifically, generating 4–6 productive tillers with dense crown roots that bind soil against erosion.',
        what_happens_kn: 'ಗಿಡಗಳು ಹುಲುಸಾಗಿ ಕವಲೊಡೆದು 4-6 ಉಪಕಾಂಡಗಳನ್ನು ಮತ್ತು ಮಣ್ಣನ್ನು ಭದ್ರವಾಗಿ ಹಿಡಿಯುವ ಬೇರುಗಳನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳುತ್ತವೆ.',
        farmer_tip_en: 'Perform inter-cultivation (yedekunte) at 20 and 35 days to eliminate weeds and conserve moisture. Top-dress nitrogen (25 kg N/ha) after weeding.',
        farmer_tip_kn: 'ಬಿತ್ತನೆಯ 20 ಮತ್ತು 35 ದಿನಗಳಲ್ಲಿ ಎಡೆಕುಂಟೆ ಹೊಡೆದು ಕಳೆ ನಿಯಂತ್ರಿಸಿ. ಮಳೆ ಬಂದಾಗ 25 ಕೆಜಿ ಯೂರಿಯಾ ಮೇಲುಗೊಬ್ಬರವಾಗಿ ನೀಡಿ.'
      },
      {
        photo: 'public/images/stages/ragi_stage4_flower.jpg',
        name_en: 'Stage 3 — Booting & Panicle Heading',
        name_kn: 'ಹಂತ 3 — ಸುಳಿ ಮತ್ತು ತೆನೆ ಹೊರಬರುವಿಕೆ (ಹೂವಾಡಿಕೆ)',
        duration_en: 'Approx. 15–20 days (Days 51–70)',
        duration_kn: 'ಸುಮಾರು 15–20 ದಿನಗಳು (51 ರಿಂದ 70 ದಿನಗಳು)',
        what_happens_en: 'Flag leaf sheath swells; distinctive curved finger-like ear-heads (4–8 fingers per head) emerge and undergo wind pollination.',
        what_happens_kn: 'ಬಾವುಟ ಎಲೆಯಿಂದ ಬೆರಳಿನಾಕಾರದ ತೆನೆಗಳು ಹೊರಬಂದು ಮುಂಜಾನೆ ವೇಳೆ ಹೂವಾಡಿಕೆ ಪೂರ್ಣಗೊಳ್ಳುತ್ತದೆ.',
        farmer_tip_en: 'Maintain soil moisture during heading. Scout for finger and neck blast (Magnaporthe grisea); spray Mancozeb (2 g/L) if lesions appear.',
        farmer_tip_kn: 'ತೆನೆ ಬರುವಾಗ ನೀರಿನ ಕೊರತೆಯಾಗದಂತೆ ನಿಗಾವಹಿಸಿ. ಕುತ್ತಿಗೆ ಕೊಳೆ ಅಥವಾ ತೆನೆ ಬೆಂಕಿ ರೋಗ ಕಂಡರೆ ತಕ್ಷಣ ಶಿಲೀಂಧ್ರನಾಶಕ ಸಿಂಪಡಿಸಿ.'
      },
      {
        photo: 'public/images/stages/ragi_stage4_flower.jpg',
        name_en: 'Stage 4 — Grain Development & Dough Stage',
        name_kn: 'ಹಂತ 4 — ಕಾಳು ತುಂಬುವಿಕೆ ಮತ್ತು ಹಿಟ್ಟಿನ ಹಂತ',
        duration_en: 'Approx. 20–25 days (Days 71–95)',
        duration_kn: 'ಸುಮಾರು 20–25 ದಿನಗಳು (71 ರಿಂದ 95 ದಿನಗಳು)',
        what_happens_en: 'Grains accumulate starches and proteins, turning from milky green liquid to firm, reddish-brown dough within spikelets.',
        what_happens_kn: 'ತೆನೆಯಲ್ಲಿ ಕಾಳುಗಳು ಬೆಳೆದು ಹಾಲಿನಿಂದ ಗಟ್ಟಿಯಾದ ಹಿಟ್ಟಿನ ಹಂತಕ್ಕೆ ಬದಲಾಗಿ ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತವೆ.',
        farmer_tip_en: 'A single protective irrigation at grain filling substantially boosts grain weight and fodder quality in dryland tracts.',
        farmer_tip_kn: 'ಮಳೆಯ ಕೊರತೆಯಿದ್ದರೆ ಕಾಳು ತುಂಬುವ ಹಂತದಲ್ಲಿ ಒಂದು ರಕ್ಷಣಾತ್ಮಕ ನೀರಾವರಿ ಒದಗಿಸಿದರೆ ಇಳುವರಿ ಗಣನೀಯವಾಗಿ ಹೆಚ್ಚುತ್ತದೆ.'
      },
      {
        photo: 'public/images/stages/ragi_stage5_harvest.jpg',
        name_en: 'Stage 5 — Physiological Maturity & Harvesting',
        name_kn: 'ಹಂತ 5 — ಪಕ್ವತೆ ಮತ್ತು ಕಟಾವು',
        duration_en: 'Approx. 15–20 days (Days 96–115)',
        duration_kn: 'ಸುಮಾರು 15–20 ದಿನಗಳು (96 ರಿಂದ 115 ದಿನಗಳು)',
        what_happens_en: 'Ear-heads turn characteristic chocolate-brown, leaves dry to light straw color, and grain moisture drops below 15%.',
        what_happens_kn: 'ತೆನೆಗಳು ದಟ್ಟ ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿ ಒಣಗುತ್ತವೆ ಮತ್ತು ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತವೆ; ಬೆಳೆ ಕಟಾವಿಗೆ ಸಿದ್ಧವಾಗುತ್ತದೆ.',
        farmer_tip_en: 'Harvest when 85% of ear-heads turn brown. Sun-dry ear-heads for 3–4 days on clean threshing floors before mechanical threshing to 12% moisture.',
        farmer_tip_kn: 'ಶೇ. 85 ರಷ್ಟು ತೆನೆಗಳು ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದಾಗ ಕುಡುಗೋಲಿನಿಂದ ಕಟಾವು ಮಾಡಿ. 3-4 ದಿನ ಬಿಸಿಲಿನಲ್ಲಿ ಒಣಗಿಸಿ ಒಕ್ಕಣೆ ಮಾಡಿ.'
      }
    ]
  }
};

window.renderCropLifecycleGuide = function(cropId) {
  cropId = (cropId || state.selectedCareCrop || 'rice').toLowerCase();
  const crop = CROP_LIFECYCLE_GUIDE[cropId] || CROP_LIFECYCLE_GUIDE['rice'];
  const isKn = state.lang === 'kn';

  // 1. Top Hero Card: photo, name, short description
  const photoEl = document.getElementById('lc-crop-main-photo');
  const titleEl = document.getElementById('lc-crop-title');
  const descEl = document.getElementById('lc-crop-desc');

  if (photoEl) {
    photoEl.src = crop.photo;
    photoEl.alt = isKn ? crop.name_kn : crop.name_en;
  }
  if (titleEl) {
    titleEl.textContent = isKn ? crop.name_kn : crop.name_en;
  }
  if (descEl) {
    descEl.textContent = isKn ? crop.desc_kn : crop.desc_en;
  }

  // 2. Growth Stages Sequence
  const container = document.getElementById('lc-stages-container');
  if (container) {
    container.innerHTML = crop.stages.map(stage => {
      const stageName = isKn ? stage.name_kn : stage.name_en;
      const duration = isKn ? stage.duration_kn : stage.duration_en;
      const whatHappens = isKn ? stage.what_happens_kn : stage.what_happens_en;
      const farmerTip = isKn ? stage.farmer_tip_kn : stage.farmer_tip_en;

      return `
        <article class="lc-stage-card-simple">
          <div class="lc-stage-img-wrap">
            <img src="${stage.photo}" alt="${stageName}" onerror="this.src='public/images/crops/default_crop.svg';" />
          </div>
          <div class="lc-stage-body" style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${stageName}</h3>
              <span class="lc-stage-duration-badge">
                ⏱️ ${duration}
              </span>
            </div>

            <div style="margin-top: 6px; font-size: 0.92rem; line-height: 1.55; color: var(--text-secondary);">
              <strong style="color: var(--text-primary); font-size: 0.88rem;">${isKn ? 'ಏನು ನಡೆಯುತ್ತದೆ (What happens):' : 'What happens:'}</strong>
              <span>${whatHappens}</span>
            </div>

            <div class="lc-stage-tip-box">
              <strong style="color: #047857; display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                💡 <span>${isKn ? 'ರೈತರಿಗೆ ಪ್ರಾಯೋಗಿಕ ಸಲಹೆ (Farmer tip):' : 'Farmer Guidance:'}</span>
              </strong>
              <span style="color: var(--text-primary);">${farmerTip}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 3. Official Agricultural References & Further Reading
  const refContainer = document.getElementById('lc-references-container');
  if (refContainer && crop.official_references) {
    const refTitle = isKn ? '📚 ಅಧಿಕೃತ ಕೃಷಿ ಉಲ್ಲೇಖಗಳು ಮತ್ತು ಹೆಚ್ಚಿನ ಮಾಹಿತಿ' : '📚 Official References & Further Reading';
    const refSubtitle = isKn 
      ? 'ವಿಶ್ವವಿದ್ಯಾಲಯಗಳು ಮತ್ತು ಭಾರತೀಯ ಕೃಷಿ ಸಂಶೋಧನಾ ಮಂಡಳಿಯ (ICAR / UAS / FAO) ಅಧಿಕೃತ ಶಿಫಾರಸುಗಳು' 
      : 'Official package of practices, varietal research, and advisories from ICAR, UAS Bengaluru, and FAO';

    refContainer.innerHTML = `
      <div class="lc-ref-card">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">
            ${refTitle}
          </h3>
          <span class="badge" style="background: #e8f5e9; color: #2e7d32; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
            VERIFIED CITATIONS
          </span>
        </div>
        <p style="margin: 0 0 12px 0; font-size: 0.82rem; color: var(--text-muted);">
          ${refSubtitle}
        </p>
        <div class="lc-ref-grid">
          ${crop.official_references.map(ref => `
            <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="lc-ref-link-item">
              <div>
                <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">${isKn ? ref.title_kn : ref.title_en}</div>
                <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">${isKn ? ref.desc_kn : ref.desc_en}</div>
              </div>
              <span style="font-size: 1.1rem; color: #10b981; margin-left: 8px; flex-shrink: 0;">↗</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }
};

window.selectLifecycleCrop = function(cropId) {
  cropId = (cropId || 'rice').toLowerCase();
  state.selectedCareCrop = cropId;

  const chips = document.querySelectorAll('#care-quick-chips .quick-chip, #care-quick-chips .lc-crop-pill');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-crop') === cropId);
  });

  if (typeof window.renderCropLifecycleGuide === 'function') {
    window.renderCropLifecycleGuide(cropId);
  }
};

async function loadCropLifecycle(cropId, district, sowingDate) {
  cropId = (cropId || state.selectedCareCrop || 'rice').toLowerCase();
  state.selectedCareCrop = cropId;
  window.selectLifecycleCrop(cropId);
}

function renderLifecycleCompanion(data) {
  const cropId = (data && data.crop_id) || state.selectedCareCrop || 'rice';
  window.selectLifecycleCrop(cropId);
}

// -----------------------------------------------------------------------------
// Recommendation -> Lifecycle Handshake
// -----------------------------------------------------------------------------

window.startLifecycleForCurrent = function() {
  let cropId = 'rice';
  if (state.lastRecommendation && state.lastRecommendation.primary_crop) {
    cropId = (state.lastRecommendation.primary_crop.id || '').toLowerCase();
  }
  const supported = ['rice', 'maize', 'tomato', 'arecanut', 'cotton', 'ragi'];
  if (!supported.includes(cropId)) {
    cropId = 'rice';
  }
  state.selectedCareCrop = cropId;
  navTo('cropcare');
  window.selectLifecycleCrop(cropId);
};

window.openCropCareForCurrent = function() {
  window.startLifecycleForCurrent();
};

function loadCropCare(cropId, district) {
  return window.selectLifecycleCrop(cropId);
}

function renderCropCarePage(data) {
  return renderLifecycleCompanion(data);
}


// =============================================================================
// PHASE 2: FARM ECONOMICS & PROFIT CALCULATOR CONTROLLER
// Pilot Crops: Ragi, Rice, Maize, Tomato, Arecanut
// Purely deterministic mathematics — zero ML — grounded in Karnataka agricultural benchmarks.
// =============================================================================

const ECON_CATEGORY_META = {
  seed: { name_kn: 'ಬೀಜ & ಸಸಿ ಮಡಿ', name_en: 'Seeds & Nursery', icon: '🌱', color: '#4caf50' },
  fertilizer: { name_kn: 'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ & ರಸಗೊಬ್ಬರ', name_en: 'FYM & Fertilizers', icon: '🌾', color: '#8bc34a' },
  plant_protection: { name_kn: 'ಸಸ್ಯ ಸಂರಕ್ಷಣೆ (ಔಷಧ)', name_en: 'Plant Protection', icon: '🛡️', color: '#ff9800' },
  land_preparation: { name_kn: 'ಭೂಮಿ ಸಿದ್ಧತೆ & ಟ್ರ್ಯಾಕ್ಟರ್', name_en: 'Land Prep & Machinery', icon: '🚜', color: '#795548' },
  labour: { name_kn: 'ಕಳೆ & ಕಟಾವು ಕೂಲಿ', name_en: 'Labour (Weeding/Harvest)', icon: '👨‍🌾', color: '#00bcd4' },
  irrigation: { name_kn: 'ನೀರಾವರಿ & ವಿದ್ಯುತ್', name_en: 'Irrigation & Power', icon: '💧', color: '#2196f3' },
  transport: { name_kn: 'ಮಾರುಕಟ್ಟೆ ಸಾಗಾಣಿಕೆ', name_en: 'Transport to Mandi', icon: '🚚', color: '#9c27b0' },
  bagging_misc: { name_kn: 'ಚೀಲ ತುಂಬುವಿಕೆ & ಇತರೆ', name_en: 'Bagging & Misc', icon: '📦', color: '#607d8b' }
};

const CROP_NAMES_TRANSLATION = {
  ragi: { kn: 'ರಾಗಿ', en: 'Ragi' },
  rice: { kn: 'ಭತ್ತ', en: 'Rice (Paddy)' },
  maize: { kn: 'ಮೆಕ್ಕೆ ಜೋಳ', en: 'Maize' },
  tomato: { kn: 'ಟೊಮೇಟೊ', en: 'Tomato' },
  arecanut: { kn: 'ಅಡಿಕೆ', en: 'Arecanut' }
};

function initEconomicsView() {
  if (!state.selectedEconomicsCrop) {
    state.selectedEconomicsCrop = 'ragi';
  }
  
  // Highlight the selected crop chip
  const chips = document.querySelectorAll('#econ-crop-chips .quick-chip');
  chips.forEach(ch => {
    ch.classList.toggle('active', ch.getAttribute('data-crop') === state.selectedEconomicsCrop);
  });

  if (!state.economicsDefaults || state.economicsDefaults.crop_id !== state.selectedEconomicsCrop) {
    loadEconomicsCropDefaults(state.selectedEconomicsCrop);
  }
}
window.initEconomicsView = initEconomicsView;

// Handshake from Recommendation Screen -> Economics
window.openEconomicsForCurrent = function() {
  let cropId = 'ragi';
  if (state.lastRecommendation && state.lastRecommendation.primary_crop) {
    cropId = state.lastRecommendation.primary_crop.id;
  }

  const supportedPilot = ['ragi', 'rice', 'maize', 'tomato', 'arecanut'];
  const isKn = state.lang === 'kn';

  if (!supportedPilot.includes(cropId)) {
    alert(isKn
      ? `ಪ್ರಸ್ತುತ ಹಂತದಲ್ಲಿ 5 ಪ್ರಮುಖ ಬೆಳೆಗಳ (ರಾಗಿ, ಭತ್ತ, ಮೆಕ್ಕೆ ಜೋಳ, ಟೊಮೇಟೊ, ಅಡಿಕೆ) ಅಧಿಕೃತ ಆರ್ಥಿಕ ಮಾನದಂಡಗಳು ಲಭ್ಯವಿದೆ. ರಾಗಿ ಬೆಳೆಯ ಆರ್ಥಿಕ ಲೆಕ್ಕಾಚಾರವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`
      : `Detailed economic benchmarks currently support 5 pilot crops (Ragi, Rice, Maize, Tomato, Arecanut). Opening Ragi economics.`
    );
    cropId = 'ragi';
  }

  state.selectedEconomicsCrop = cropId;

  // Show carried badge
  const carriedBadge = document.getElementById('econ-carried-badge');
  if (carriedBadge) {
    const cropName = isKn 
      ? (CROP_NAMES_TRANSLATION[cropId]?.kn || cropId) 
      : (CROP_NAMES_TRANSLATION[cropId]?.en || cropId);
    carriedBadge.innerHTML = `<span>🌾 ${isKn ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಬೆಳೆ:' : 'Recommended Crop:'} <strong>${cropName}</strong></span>`;
    carriedBadge.style.display = 'inline-block';
  }

  // Update chips active state
  const chips = document.querySelectorAll('#econ-crop-chips .quick-chip');
  chips.forEach(ch => {
    ch.classList.toggle('active', ch.getAttribute('data-crop') === cropId);
  });

  navTo('economics');
  loadEconomicsCropDefaults(cropId, true);
};

// Crop Selector Chip Click
window.selectEconomicsCrop = function(cropId) {
  state.selectedEconomicsCrop = cropId;

  // Update chips UI
  const chips = document.querySelectorAll('#econ-crop-chips .quick-chip');
  chips.forEach(ch => {
    ch.classList.toggle('active', ch.getAttribute('data-crop') === cropId);
  });

  // Hide carried badge when user explicitly switches crop
  const carriedBadge = document.getElementById('econ-carried-badge');
  if (carriedBadge) carriedBadge.style.display = 'none';

  loadEconomicsCropDefaults(cropId, false);
};

// Mode Switcher: Simple Mode vs Detailed Mode
window.switchEconomicsMode = function(mode) {
  state.economicsMode = mode;

  const btnSimple = document.getElementById('tab-btn-simple');
  const btnDetailed = document.getElementById('tab-btn-detailed');
  const panelSimple = document.getElementById('econ-mode-simple');
  const panelDetailed = document.getElementById('econ-mode-detailed');

  if (mode === 'simple') {
    if (btnSimple) btnSimple.classList.add('active');
    if (btnDetailed) btnDetailed.classList.remove('active');
    if (panelSimple) panelSimple.style.display = 'block';
    if (panelDetailed) panelDetailed.style.display = 'none';

    // Sync detailed area to simple area if changed
    const dArea = parseFloat(document.getElementById('econ-detail-area')?.value);
    if (!isNaN(dArea) && dArea > 0) {
      const sAreaEl = document.getElementById('econ-simple-area');
      if (sAreaEl) sAreaEl.value = dArea;
    }
  } else {
    if (btnSimple) btnSimple.classList.remove('active');
    if (btnDetailed) btnDetailed.classList.add('active');
    if (panelSimple) panelSimple.style.display = 'none';
    if (panelDetailed) panelDetailed.style.display = 'block';

    // Sync simple area to detailed area
    const sArea = parseFloat(document.getElementById('econ-simple-area')?.value);
    if (!isNaN(sArea) && sArea > 0) {
      const dAreaEl = document.getElementById('econ-detail-area');
      if (dAreaEl) dAreaEl.value = sArea;
    }
    updateDetailedSum();
  }

  // Recalculate profit in new mode
  submitProfitCalculation(mode);
};

// Area Change Listeners
window.onSimpleAreaChanged = function(val) {
  const area = parseFloat(val);
  if (isNaN(area) || area <= 0) return;

  // Sync detailed area input
  const dAreaEl = document.getElementById('econ-detail-area');
  if (dAreaEl) dAreaEl.value = area;

  // Re-scale simple cost default if defaults exist
  if (state.economicsDefaults && state.economicsDefaults.default_cost_per_acre) {
    const costInput = document.getElementById('econ-simple-cost');
    if (costInput) {
      costInput.value = Math.round(state.economicsDefaults.default_cost_per_acre * area);
    }
  }

  submitProfitCalculation('simple');
};

window.onDetailAreaChanged = function(val) {
  const area = parseFloat(val);
  if (isNaN(area) || area <= 0) return;

  const sAreaEl = document.getElementById('econ-simple-area');
  if (sAreaEl) sAreaEl.value = area;

  updateDetailedSum();
  submitProfitCalculation('detailed');
};

// Detailed Cost Summation & Synchronization
window.updateDetailedSum = function() {
  const areaEl = document.getElementById('econ-detail-area');
  const area = parseFloat(areaEl ? areaEl.value : 1.0) || 1.0;

  const catSeed = parseFloat(document.getElementById('econ-cat-seed')?.value) || 0;
  const catFert = parseFloat(document.getElementById('econ-cat-fertilizer')?.value) || 0;
  const catProt = parseFloat(document.getElementById('econ-cat-protection')?.value) || 0;
  const catMach = parseFloat(document.getElementById('econ-cat-machinery')?.value) || 0;
  const catLabr = parseFloat(document.getElementById('econ-cat-labour')?.value) || 0;
  const catIrrg = parseFloat(document.getElementById('econ-cat-irrigation')?.value) || 0;
  const catTrns = parseFloat(document.getElementById('econ-cat-transport')?.value) || 0;
  const catMisc = parseFloat(document.getElementById('econ-cat-misc')?.value) || 0;

  const sumPerAcre = catSeed + catFert + catProt + catMach + catLabr + catIrrg + catTrns + catMisc;
  const totalAllAcres = Math.round(sumPerAcre * area);

  const perAcreEl = document.getElementById('econ-detail-sum-per-acre');
  if (perAcreEl) {
    perAcreEl.textContent = `₹${Math.round(sumPerAcre).toLocaleString()} / ಎಕರೆ`;
  }

  const totalEl = document.getElementById('econ-detail-sum-total');
  if (totalEl) {
    totalEl.textContent = `₹${totalAllAcres.toLocaleString()}`;
  }

  // Keep simple cost synced with detailed total
  const simpleCostInput = document.getElementById('econ-simple-cost');
  if (simpleCostInput) {
    simpleCostInput.value = totalAllAcres;
  }
};

// Load Economic Defaults from Backend
async function loadEconomicsCropDefaults(cropId, preserveArea = false) {
  showLoading(true);

  try {
    const res = await fetch(`${API_BASE}/api/economics/defaults/${cropId}`);
    if (!res.ok) throw new Error('Defaults not found');
    const data = await res.json();
    state.economicsDefaults = data;

    const isKn = state.lang === 'kn';

    // 1. Update Benchmark Summary Card
    const benchSummary = document.getElementById('econ-benchmark-summary');
    if (benchSummary) {
      benchSummary.textContent = isKn
        ? `ಸರಾಸರಿ ಇಳುವರಿ: ${data.default_yield_per_acre} ಕ್ವಿಂ/ಎಕರೆ • ಬೆಲೆ: ₹${data.default_price_per_quintal.toLocaleString()}/ಕ್ವಿಂ • ವೆಚ್ಚ: ₹${data.default_cost_per_acre.toLocaleString()}/ಎಕರೆ`
        : `Avg Yield: ${data.default_yield_per_acre} Qtl/Acre • Price: ₹${data.default_price_per_quintal.toLocaleString()}/Qtl • Cost: ₹${data.default_cost_per_acre.toLocaleString()}/Acre`;
    }

    const sourceEl = document.getElementById('econ-provenance-source');
    if (sourceEl) {
      const srcText = data.benchmark_authority || (typeof data.source_provenance === 'string' ? data.source_provenance : data.source_provenance?.cost) || 'Karnataka Agricultural University Package of Practices';
      sourceEl.textContent = isKn
        ? `ಮೂಲ: ${srcText}`
        : `Source: ${srcText}`;
    }

    // 2. Determine Farm Area
    let area = 2.0;
    if (preserveArea) {
      const existingArea = parseFloat(document.getElementById('econ-simple-area')?.value);
      if (!isNaN(existingArea) && existingArea > 0) area = existingArea;
    }

    // 3. Pre-fill Simple Mode
    const simpleAreaEl = document.getElementById('econ-simple-area');
    if (simpleAreaEl) simpleAreaEl.value = area;

    const simpleYieldEl = document.getElementById('econ-simple-yield');
    if (simpleYieldEl) simpleYieldEl.value = data.default_yield_per_acre;

    const simplePriceEl = document.getElementById('econ-simple-price');
    if (simplePriceEl) simplePriceEl.value = data.default_price_per_quintal;

    const simpleCostEl = document.getElementById('econ-simple-cost');
    if (simpleCostEl) simpleCostEl.value = Math.round(data.default_cost_per_acre * area);

    // 4. Pre-fill Detailed Mode
    const detailAreaEl = document.getElementById('econ-detail-area');
    if (detailAreaEl) detailAreaEl.value = area;

    const detailYieldEl = document.getElementById('econ-detail-yield');
    if (detailYieldEl) detailYieldEl.value = data.default_yield_per_acre;

    const detailPriceEl = document.getElementById('econ-detail-price');
    if (detailPriceEl) detailPriceEl.value = data.default_price_per_quintal;

    // Pre-fill categories from reference breakdown
    const bMap = {};
    if (Array.isArray(data.cost_breakdown_per_acre)) {
      data.cost_breakdown_per_acre.forEach(item => {
        bMap[item.category] = item.amount_rs;
      });
    }

    if (document.getElementById('econ-cat-seed')) document.getElementById('econ-cat-seed').value = bMap['seed'] || 800;
    if (document.getElementById('econ-cat-fertilizer')) document.getElementById('econ-cat-fertilizer').value = bMap['fertilizer'] || 4000;
    if (document.getElementById('econ-cat-protection')) document.getElementById('econ-cat-protection').value = bMap['plant_protection'] || 800;
    if (document.getElementById('econ-cat-machinery')) document.getElementById('econ-cat-machinery').value = bMap['land_preparation'] || 3000;
    if (document.getElementById('econ-cat-labour')) document.getElementById('econ-cat-labour').value = bMap['labour'] || 5000;
    if (document.getElementById('econ-cat-irrigation')) document.getElementById('econ-cat-irrigation').value = bMap['irrigation'] || 500;
    if (document.getElementById('econ-cat-transport')) document.getElementById('econ-cat-transport').value = bMap['transport'] || 1200;
    if (document.getElementById('econ-cat-misc')) document.getElementById('econ-cat-misc').value = bMap['bagging_misc'] || 800;

    updateDetailedSum();

    // 5. Update Agricultural Disclaimer
    const disclaimerEl = document.getElementById('econ-disclaimer-text');
    if (disclaimerEl && (data.notes_kn || data.notes_en)) {
      disclaimerEl.textContent = isKn
        ? `${data.notes_kn} (ಮೂಲ: ${data.benchmark_authority}). ಈ ಫಲಿತಾಂಶಗಳು ನಮೂದಿಸಿದ ಮೌಲ್ಯಗಳು ಮತ್ತು ಕೃಷಿ ವಿವಿ ಪ್ಯಾಕೇಜ್ ಆಫ್ ಪ್ರಾಕ್ಟೀಸಸ್ ಆಧರಿಸಿದ ಅಂದಾಜುಗಳಾಗಿದ್ದು, ಖಾತರಿಯ ಆದಾಯವಲ್ಲ.`
        : `${data.notes_en} (Source: ${data.benchmark_authority}). These results are estimates based on entered values and university package of practices. They do not constitute guaranteed returns.`;
    }

    // 6. Automatically calculate profit so results are immediately visible
    await submitProfitCalculation(state.economicsMode || 'simple');
  } catch (err) {
    console.error('Failed to load economics defaults:', err);
  } finally {
    showLoading(false);
  }
}

window.resetEconomicsToDefaults = function() {
  loadEconomicsCropDefaults(state.selectedEconomicsCrop || 'ragi', false);
};

// Calculate Profit & Economics (POST /api/economics/calculate-profit)
window.submitProfitCalculation = async function(mode = 'simple') {
  try {
    let payload = null;
    const cropId = state.selectedEconomicsCrop || 'ragi';

    if (mode === 'simple') {
      const area = parseFloat(document.getElementById('econ-simple-area')?.value) || 1.0;
      const yieldVal = parseFloat(document.getElementById('econ-simple-yield')?.value) || 0.0;
      const priceVal = parseFloat(document.getElementById('econ-simple-price')?.value) || 0.0;
      const costVal = parseFloat(document.getElementById('econ-simple-cost')?.value) || 0.0;

      payload = {
        crop_id: cropId,
        area_acres: area,
        expected_yield_per_acre: yieldVal,
        expected_price: priceVal,
        total_cost: costVal,
        cost_breakdown: null
      };
    } else {
      const area = parseFloat(document.getElementById('econ-detail-area')?.value) || 1.0;
      const yieldVal = parseFloat(document.getElementById('econ-detail-yield')?.value) || 0.0;
      const priceVal = parseFloat(document.getElementById('econ-detail-price')?.value) || 0.0;

      const breakdown = [
        { category: 'seed', amount_rs: (parseFloat(document.getElementById('econ-cat-seed')?.value) || 0) * area, description: 'ಬೀಜ ಮತ್ತು ಸಸಿ ಮಡಿ ವೆಚ್ಚ' },
        { category: 'fertilizer', amount_rs: (parseFloat(document.getElementById('econ-cat-fertilizer')?.value) || 0) * area, description: 'ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ ಮತ್ತು ರಸಗೊಬ್ಬರ' },
        { category: 'plant_protection', amount_rs: (parseFloat(document.getElementById('econ-cat-protection')?.value) || 0) * area, description: 'ಕೀಟನಾಶಕ ಮತ್ತು ಶಿಲೀಂಧ್ರನಾಶಕ' },
        { category: 'land_preparation', amount_rs: (parseFloat(document.getElementById('econ-cat-machinery')?.value) || 0) * area, description: 'ಉಳುಮೆ ಮತ್ತು ಟ್ರ್ಯಾಕ್ಟರ್ ವೆಚ್ಚ' },
        { category: 'labour', amount_rs: (parseFloat(document.getElementById('econ-cat-labour')?.value) || 0) * area, description: 'ಕಳೆ ಕೀಳುವಿಕೆ ಮತ್ತು ಕಟಾವು ಕೂಲಿ' },
        { category: 'irrigation', amount_rs: (parseFloat(document.getElementById('econ-cat-irrigation')?.value) || 0) * area, description: 'ನೀರಾವರಿ ಮತ್ತು ವಿದ್ಯುತ್ ವೆಚ್ಚ' },
        { category: 'transport', amount_rs: (parseFloat(document.getElementById('econ-cat-transport')?.value) || 0) * area, description: 'ಮಾರುಕಟ್ಟೆ ಸಾಗಾಣಿಕೆ ವೆಚ್ಚ' },
        { category: 'bagging_misc', amount_rs: (parseFloat(document.getElementById('econ-cat-misc')?.value) || 0) * area, description: 'ಚೀಲ ತುಂಬುವಿಕೆ ಮತ್ತು ಅನಿರೀಕ್ಷಿತ ವೆಚ್ಚ' }
      ];

      const sumCost = breakdown.reduce((acc, item) => acc + item.amount_rs, 0);

      payload = {
        crop_id: cropId,
        area_acres: area,
        expected_yield_per_acre: yieldVal,
        expected_price: priceVal,
        total_cost: sumCost,
        cost_breakdown: breakdown
      };
    }

    const res = await fetch(`${API_BASE}/api/economics/calculate-profit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Profit calculation failed');
    }

    const data = await res.json();
    state.lastEconomicsResult = data;
    renderEconomicsResults(data);
  } catch (err) {
    console.error('Profit calculation error:', err);
  }
};

// Render Output Financial Dashboard & Break-Even Analysis
function renderEconomicsResults(data) {
  if (!data) return;
  const isKn = state.lang === 'kn';

  // 1. Financial Metrics
  const revEl = document.getElementById('econ-res-revenue');
  if (revEl) revEl.textContent = `₹${Math.round(data.gross_revenue).toLocaleString()}`;

  const prodTxtEl = document.getElementById('econ-res-prod-txt');
  if (prodTxtEl) {
    prodTxtEl.textContent = isKn
      ? `${data.total_production.toFixed(1)} ಕ್ವಿಂಟಾಲ್ ಒಟ್ಟು ಉತ್ಪಾದನೆ (${data.expected_yield_per_acre} ಕ್ವಿಂ/ಎಕರೆ)`
      : `${data.total_production.toFixed(1)} Qtl total production (${data.expected_yield_per_acre} Qtl/acre)`;
  }

  const costEl = document.getElementById('econ-res-cost');
  if (costEl) costEl.textContent = `₹${Math.round(data.total_cost).toLocaleString()}`;

  const costAcreTxtEl = document.getElementById('econ-res-cost-acre-txt');
  if (costAcreTxtEl) {
    costAcreTxtEl.textContent = isKn
      ? `₹${Math.round(data.cost_per_acre).toLocaleString()} / ಎಕರೆಗೆ ವೆಚ್ಚ`
      : `₹${Math.round(data.cost_per_acre).toLocaleString()} / acre cost`;
  }

  const netEl = document.getElementById('econ-res-net');
  const netSubEl = document.getElementById('econ-res-net-sub');
  const isProfitable = data.is_profitable;

  if (netEl) {
    if (isProfitable) {
      netEl.textContent = `+₹${Math.round(data.net_return).toLocaleString()}`;
      netEl.style.color = '#2e7d32';
    } else {
      netEl.textContent = `-₹${Math.round(Math.abs(data.net_return)).toLocaleString()}`;
      netEl.style.color = '#c62828';
    }
  }

  if (netSubEl) {
    const netPerAcre = Math.round(Math.abs(data.net_return) / Math.max(data.area_acres, 0.01));
    if (isProfitable) {
      netSubEl.textContent = isKn
        ? `+₹${netPerAcre.toLocaleString()} / ಎಕರೆಗೆ ನಿವ್ವಳ ಲಾಭ`
        : `+₹${netPerAcre.toLocaleString()} / acre net profit`;
      netSubEl.style.color = '#2e7d32';
    } else {
      netSubEl.textContent = isKn
        ? `-₹${netPerAcre.toLocaleString()} / ಎಕರೆಗೆ ನಿವ್ವಳ ನಷ್ಟ`
        : `-₹${netPerAcre.toLocaleString()} / acre net loss`;
      netSubEl.style.color = '#c62828';
    }
  }

  const bcEl = document.getElementById('econ-res-bc');
  if (bcEl) bcEl.textContent = data.bc_ratio.toFixed(2);

  // 2. Break-Even Metrics
  const breakPriceEl = document.getElementById('econ-res-break-price');
  if (breakPriceEl) {
    breakPriceEl.textContent = `₹${data.break_even_price.toLocaleString(undefined, { maximumFractionDigits: 1 })} / ಕ್ವಿಂಟಾಲ್`;
  }

  const breakYieldEl = document.getElementById('econ-res-break-yield');
  if (breakYieldEl) {
    breakYieldEl.textContent = `${data.break_even_yield.toFixed(2)} ಕ್ವಿಂಟಾಲ್ / ಎಕರೆ`;
  }

  // 3. Profitability Banner
  const banner = document.getElementById('econ-profit-banner');
  const bannerIcon = document.getElementById('econ-banner-icon');
  const bannerTitle = document.getElementById('econ-banner-title');
  const bannerSub = document.getElementById('econ-banner-sub');
  const bannerPill = document.getElementById('econ-banner-acres-pill');

  const cropNameStr = isKn 
    ? (CROP_NAMES_TRANSLATION[data.crop_id]?.kn || data.crop_id)
    : (CROP_NAMES_TRANSLATION[data.crop_id]?.en || data.crop_id);

  if (bannerPill) {
    bannerPill.textContent = isKn 
      ? `${data.area_acres} ಎಕರೆ ${cropNameStr}`
      : `${data.area_acres} Acres ${cropNameStr}`;
  }

  if (banner) {
    if (isProfitable) {
      banner.style.background = 'linear-gradient(135deg, #1b5e20, #2e7d32)';
      banner.style.boxShadow = '0 4px 14px rgba(27,94,32,0.2)';
      if (bannerIcon) bannerIcon.textContent = '🎉';
      if (bannerTitle) bannerTitle.textContent = isKn ? 'ನಿವ್ವಳ ಲಾಭದಾಯಕ ಅಂದಾಜು (Profitable Farm Return)' : 'Estimated Net Profit';
      if (bannerSub) bannerSub.textContent = isKn
        ? 'ನಿರೀಕ್ಷಿತ ಆದಾಯವು ಒಟ್ಟು ಸಾಗುವಳಿ ವೆಚ್ಚಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿದೆ. ಉತ್ತಮ ಮಾರುಕಟ್ಟೆ ನಿರ್ವಹಣೆ ಮುಂದುವರಿಸಿ.'
        : 'Expected revenue exceeds total cost of cultivation.';
    } else {
      banner.style.background = 'linear-gradient(135deg, #b71c1c, #c62828)';
      banner.style.boxShadow = '0 4px 14px rgba(183,28,28,0.2)';
      if (bannerIcon) bannerIcon.textContent = '⚠️';
      if (bannerTitle) bannerTitle.textContent = isKn ? 'ವೆಚ್ಚ ಮೀರಿದ ನಷ್ಟದ ಅಂದಾಜು (Estimated Loss)' : 'Estimated Net Loss';
      if (bannerSub) bannerSub.textContent = isKn
        ? 'ನಿರೀಕ್ಷಿತ ಆದಾಯವು ಒಟ್ಟು ವೆಚ್ಚವನ್ನು ತಲುಪುತ್ತಿಲ್ಲ. ಇಳುವರಿ ಸುಧಾರಣೆ ಅಥವಾ ಮಾರಾಟ ಬೆಲೆಯನ್ನು ಮರುಪರಿಶೀಲಿಸಿ.'
        : 'Expected revenue does not cover the total cultivation costs. Review yield or market price.';
    }
  }

  // 4. Cost Breakdown Progress Bars
  renderCostDistributionBars(data);
}

function renderCostDistributionBars(data) {
  const container = document.getElementById('econ-distribution-bars');
  if (!container) return;

  const isKn = state.lang === 'kn';
  container.innerHTML = '';

  let items = data.cost_breakdown;
  // If simple mode without custom breakdown, fall back to reference breakdown scaled to total cost
  if (!items || items.length === 0) {
    if (state.economicsDefaults && Array.isArray(state.economicsDefaults.cost_breakdown_per_acre)) {
      const refItems = state.economicsDefaults.cost_breakdown_per_acre;
      const refSum = refItems.reduce((acc, it) => acc + it.amount_rs, 0) || 1;
      items = refItems.map(it => {
        const pct = (it.amount_rs / refSum) * 100;
        return {
          category: it.category,
          amount_rs: Math.round((pct / 100) * data.total_cost),
          percentage: Number(pct.toFixed(1)),
          description: it.description
        };
      });
    }
  }

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="font-size: 12px; color: var(--text-muted);">${isKn ? 'ವೆಚ್ಚ ವಿವರ ಲಭ್ಯವಿಲ್ಲ' : 'Cost breakdown not available'}</div>`;
    return;
  }

  items.forEach(item => {
    const meta = ECON_CATEGORY_META[item.category] || {
      name_kn: item.category,
      name_en: item.category,
      icon: '💼',
      color: '#4caf50'
    };

    const catName = isKn ? meta.name_kn : meta.name_en;
    const pct = item.percentage != null ? item.percentage : (data.total_cost > 0 ? (item.amount_rs / data.total_cost) * 100 : 0);

    const row = document.createElement('div');
    row.className = 'econ-dist-bar-row';
    row.innerHTML = `
      <div class="econ-dist-bar-labels">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>${meta.icon}</span>
          <span>${catName}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; color: var(--text-main);">₹${Math.round(item.amount_rs).toLocaleString()}</span>
          <span style="font-size: 11px; background: var(--surface-warm); padding: 1px 6px; border-radius: 4px; color: var(--text-muted); border: 1px solid var(--border-subtle);">${pct.toFixed(1)}%</span>
        </div>
      </div>
      <div class="econ-dist-bar-track">
        <div class="econ-dist-bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${meta.color};"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

// =============================================================================
// PHASE 3E: PLANT DISEASE SCANNER ENGINE
// =============================================================================

const SUPPORTED_DISEASE_CROPS = {
  arecanut: { name_kn: 'ಅಡಿಕೆ', name_en: 'Arecanut', icon: '🌴' },
  maize: { name_kn: 'ಮೆಕ್ಕೆ ಜೋಳ', name_en: 'Maize (Corn)', icon: '🌽' },
  tomato: { name_kn: 'ಟೊಮೇಟೊ', name_en: 'Tomato', icon: '🍅' },
  rice: { name_kn: 'ಭತ್ತ', name_en: 'Rice (Paddy)', icon: '🌾' },
  cotton: { name_kn: 'ಹತ್ತಿ', name_en: 'Cotton', icon: '🌿' }
};

function selectDiseaseCrop(cropId) {
  if (!SUPPORTED_DISEASE_CROPS[cropId]) return;
  state.selectedDiseaseCrop = cropId;

  // Update chip active states
  const chips = document.querySelectorAll('#disease-crop-chips .disease-chip');
  chips.forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-crop') === cropId);
  });

  hideCropValidationMismatch();

  // If there's an active result, clear or indicate new crop selected
  if (state.lastDiseaseResult && state.lastDiseaseResult.plant_id !== cropId) {
    if (el.diseaseResultCard) el.diseaseResultCard.style.display = 'none';
    state.lastDiseaseResult = null;
  }
}
window.selectDiseaseCrop = selectDiseaseCrop;

function initDiseaseScannerEvents() {
  if (!el.diseaseDropzone) return;

  // File browse click
  if (el.btnDiseaseBrowse && el.diseaseFileInput) {
    el.btnDiseaseBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      el.diseaseFileInput.click();
    });
  }

  // Camera click
  if (el.btnDiseaseCamera && el.diseaseCameraInput) {
    el.btnDiseaseCamera.addEventListener('click', (e) => {
      e.stopPropagation();
      el.diseaseCameraInput.click();
    });
  }

  // Sample leaf click
  if (el.btnDiseaseSample) {
    el.btnDiseaseSample.addEventListener('click', async (e) => {
      e.stopPropagation();
      const crop = state.selectedDiseaseCrop || 'arecanut';
      try {
        const res = await fetch(`public/images/samples/${crop}_sample.jpg`);
        if (!res.ok) {
          throw new Error(`Failed to load sample for ${crop}`);
        }
        const blob = await res.blob();
        const file = new File([blob], `${crop}_sample.jpg`, { type: 'image/jpeg' });
        handleDiseaseFile(file);
      } catch (err) {
        console.error('Error loading sample leaf image:', err);
        showDiseaseError(state.lang === 'kn' ? 'ಮಾದರಿ ಎಲೆ ಚಿತ್ರ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.' : 'Failed to load sample leaf image.');
      }
    });
  }

  // Dropzone click fallback
  el.diseaseDropzone.addEventListener('click', () => {
    if (el.diseaseFileInput) el.diseaseFileInput.click();
  });

  // Drag & drop handlers
  el.diseaseDropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.diseaseDropzone.classList.add('dragover');
  });

  el.diseaseDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.diseaseDropzone.classList.add('dragover');
  });

  el.diseaseDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.diseaseDropzone.classList.remove('dragover');
  });

  el.diseaseDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.diseaseDropzone.classList.remove('dragover');
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleDiseaseFile(dt.files[0]);
    }
  });

  // File input change
  if (el.diseaseFileInput) {
    el.diseaseFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleDiseaseFile(e.target.files[0]);
      }
    });
  }

  // Camera input change
  if (el.diseaseCameraInput) {
    el.diseaseCameraInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleDiseaseFile(e.target.files[0]);
      }
    });
  }

  // Clear file
  if (el.btnDiseaseClear) {
    el.btnDiseaseClear.addEventListener('click', () => {
      clearDiseaseFile();
    });
  }

  // Detect button click
  if (el.btnDetectDisease) {
    el.btnDetectDisease.addEventListener('click', () => {
      detectDisease();
    });
  }
}

function handleDiseaseFile(file, isDemo = false) {
  if (!file) return;

  if (!isDemo) {
    state.isDemoDisease = false;
    state.demoDiseaseFile = null;
    state.demoDiseaseCrop = null;
    state.demoDiseaseDataset = null;
    state.demoDiseaseExpected = null;

    const banner = document.getElementById('disease-demo-disclaimer-banner');
    if (banner) banner.style.display = 'none';
  }

  // Validate format
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/bmp'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];

  if (!validTypes.includes(file.type) && !validExts.some(v => ext === v)) {
    showDiseaseError(state.lang === 'kn' ? 'ದಯವಿಟ್ಟು JPG, PNG ಅಥವಾ WEBP ಫಾರ್ಮ್ಯಾಟ್ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.' : 'Please upload a JPG, PNG, or WEBP image.');
    return;
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    showDiseaseError(state.lang === 'kn' ? 'ಚಿತ್ರದ ಗಾತ್ರ 10 MB ಗಿಂತ ಹೆಚ್ಚಿದೆ. ದಯವಿಟ್ಟು ಸಣ್ಣ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.' : 'Image size exceeds 10 MB. Please choose a smaller image.');
    return;
  }

  hideDiseaseError();
  state.selectedDiseaseFile = file;

  // Update preview
  if (el.diseaseFileName) el.diseaseFileName.textContent = file.name;
  if (el.diseaseFileSize) {
    const sizeKb = Math.round(file.size / 1024);
    el.diseaseFileSize.textContent = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (el.diseasePreviewImg) el.diseasePreviewImg.src = e.target.result;
    if (el.diseaseDropzone) el.diseaseDropzone.style.display = 'none';
    if (el.diseasePreviewContainer) el.diseasePreviewContainer.style.display = 'block';
    if (el.btnDetectDisease) el.btnDetectDisease.disabled = false;
  };
  reader.readAsDataURL(file);
}

function clearDiseaseFile() {
  state.selectedDiseaseFile = null;
  state.isDemoDisease = false;
  state.demoDiseaseFile = null;
  state.demoDiseaseCrop = null;
  state.demoDiseaseDataset = null;
  state.demoDiseaseExpected = null;
  document.querySelectorAll('.demo-thumb-item').forEach(item => {
    item.style.borderColor = '#e2e8f0';
    item.style.backgroundColor = 'white';
    item.style.boxShadow = 'none';
  });
  const banner = document.getElementById('disease-demo-disclaimer-banner');
  if (banner) banner.style.display = 'none';

  if (el.diseaseFileInput) el.diseaseFileInput.value = '';
  if (el.diseaseCameraInput) el.diseaseCameraInput.value = '';
  if (el.diseaseDropzone) el.diseaseDropzone.style.display = 'block';
  if (el.diseasePreviewContainer) el.diseasePreviewContainer.style.display = 'none';
  if (el.diseasePreviewImg) el.diseasePreviewImg.src = '';
  if (el.btnDetectDisease) el.btnDetectDisease.disabled = true;
  if (el.diseaseResultCard) el.diseaseResultCard.style.display = 'none';
  hideCropValidationMismatch();
  hideDiseaseError();
}

function showDiseaseError(msg) {
  if (el.diseaseErrorBanner && el.diseaseErrorText) {
    el.diseaseErrorText.textContent = msg;
    el.diseaseErrorBanner.style.display = 'block';
  }
}

function hideDiseaseError() {
  if (el.diseaseErrorBanner) {
    el.diseaseErrorBanner.style.display = 'none';
  }
}

async function detectDisease() {
  if (!state.selectedDiseaseFile) {
    showDiseaseError(state.lang === 'kn' ? 'ದಯವಿಟ್ಟು ಎಲೆಯ ಫೋಟೋವನ್ನು ಆಯ್ಕೆಮಾಡಿ.' : 'Please select a leaf image first.');
    return;
  }

  const isKn = state.lang === 'kn';
  hideDiseaseError();

  // Set loading UI on button
  if (el.btnDetectDisease) {
    el.btnDetectDisease.disabled = true;
    if (el.detectBtnIcon) el.detectBtnIcon.textContent = '⏳';
    if (el.detectBtnText) {
      el.detectBtnText.innerHTML = isKn ? 'ರೋಗ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing plant disease...';
    }
  }

  const formData = new FormData();
  formData.append('plant_id', state.selectedDiseaseCrop);
  formData.append('file', state.selectedDiseaseFile);

  const requestUrl = `${API_BASE}/api/disease/detect`;
  console.log(`[DiseaseScanner] Submitting POST to: ${requestUrl}`);
  console.log(`[DiseaseScanner] Crop: ${state.selectedDiseaseCrop}, File: ${state.selectedDiseaseFile.name} (${state.selectedDiseaseFile.size} bytes, type: ${state.selectedDiseaseFile.type})`);

  try {
    const res = await fetch(requestUrl, {
      method: 'POST',
      body: formData
    });

    console.log(`[DiseaseScanner] Response HTTP status: ${res.status}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.message || errData.error || errData.detail || (isKn ? 'ರೋಗ ಪತ್ತೆ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.' : 'Diagnosis failed. Please try again.');
      console.error(`[DiseaseScanner] API error response:`, errData);
      showDiseaseError(errMsg);
      return;
    }

    const data = await res.json();
    state.lastDiseaseResult = data;

    // Phase 3G: Universal Crop Validation Gatekeeper Check
    if (data.crop_valid === false) {
      renderCropValidationMismatch(data);
      return;
    }

    hideCropValidationMismatch();
    renderDiseaseResult(data);

    // Smoothly scroll down to result
    if (el.diseaseResultCard) {
      el.diseaseResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    console.error('Disease detection network error:', err);
    showDiseaseError(isKn ? 'ಸರ್ವರ್ ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷ ಕಂಡುಬಂದಿದೆ. ದಯವಿಟ್ಟು ನೆಟ್‌ವರ್ಕ್ ಪರಿಶೀಲಿಸಿ.' : 'Network error communicating with diagnosis server.');
  } finally {
    if (el.btnDetectDisease) {
      el.btnDetectDisease.disabled = false;
      if (el.detectBtnIcon) el.detectBtnIcon.textContent = '🔬';
      if (el.detectBtnText) {
        el.detectBtnText.innerHTML = `
          <span class="txt-kn"${isKn ? '' : ' style="display:none;"'}>ರೋಗ ಪತ್ತೆ ಹಚ್ಚಿ (Detect Disease)</span>
          <span class="txt-en"${isKn ? ' style="display:none;"' : ''}>Detect Plant Disease</span>
        `;
      }
    }
  }
}
window.detectDisease = detectDisease;

function renderDiseaseResult(result) {
  if (!result || !el.diseaseResultCard) return;

  const isKn = state.lang === 'kn';
  const cropMeta = SUPPORTED_DISEASE_CROPS[result.plant_id] || {
    name_kn: result.plant_name_kn,
    name_en: result.plant_name_en,
    icon: '🌱'
  };

  // Plant Info
  if (el.resPlantIcon) el.resPlantIcon.textContent = cropMeta.icon;
  if (el.resPlantName) {
    el.resPlantName.textContent = isKn ? `${cropMeta.name_kn} (${cropMeta.name_en})` : cropMeta.name_en;
  }

  // Disease Name
  if (el.resDiseaseNameKn) {
    el.resDiseaseNameKn.textContent = isKn ? result.disease_name_kn : result.disease_name_en;
  }
  if (el.resDiseaseNameEn) {
    el.resDiseaseNameEn.textContent = isKn ? result.disease_name_en : result.disease_name_kn;
  }

  // Health Badge & Severity
  if (el.resHealthBadge) {
    if (result.is_healthy) {
      el.resHealthBadge.style.background = '#e8f5e9';
      el.resHealthBadge.style.color = '#2e7d32';
      el.resHealthBadge.textContent = isKn ? '🌿 ಆರೋಗ್ಯಕರ ಎಲೆ' : '🌿 Healthy Leaf';
    } else {
      el.resHealthBadge.style.background = '#ffebee';
      el.resHealthBadge.style.color = '#c62828';
      el.resHealthBadge.textContent = isKn ? '⚠️ ರೋಗ ಪತ್ತೆಯಾಗಿದೆ' : '⚠️ Disease Detected';
    }
  }

  if (el.resSeverityTag) {
    const sev = isKn ? (result.severity_kn || result.severity) : result.severity;
    el.resSeverityTag.textContent = `${isKn ? 'ತೀವ್ರತೆ:' : 'Severity:'} ${sev}`;
  }

  // Confidence & Meter
  const conf = result.confidence != null ? result.confidence : 0.0;
  if (el.resConfidenceTxt) {
    el.resConfidenceTxt.textContent = `${conf.toFixed(1)}%`;
  }
  if (el.resConfidenceBar) {
    el.resConfidenceBar.style.width = `${Math.min(conf, 100)}%`;
    // Color coding confidence: green if >= 70, amber if < 70
    el.resConfidenceBar.style.background = conf >= state.diseaseConfidenceThreshold ? 'var(--primary-green)' : '#f57c00';
  }

  // Low Confidence Warning (< 70%)
  if (el.diseaseLowConfAlert) {
    el.diseaseLowConfAlert.style.display = conf < state.diseaseConfidenceThreshold ? 'block' : 'none';
  }

  // Symptoms List
  if (el.resSymptomsList) {
    el.resSymptomsList.innerHTML = '';
    const symptoms = (isKn ? result.symptoms_kn : result.symptoms_en) || [];
    if (symptoms.length === 0) {
      const li = document.createElement('li');
      li.textContent = isKn ? 'ಯಾವುದೇ ರೋಗಲಕ್ಷಣಗಳಿಲ್ಲ (ಆರೋಗ್ಯಕರ).' : 'No symptoms observed (healthy).';
      el.resSymptomsList.appendChild(li);
    } else {
      symptoms.forEach(sym => {
        const li = document.createElement('li');
        li.textContent = sym;
        el.resSymptomsList.appendChild(li);
      });
    }
  }

  // Organic Controls
  if (el.resOrganicList) {
    el.resOrganicList.innerHTML = '';
    const organics = (isKn ? (result.organic_controls_kn || result.organic_treatments_kn || result.diagnosis?.organic_controls_kn)
                          : (result.organic_controls_en || result.organic_treatments_en || result.diagnosis?.organic_controls_en)) || [];
    if (organics.length === 0) {
      const li = document.createElement('li');
      li.textContent = isKn ? 'ಯಾವುದೇ ನಿರ್ದಿಷ್ಟ ಸಾವಯವ ಕ್ರಮ ಲಭ್ಯವಿಲ್ಲ / ಅಗತ್ಯವಿಲ್ಲ.' : 'No specific organic remedy required.';
      el.resOrganicList.appendChild(li);
    } else {
      organics.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.resOrganicList.appendChild(li);
      });
    }
  }

  // Chemical Controls
  if (el.resChemicalList) {
    el.resChemicalList.innerHTML = '';
    const chemicals = (isKn ? (result.chemical_controls_kn || result.chemical_treatments_kn || result.diagnosis?.chemical_controls_kn)
                           : (result.chemical_controls_en || result.chemical_treatments_en || result.diagnosis?.chemical_controls_en)) || [];
    if (chemicals.length === 0) {
      const li = document.createElement('li');
      li.textContent = isKn ? 'ಯಾವುದೇ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯವಿಲ್ಲ.' : 'No chemical treatment required.';
      el.resChemicalList.appendChild(li);
    } else {
      chemicals.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.resChemicalList.appendChild(li);
      });
    }
  }

  // Prevention
  if (el.resPreventionList) {
    el.resPreventionList.innerHTML = '';
    const prevs = (isKn ? (result.prevention_kn || result.preventive_measures_kn || result.diagnosis?.preventive_measures_kn)
                        : (result.prevention_en || result.preventive_measures_en || result.diagnosis?.preventive_measures_en)) || [];
    if (prevs.length === 0) {
      const li = document.createElement('li');
      li.textContent = isKn ? 'ಸಾಮಾನ್ಯ ಕೃಷಿ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಬೆಳೆ ನಿಗಾ ವಹಿಸಿ.' : 'Follow standard crop hygiene and monitoring.';
      el.resPreventionList.appendChild(li);
    } else {
      prevs.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.resPreventionList.appendChild(li);
      });
    }
  }

  // Disclaimer
  if (el.resDisclaimerText) {
    const disc = isKn ? (result.disclaimer_kn || result.diagnosis?.disclaimer_kn)
                      : (result.disclaimer_en || result.diagnosis?.disclaimer_en);
    if (disc) {
      el.resDisclaimerText.textContent = disc;
    }
  }

  // Demonstration Data Disclaimer Banner
  const demoBanner = document.getElementById('disease-demo-disclaimer-banner');
  const demoBannerText = document.getElementById('disease-demo-disclaimer-text');
  if (demoBanner && demoBannerText) {
    if (state.isDemoDisease) {
      demoBanner.style.display = 'block';
      const confVal = (result.confidence != null ? result.confidence : 0).toFixed(1);
      if (isKn) {
        demoBannerText.innerHTML = `ಮಾದರಿ: <code>${state.demoDiseaseFile || ''}</code> (${state.demoDiseaseDataset || 'ಸಂಶೋಧನಾ ಡೇಟಾಸೆಟ್'}). ಮೇಲಿನ ಫಲಿತಾಂಶವು ಉತ್ಪಾದನಾ <strong>MobileNetV2</strong> ಮಾಡೆಲ್‌ನ ನೈಜ ಮುನ್ಸೂಚನೆಯಾಗಿದೆ (ವಿಶ್ವಾಸಾರ್ಹತೆ: ${confVal}%). ಸಂಶೋಧನಾ ಮೂಲ ಲೇಬಲ್: <em>${state.demoDiseaseExpected || ''}</em> (ಪ್ರಾತ್ಯಕ್ಷಿಕೆ ಉದ್ದೇಶಕ್ಕೆ ಮಾತ್ರ).`;
      } else {
        demoBannerText.innerHTML = `Demo Sample: <code>${state.demoDiseaseFile || ''}</code> (${state.demoDiseaseDataset || 'Research Dataset'}). Result above is live prediction from production <strong>MobileNetV2</strong> model (Confidence: ${confVal}%). Source dataset label: <em>${state.demoDiseaseExpected || ''}</em> (Demonstration only).`;
      }
    } else {
      demoBanner.style.display = 'none';
    }
  }

  // Make result card visible
  el.diseaseResultCard.style.display = 'block';
}

async function selectDiseaseDemoSample(filename, crop, expectedName, dataset) {
  try {


    // 2. Select corresponding crop
    if (typeof selectDiseaseCrop === 'function') {
      selectDiseaseCrop(crop);
    }

    // 3. Store demo metadata in state
    state.isDemoDisease = true;
    state.demoDiseaseFile = filename;
    state.demoDiseaseCrop = crop;
    state.demoDiseaseDataset = dataset;
    state.demoDiseaseExpected = expectedName;

    // 4. Fetch the image blob from backend
    const imageUrl = `/api/disease/demo-sample-file/${filename}`;
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to load demo image: ${res.statusText}`);
    }
    const blob = await res.blob();
    const file = new File([blob], filename, { type: 'image/jpeg' });

    // 5. Load file into scanner preview & state (isDemo = true)
    handleDiseaseFile(file, true);

    // 6. Execute diagnosis via live MobileNetV2 prediction API
    await detectDisease();
  } catch (err) {
    console.error('Error selecting disease demo sample:', err);
    showDiseaseError(state.lang === 'kn' ? `ಮಾದರಿ ಚಿತ್ರ ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ: ${err.message}` : `Failed to load demo image: ${err.message}`);
  }
}
window.selectDiseaseDemoSample = selectDiseaseDemoSample;

function renderCropValidationMismatch(data) {
  if (!el.diseaseCropMismatchCard) return;
  const isKn = state.lang === 'kn';

  // Ensure standard disease result card is hidden
  if (el.diseaseResultCard) el.diseaseResultCard.style.display = 'none';

  const isLowConf = data.status === 'low_confidence' || data.detected_crop === 'unknown';

  if (isLowConf) {
    if (el.mismatchDetailsBox) el.mismatchDetailsBox.style.display = 'none';
    if (el.mismatchTitleKn) el.mismatchTitleKn.textContent = 'ಸಸ್ಯವನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿಲ್ಲ';
    if (el.mismatchTitleEn) el.mismatchTitleEn.textContent = 'Crop Not Recognized';
    if (el.mismatchMsgKn) el.mismatchMsgKn.textContent = data.message_kn || 'ದಯವಿಟ್ಟು ಆಯ್ಕೆ ಮಾಡಿದ ಬೆಳೆಯ ಸ್ಪಷ್ಟವಾದ ಚಿತ್ರವನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ.';
    if (el.mismatchMsgEn) el.mismatchMsgEn.textContent = data.message || 'Please upload a clear image of the selected crop.';
  } else {
    if (el.mismatchDetailsBox) el.mismatchDetailsBox.style.display = 'flex';
    if (el.mismatchTitleKn) el.mismatchTitleKn.textContent = 'ತಪ್ಪಾದ ಸಸ್ಯದ ಚಿತ್ರ';
    if (el.mismatchTitleEn) el.mismatchTitleEn.textContent = 'Wrong Plant Image';
    const cropMeta = SUPPORTED_DISEASE_CROPS[data.detected_crop] || { name_kn: data.detected_crop, name_en: data.detected_crop };
    if (el.mismatchDetectedCrop) {
      el.mismatchDetectedCrop.textContent = isKn ? cropMeta.name_kn : cropMeta.name_en;
      el.mismatchDetectedCrop.style.color = '#c62828';
    }
    const selCropMeta = SUPPORTED_DISEASE_CROPS[data.selected_crop] || { name_kn: data.selected_crop, name_en: data.selected_crop };
    if (el.mismatchSelectedCrop) {
      el.mismatchSelectedCrop.textContent = isKn ? selCropMeta.name_kn : selCropMeta.name_en;
    }
    if (el.mismatchConfRow) el.mismatchConfRow.style.display = 'flex';
    const conf = data.crop_confidence_percentage != null ? data.crop_confidence_percentage : (data.crop_confidence ? (data.crop_confidence * 100).toFixed(1) : '95.0');
    if (el.mismatchConfidence) el.mismatchConfidence.textContent = `${conf}%`;
    if (el.mismatchMsgKn) el.mismatchMsgKn.textContent = data.message_kn || `ದಯವಿಟ್ಟು ಸರಿಯಾದ ${selCropMeta.name_kn} ಎಲೆಯ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಿ.`;
    if (el.mismatchMsgEn) el.mismatchMsgEn.textContent = data.message || `Please upload a correct ${selCropMeta.name_en} leaf image.`;
  }

  // Update text language visibility in mismatch card
  if (el.mismatchTitleKn) el.mismatchTitleKn.style.display = isKn ? 'inline' : 'none';
  if (el.mismatchTitleEn) el.mismatchTitleEn.style.display = isKn ? 'none' : 'inline';
  if (el.mismatchMsgKn) el.mismatchMsgKn.style.display = isKn ? 'block' : 'none';
  if (el.mismatchMsgEn) el.mismatchMsgEn.style.display = isKn ? 'none' : 'block';

  el.diseaseCropMismatchCard.style.display = 'block';
  el.diseaseCropMismatchCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCropValidationMismatch() {
  if (el.diseaseCropMismatchCard) {
    el.diseaseCropMismatchCard.style.display = 'none';
  }
}
window.renderCropValidationMismatch = renderCropValidationMismatch;
window.hideCropValidationMismatch = hideCropValidationMismatch;
window.handleDiseaseFile = handleDiseaseFile;
window.clearDiseaseFile = clearDiseaseFile;





// ==================== MANNUMITRA NEW FEATURES LOGIC ====================

// --- 1. SOIL REPORT OCR FEATURE ---
function initSoilOCRFeature() {
  const dropzone = document.getElementById('ocr-dropzone');
  const fileInput = document.getElementById('ocr-file-input');
  const fileInfo = document.getElementById('ocr-file-info');
  const fileName = document.getElementById('ocr-file-name');
  const analyzeBtn = document.getElementById('ocr-analyze-btn');
  const applyBtn = document.getElementById('apply-ocr-to-recommend-btn');
  const browseBtn = document.getElementById('btn-ocr-browse');
  const demoBtn = document.getElementById('btn-ocr-demo');
  const statusBanner = document.getElementById('ocr-demo-status-banner');

  if (!dropzone || !fileInput) return;

  // Browse button & dropzone click
  if (browseBtn) browseBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
  dropzone.onclick = () => fileInput.click();

  // Drag and drop styles
  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#059669';
    dropzone.style.background = 'rgba(16, 185, 129, 0.08)';
  };

  dropzone.ondragleave = () => {
    dropzone.style.borderColor = '#10b981';
    dropzone.style.background = 'rgba(16, 185, 129, 0.03)';
  };

  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#10b981';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      handleFile(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFile(fileInput.files[0]);
    }
  };

  function handleFile(file) {
    if (fileName) fileName.textContent = file.name;
    if (fileInfo) fileInfo.style.display = 'flex';
    if (statusBanner) statusBanner.style.display = 'none';
  }

  // Helper to populate extracted parameters
  function applyExtractedValues(p) {
    if (!p) return;
    const isKn = state.lang === 'kn';

    if (p.N && document.getElementById('ocr-val-n')) {
      document.getElementById('ocr-val-n').value = p.N.value;
      const tagN = document.getElementById('status-tag-n');
      if (tagN) {
        tagN.textContent = isKn ? '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : '✓ Verified';
        tagN.style.color = '#059669';
      }
    }
    if (p.P && document.getElementById('ocr-val-p')) {
      document.getElementById('ocr-val-p').value = p.P.value;
      const tagP = document.getElementById('status-tag-p');
      if (tagP) {
        tagP.textContent = isKn ? '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : '✓ Verified';
        tagP.style.color = '#059669';
      }
    }
    if (p.K && document.getElementById('ocr-val-k')) {
      document.getElementById('ocr-val-k').value = p.K.value;
      const tagK = document.getElementById('status-tag-k');
      if (tagK) {
        tagK.textContent = isKn ? '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ' : '✓ Verified';
        tagK.style.color = '#059669';
      }
    }
    if (p.ph && document.getElementById('ocr-val-ph')) {
      const phVal = Number(p.ph.value);
      document.getElementById('ocr-val-ph').value = phVal.toFixed(2);
      const tagPh = document.getElementById('status-tag-ph');
      if (tagPh) {
        if (phVal < 5.8) {
          tagPh.textContent = isKn ? '⚠️ ಆಮ್ಲೀಯ (Acidic)' : '⚠️ Acidic pH';
          tagPh.style.color = '#d97706';
        } else if (phVal > 7.8) {
          tagPh.textContent = isKn ? '⚠️ ಕ್ಷಾರೀಯ (Alkaline)' : '⚠️ Alkaline pH';
          tagPh.style.color = '#d97706';
        } else {
          tagPh.textContent = isKn ? '✓ ತಟಸ್ಥ (Neutral)' : '✓ Neutral / Optimal';
          tagPh.style.color = '#059669';
        }
      }
    }
    if (p.ec && document.getElementById('ocr-val-ec')) {
      const ecVal = Number(p.ec.value);
      document.getElementById('ocr-val-ec').value = ecVal.toFixed(2);
      const tagEc = document.getElementById('status-tag-ec');
      if (tagEc) {
        if (ecVal > 1.0) {
          tagEc.textContent = isKn ? '⚠️ ಲವಣಾಂಶ ಅಪಾಯ (Saline)' : '⚠️ Elevated Salinity';
          tagEc.style.color = '#d97706';
        } else {
          tagEc.textContent = isKn ? '✓ ಸಾಮಾನ್ಯ (Normal)' : '✓ Normal EC';
          tagEc.style.color = '#059669';
        }
      }
    }
    if (p.oc && document.getElementById('ocr-val-oc')) {
      const ocVal = Number(p.oc.value);
      document.getElementById('ocr-val-oc').value = ocVal.toFixed(2);
      const tagOc = document.getElementById('status-tag-oc');
      if (tagOc) {
        if (ocVal < 0.45) {
          tagOc.textContent = isKn ? '⚠️ ಕಡಿಮೆ ಸಾವಯವ (Low OC)' : '⚠️ Low Carbon';
          tagOc.style.color = '#d97706';
        } else {
          tagOc.textContent = isKn ? '✓ ಸೂಕ್ತ (Optimal)' : '✓ Optimal OC';
          tagOc.style.color = '#059669';
        }
      }
    }

    const badge = document.getElementById('ocr-verify-badge');
    if (badge) {
      badge.textContent = isKn ? '✓ AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : '✓ AI Verified';
      badge.style.background = '#10b981';
    }
  }

  const defaultDemoFile = 'soil_report_01_mandya.pdf';

  async function loadAndExtractDemoReport(chosenFile) {
    const isKn = state.lang === 'kn';
    const fileToFetch = chosenFile || defaultDemoFile;
    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.style.display = 'none';

    try {
      const res = await fetch(`/api/soil-report/demo?filename=${encodeURIComponent(fileToFetch)}`);
      const data = await res.json();
      if (data.status === 'success' && data.extracted_parameters) {
        applyExtractedValues(data.extracted_parameters);

        if (statusBanner) {
          statusBanner.style.display = 'block';
          statusBanner.style.background = '#ecfdf5';
          statusBanner.style.borderLeftColor = '#10b981';
          statusBanner.style.color = '#065f46';
          const loc = data.location || data.district || 'Mandya';
          statusBanner.innerHTML = isKn
            ? `✓ <strong>ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ (${loc}) ನೈಜ PDF OCR ಮೂಲಕ ಯಶಸ್ವಿಯಾಗಿ ಪಡೆಯಲಾಗಿದೆ!</strong> (${data.sample_id || 'DEMO'}) — ಪರಿಶೀಲಿಸಿ, ಶಿಫಾರಸು ಇಂಜಿನ್‌ಗೆ ಅನ್ವಯಿಸಿ.`
            : `✓ <strong>Soil Health Card (${loc}) parameters extracted via live PDF OCR!</strong> (${data.sample_id || 'DEMO'}) — Review and apply to recommendation engine.`;
        }

        if (applyBtn) {
          applyBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          applyBtn.style.transform = 'scale(1.02)';
          setTimeout(() => { applyBtn.style.transform = 'scale(1)'; }, 400);
        }
      } else {
        alert((isKn ? 'ವರದಿ ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ: ' : 'Extraction failed: ') + (data.message || ''));
      }
    } catch (err) {
      console.error('OCR Extraction Error:', err);
      alert((isKn ? 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ: ' : 'Network error: ') + err.message);
    }
  }

  // Demo Soil Card click handler (Stages and extracts sample report)
  if (demoBtn) {
    demoBtn.onclick = async (e) => {
      e.stopPropagation();
      demoBtn.disabled = true;
      const origText = demoBtn.innerHTML;
      demoBtn.innerHTML = state.lang === 'kn' ? '⏳ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : '⏳ Loading Demo...';
      try {
        await loadAndExtractDemoReport(defaultDemoFile);
      } finally {
        demoBtn.disabled = false;
        demoBtn.innerHTML = origText;
      }
    };
  }

  // Upload Analysis button (Extract Data)
  if (analyzeBtn) {
    analyzeBtn.onclick = async () => {
      const isKn = state.lang === 'kn';
      const hasUploadedFile = fileInput.files && fileInput.files[0];

      if (!hasUploadedFile) {
        await loadAndExtractDemoReport(defaultDemoFile);
        return;
      }

      analyzeBtn.disabled = true;
      const origText = analyzeBtn.textContent;
      analyzeBtn.textContent = isKn ? 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Extracting Parameters...';

      try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        const res = await fetch('/api/soil-report/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.status === 'success' && data.extracted_parameters) {
          applyExtractedValues(data.extracted_parameters);

          if (statusBanner) {
            statusBanner.style.display = 'block';
            statusBanner.style.background = '#ecfdf5';
            statusBanner.style.borderLeftColor = '#10b981';
            statusBanner.style.color = '#065f46';
            statusBanner.innerHTML = isKn
              ? `✓ <strong>ವರದಿಯಿಂದ ಮೌಲ್ಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ!</strong> (${data.parameters_detected} ನಿಯತಾಂಕಗಳು) — ಪರಿಶೀಲಿಸಿ, ನಂತರ ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.`
              : `✓ <strong>Soil parameters extracted from uploaded file!</strong> (${data.parameters_detected} parameters) — Review and click Apply below.`;
          }

          if (applyBtn) {
            applyBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            applyBtn.style.transform = 'scale(1.02)';
            setTimeout(() => { applyBtn.style.transform = 'scale(1)'; }, 400);
          }
        } else {
          alert((isKn ? 'ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ: ' : 'Extraction failed: ') + (data.message || ''));
        }
      } catch (err) {
        console.error('OCR Extraction Error:', err);
        alert((isKn ? 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ: ' : 'Network error: ') + err.message);
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = origText;
      }
    };
  }

  // Apply to Crop Recommendation Button
  if (applyBtn) {
    applyBtn.onclick = (e) => {
      e.preventDefault();
      const nVal = Math.round(parseFloat(document.getElementById('ocr-val-n')?.value) || 245.5);
      const pVal = Math.round(parseFloat(document.getElementById('ocr-val-p')?.value) || 48.2);
      const kVal = Math.round(parseFloat(document.getElementById('ocr-val-k')?.value) || 195.0);
      const phVal = parseFloat(document.getElementById('ocr-val-ph')?.value) || 6.8;

      state.form.nitrogen = nVal;
      state.form.phosphorus = pVal;
      state.form.potassium = kVal;
      state.form.ph = phVal;

      if (window.saveFarmerProfile) {
        window.saveFarmerProfile({
          nitrogen: nVal,
          phosphorus: pVal,
          potassium: kVal,
          ph: phVal,
          soil_verified_by_farmer: true,
          soil_source: 'soil_health_card_ocr'
        });
      }

      if (el.sliderN) { el.sliderN.value = nVal; if (el.valN) el.valN.textContent = nVal; }
      if (el.sliderP) { el.sliderP.value = pVal; if (el.valP) el.valP.textContent = pVal; }
      if (el.sliderK) { el.sliderK.value = kVal; if (el.valK) el.valK.textContent = kVal; }
      if (el.sliderPh) { el.sliderPh.value = phVal; if (el.valPh) el.valPh.textContent = phVal.toFixed(1); }

      navTo('recommend');
      setWizardStep(1);

      alert(state.lang === 'kn'
        ? `ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮೌಲ್ಯಗಳು (N: ${nVal}, P: ${pVal}, K: ${kVal}, pH: ${phVal}) ಬೆಳೆ ಶಿಫಾರಸು ಮಾದರಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಅನ್ವಯವಾಗಿವೆ!`
        : `Soil test values (N: ${nVal}, P: ${pVal}, K: ${kVal}, pH: ${phVal}) applied to Crop Recommendation successfully!`);
    };
  }
}

// --- 2. WATER SUITABILITY FEATURE ---
let _waterEvaluated = false;
function initWaterFeature() {
  const calcBtn = document.getElementById('calc-water-compat-btn');
  const cropSel = document.getElementById('water-crop-select');
  const sourceSel = document.getElementById('water-source-select');
  const methodSel = document.getElementById('water-method-select');
  const levelSel = document.getElementById('water-level-select');

  if (!calcBtn) return;

  async function evaluateWater() {
    const crop = cropSel?.value || 'ragi';
    const waterSource = sourceSel?.value || 'borewell';
    const irrigationMethod = methodSel?.value || 'drip';
    const waterLevel = levelSel?.value || 'moderate';

    calcBtn.disabled = true;
    calcBtn.textContent = state.lang === 'kn' ? 'ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Calculating...';

    try {
      const res = await fetch('/api/water/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: crop,
          water_source: waterSource,
          is_irrigated: (waterSource !== 'rainfed'),
          irrigation_method: irrigationMethod,
          water_availability_level: waterLevel,
          seasonal_rainfall_mm: 600.0
        })
      });
      const data = await res.json();
      if (data.status === 'success' && data.evaluation) {
        const ev = data.evaluation;
        const scoreEl = document.getElementById('water-compat-score');
        const statusEl = document.getElementById('water-compat-status');
        const reqEl = document.getElementById('water-crop-req');
        const idxEl = document.getElementById('water-avail-idx');
        const advEl = document.getElementById('water-advisory-box');

        if (scoreEl) {
          scoreEl.textContent = `${ev.compatibility_score}%`;
          if (ev.compatibility_score >= 75) scoreEl.style.color = '#10b981';
          else if (ev.compatibility_score >= 50) scoreEl.style.color = '#f59e0b';
          else scoreEl.style.color = '#ef4444';
        }
        if (statusEl) statusEl.textContent = ev.status;
        if (reqEl) {
          if (Array.isArray(ev.crop_water_requirement_mm)) {
            reqEl.textContent = `${ev.crop_water_requirement_mm[0]} - ${ev.crop_water_requirement_mm[1]} mm`;
          } else {
            reqEl.textContent = `${ev.crop_water_requirement_mm || ev.water_requirement_mm || '450 - 600'} mm`;
          }
        }
        if (idxEl) idxEl.textContent = `${ev.water_availability_index} / 1.0`;
        if (advEl) advEl.textContent = ev.advisory;
        _waterEvaluated = true;
      }
    } catch (err) {
      console.error('Water Evaluation Error:', err);
    } finally {
      calcBtn.disabled = false;
      calcBtn.textContent = state.lang === 'kn' ? '💧 ಹೊಂದಾಣಿಕೆ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ' : '💧 Evaluate Water Compatibility';
    }
  }

  calcBtn.onclick = evaluateWater;

  // Demo preset scenario chips
  const ragiChip = document.getElementById('demo-water-ragi');
  const sugarChip = document.getElementById('demo-water-sugarcane');
  const rainfedChip = document.getElementById('demo-water-rainfed');

  if (ragiChip) {
    ragiChip.onclick = () => {
      if (cropSel) cropSel.value = 'ragi';
      if (sourceSel) sourceSel.value = 'borewell';
      if (methodSel) methodSel.value = 'drip';
      if (levelSel) levelSel.value = 'moderate';
      evaluateWater();
    };
  }

  if (sugarChip) {
    sugarChip.onclick = () => {
      if (cropSel) cropSel.value = 'sugarcane';
      if (sourceSel) sourceSel.value = 'canal';
      if (methodSel) methodSel.value = 'flood';
      if (levelSel) levelSel.value = 'abundant';
      evaluateWater();
    };
  }

  if (rainfedChip) {
    rainfedChip.onclick = () => {
      if (cropSel) cropSel.value = 'maize';
      if (sourceSel) sourceSel.value = 'rainfed';
      if (methodSel) methodSel.value = 'rainfed';
      if (levelSel) levelSel.value = 'scarce';
      evaluateWater();
    };
  }

  // Initial auto-evaluation if not evaluated yet
  if (!_waterEvaluated) {
    evaluateWater();
  }
}

// --- 3. MARKET INTELLIGENCE & FORECAST FEATURE ---
let _cachedMarketData = null;
let _currentMarketFilter = 'all';

async function initMarketFeature() {
  const grid = document.getElementById('market-commodity-grid');
  const refreshBtn = document.getElementById('btn-market-refresh');
  const runForecastBtn = document.getElementById('btn-run-forecast');
  const cropSelect = document.getElementById('fc-crop-select');
  const sowingDateInput = document.getElementById('fc-sowing-date');
  const resultBox = document.getElementById('forecast-result-box');
  const chartContainer = document.getElementById('market-chart-container');
  const chartSvgEl = document.getElementById('market-chart-svg');

  if (!grid) return;

  // Category filter chips setup
  const chips = document.querySelectorAll('#market-filter-chips button');
  chips.forEach(btn => {
    btn.onclick = () => {
      chips.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'var(--bg-hover)';
        b.style.color = 'var(--text-primary)';
        b.style.borderColor = 'var(--border-color)';
      });
      btn.classList.add('active');
      btn.style.background = '#10b981';
      btn.style.color = 'white';
      btn.style.borderColor = '#10b981';

      _currentMarketFilter = btn.getAttribute('data-cat') || 'all';
      renderMarketCommodities(_cachedMarketData, _currentMarketFilter);
    };
  });

  if (refreshBtn) {
    refreshBtn.onclick = () => {
      _cachedMarketData = null;
      loadMarketData(true);
    };
  }

  // Interactive Harvest Forecaster button
  if (runForecastBtn) {
    runForecastBtn.onclick = () => {
      const selectedCrop = cropSelect ? cropSelect.value : 'tomato';
      const sowingDate = sowingDateInput ? sowingDateInput.value : '2026-10-15';
      generateHarvestForecast(selectedCrop, sowingDate);
    };
  }

  window.inspectCropForecast = (cropKey) => {
    if (cropSelect) {
      cropSelect.value = cropKey;
    }
    const sowingDate = sowingDateInput ? sowingDateInput.value : '2026-10-15';
    generateHarvestForecast(cropKey, sowingDate);
    const simulatorEl = document.getElementById('fc-crop-select');
    if (simulatorEl) {
      simulatorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  async function generateHarvestForecast(crop, sowingDate) {
    if (runForecastBtn) {
      runForecastBtn.innerHTML = '⏳ ' + (state.lang === 'kn' ? 'ಮುನ್ಸೂಚನೆ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...' : 'Forecasting...');
    }
    try {
      // 1. Fetch ML forecast
      const fcUrl = `/api/market/forecast/${crop}?sowing_date=${encodeURIComponent(sowingDate)}`;
      const fcRes = await fetch(fcUrl);
      const fcData = await fcRes.json();

      // 2. Fetch recent historical daily observations for SVG chart
      const histUrl = `/api/market/history/${crop}?days=30`;
      const histRes = await fetch(histUrl);
      const histData = await histRes.json();

      if (fcData.status === 'success' && fcData.harvest_forecast) {
        const hf = fcData.harvest_forecast;
        if (resultBox) {
          resultBox.style.display = 'block';
          const titleEl = document.getElementById('fc-crop-title');
          const datesEl = document.getElementById('fc-meta-dates');
          const modalEl = document.getElementById('fc-predicted-modal');
          const rangeEl = document.getElementById('fc-predicted-range');
          const modelEl = document.getElementById('fc-model-meta');
          const warnEl = document.getElementById('fc-warning-meta');
          const badgeEl = document.getElementById('fc-badge-status');

          if (titleEl) titleEl.textContent = `${hf.crop.toUpperCase()} — ${hf.primary_market}`;
          if (datesEl) datesEl.textContent = `Expected Harvest Window: ${hf.expected_harvest_window} (Target: ${hf.projected_harvest_date}, Horizon: ${hf.forecast_horizon_days} days)`;
          if (modalEl) modalEl.innerHTML = `₹${Number(hf.forecast_modal_price).toLocaleString('en-IN')} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">/ ${hf.price_unit}</span>`;
          if (rangeEl) rangeEl.textContent = `80% Prediction Interval: ₹${Number(hf.forecast_price_range[0]).toLocaleString('en-IN')} - ₹${Number(hf.forecast_price_range[1]).toLocaleString('en-IN')}`;
          if (modelEl) modelEl.textContent = `Model: ${hf.model_used} (${hf.historical_observations_count} APMC observations)`;
          if (warnEl) warnEl.textContent = `⚠️ ${hf.confidence_warning}`;
          if (badgeEl) {
            badgeEl.textContent = hf.data_badge || 'MODEL FORECAST';
            badgeEl.style.background = (hf.data_status === 'MODEL_FORECAST') ? '#8b5cf6' : '#6b7280';
          }
        }
      }

      if (histData.status === 'success' && histData.history && histData.history.length > 0) {
        if (chartContainer && chartSvgEl) {
          chartContainer.style.display = 'block';
          renderMarketChartSvg(histData.history, chartSvgEl, histData.crop);
        }
      }
    } catch (err) {
      console.error('Error generating harvest forecast:', err);
    } finally {
      if (runForecastBtn) {
        runForecastBtn.innerHTML = '⚡ ' + (state.lang === 'kn' ? 'ಮುನ್ಸೂಚನೆ ಲೆಕ್ಕಹಾಕಿ' : 'Generate Harvest Forecast');
      }
    }
  }

  function renderMarketChartSvg(history, container, cropName) {
    if (!history || history.length === 0 || !container) return;
    const w = container.clientWidth || 600;
    const h = 160;
    const padding = { top: 20, right: 25, bottom: 25, left: 55 };

    const prices = history.map(d => d.modal_price);
    const arrivals = history.map(d => d.arrivals_tonnes);
    const minP = Math.min(...prices) * 0.95;
    const maxP = Math.max(...prices) * 1.05;
    const maxA = Math.max(...arrivals) * 1.15;

    const n = history.length;
    const stepX = (w - padding.left - padding.right) / (n - 1);

    // Compute coordinate points
    let points = [];
    let barsSvg = '';
    history.forEach((d, i) => {
      const x = padding.left + i * stepX;
      const yP = h - padding.bottom - ((d.modal_price - minP) / (maxP - minP)) * (h - padding.top - padding.bottom);
      const barH = (d.arrivals_tonnes / maxA) * (h - padding.top - padding.bottom);
      const yA = h - padding.bottom - barH;
      points.push(`${x},${yP}`);
      barsSvg += `<rect x="${x - 3}" y="${yA}" width="6" height="${barH}" fill="#f59e0b" opacity="0.3" rx="1" />`;
    });

    const pathData = `M ` + points.join(' L ');
    const latestP = prices[prices.length - 1];
    const firstP = prices[0];
    const trendColor = latestP >= firstP ? '#10b981' : '#ef4444';

    container.innerHTML = `
      <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display: block;">
        <!-- Arrival Bars -->
        ${barsSvg}
        <!-- Grid lines -->
        <line x1="${padding.left}" y1="${h - padding.bottom}" x2="${w - padding.right}" y2="${h - padding.bottom}" stroke="var(--border-subtle)" stroke-width="1" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${w - padding.right}" y2="${padding.top}" stroke="var(--border-subtle)" stroke-dasharray="3,3" stroke-width="1" />
        <!-- Price Trend Path -->
        <path d="${pathData}" fill="none" stroke="${trendColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Latest point circle -->
        <circle cx="${padding.left + (n - 1) * stepX}" cy="${h - padding.bottom - ((latestP - minP) / (maxP - minP)) * (h - padding.top - padding.bottom)}" r="4" fill="${trendColor}" />
        <!-- Y-Axis labels -->
        <text x="${padding.left - 8}" y="${padding.top + 10}" fill="var(--text-muted)" font-size="10" text-anchor="end">₹${Math.round(maxP)}</text>
        <text x="${padding.left - 8}" y="${h - padding.bottom}" fill="var(--text-muted)" font-size="10" text-anchor="end">₹${Math.round(minP)}</text>
        <!-- X-Axis dates -->
        <text x="${padding.left}" y="${h - 6}" fill="var(--text-muted)" font-size="10" text-anchor="start">${history[0].date}</text>
        <text x="${w - padding.right}" y="${h - 6}" fill="var(--text-muted)" font-size="10" text-anchor="end">${history[history.length - 1].date}</text>
      </svg>
    `;
  }

  if (!_cachedMarketData) {
    loadMarketData(false);
  } else {
    renderMarketCommodities(_cachedMarketData, _currentMarketFilter);
  }

  async function loadMarketData(isRefresh = false) {
    if (refreshBtn && isRefresh) {
      refreshBtn.innerHTML = '⏳ ' + (state.lang === 'kn' ? 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...' : 'Refreshing...');
    }

    try {
      if (isRefresh) {
        // Trigger explicit refresh on backend
        await fetch('/api/market/refresh', { method: 'POST' });
      }
      const res = await fetch('/api/market/all');
      const data = await res.json();
      if (data.status === 'success' && data.commodities && data.commodities.length > 0) {
        _cachedMarketData = data.commodities;
        const metaEl = document.getElementById('market-refresh-meta');
        if (metaEl) {
          if (data.is_live_connected) {
            metaEl.innerHTML = `🟢 <span class="txt-kn">ಲೈವ್ APMC ಫೀಡ್</span><span class="txt-en" style="display: none;">Live APMC Feed</span> • ${data.last_refreshed_at || 'Just now'}`;
          } else {
            const repDate = data.latest_reporting_date || '2026-10-10';
            metaEl.innerHTML = `📁 <span class="txt-kn">ಸಂಗ್ರಹಿತ APMC ಮಾಹಿತಿ (ವರದಿ: ${repDate})</span><span class="txt-en" style="display: none;">Cached Benchmark (Reported: ${repDate})</span> • 🔄 ${data.last_refreshed_at || 'Recent'}`;
          }
        }
        renderMarketCommodities(_cachedMarketData, _currentMarketFilter);
      } else {
        const gridEl = document.getElementById('market-commodity-grid');
        if (gridEl) {
          const isKn = state.lang === 'kn';
          gridEl.innerHTML = `<div class="card-surface" style="padding: 24px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">⚠️ ${isKn ? 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ — ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.' : 'Market data unavailable — please try again.'}</div>`;
        }
      }
    } catch (err) {
      console.error('Market Intelligence fetch error:', err);
      const gridEl = document.getElementById('market-commodity-grid');
      if (gridEl) {
        const isKn = state.lang === 'kn';
        gridEl.innerHTML = `<div class="card-surface" style="padding: 24px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">⚠️ ${isKn ? 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ — ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ.' : 'Market data unavailable — please try again.'}</div>`;
      }
    } finally {
      if (refreshBtn) {
        refreshBtn.innerHTML = '🔄 <span class="txt-kn">ದರ ನವೀಕರಿಸಿ</span><span class="txt-en" style="display: none;">Refresh Prices</span>';
      }
    }
  }

  function renderMarketCommodities(commodities, filterCat = 'all') {
    if (!commodities || !grid) return;
    grid.innerHTML = '';
    const isKn = state.lang === 'kn';

    const catMap = {
      ragi: 'cereal',
      maize: 'cereal',
      rice: 'cereal',
      cotton: 'commercial',
      sugarcane: 'commercial',
      arecanut: 'commercial',
      tomato: 'vegetable',
      groundnut: 'commercial',
      onion: 'vegetable',
      chilli: 'vegetable',
      turmeric: 'commercial',
      chickpea: 'cereal'
    };

    const filtered = (filterCat === 'all') 
      ? commodities 
      : commodities.filter(item => catMap[item.crop.toLowerCase()] === filterCat);

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="card-surface" style="padding: 24px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">⚠️ ${isKn ? 'ಈ ವರ್ಗದಲ್ಲಿ ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.' : 'No market records available in this category.'}</div>`;
      return;
    }

    filtered.forEach(item => {
      const p = item.current_price;
      const t = item.trend_analysis;
      const f = item.harvest_forecast;
      const isUp = (t.trend_30d_percent >= 0);
      const trendBadgeColor = isUp ? '#10b981' : '#ef4444';
      const trendSymbol = isUp ? '▲ +' : '▼ ';
      const obsDate = p.observation_date || p.bulletin_date;

      let statusBadge = '';
      if (p.is_live) {
        statusBadge = `<span style="background: #10b981; color: white; padding: 2px 7px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; white-space: nowrap;">LIVE APMC</span>`;
      } else if (p.data_status === 'ACTUAL_OBSERVATION') {
        statusBadge = `<span style="background: #d97706; color: white; padding: 2px 7px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; white-space: nowrap;">CACHED (${obsDate})</span>`;
      } else {
        statusBadge = `<span style="background: #6b7280; color: white; padding: 2px 7px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; white-space: nowrap;">DEMO DATA</span>`;
      }

      const cropEmojiMap = {
        ragi: '🌾',
        maize: '🌽',
        rice: '🌾',
        cotton: '🌿',
        sugarcane: '🎋',
        arecanut: '🌴',
        tomato: '🍅',
        groundnut: '🥜',
        onion: '🧅',
        chilli: '🌶️',
        turmeric: '🪴',
        chickpea: '🫘'
      };
      const emoji = cropEmojiMap[item.crop.toLowerCase()] || '🌱';

      const card = document.createElement('div');
      card.className = 'card-surface';
      card.style.cssText = 'background: var(--bg-card); padding: 18px; border-radius: 14px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: transform 0.2s ease;';
      card.onmouseenter = () => { card.style.transform = 'translateY(-2px)'; };
      card.onmouseleave = () => { card.style.transform = 'translateY(0)'; };

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.5rem;">${emoji}</span>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${item.crop.toUpperCase()}</strong>
                ${statusBadge}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${p.primary_market} (${p.district})</div>
            </div>
          </div>
          <span class="badge" style="background: ${trendBadgeColor}; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; white-space: nowrap;">
            ${trendSymbol}${t.trend_30d_percent.toFixed(1)}% (30d)
          </span>
        </div>

        <div style="margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${isKn ? 'ಮಾದರಿ APMC ದರ' : 'Current Modal APMC Price'}</span>
            <span style="font-size: 0.7rem; color: var(--text-muted);">📅 ${isKn ? 'ವರದಿ' : 'Reported'}: ${obsDate}</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 2px;">
            ₹${Number(p.modal_price).toLocaleString('en-IN')} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">/ ${p.price_unit}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
            <span>${isKn ? 'ಕನಿಷ್ಠ' : 'Min'}: ₹${Number(p.min_price).toLocaleString('en-IN')}</span>
            <span>${isKn ? 'ಗರಿಷ್ಠ' : 'Max'}: ₹${Number(p.max_price).toLocaleString('en-IN')}</span>
            <span>${isKn ? 'ಆವಕ' : 'Arrivals'}: ${p.arrivals_tonnes} t</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--text-muted); margin-top: 5px; opacity: 0.85;">
            <span>${p.is_live ? '🟢 ' + (isKn ? 'ಲೈವ್ ಫೀಡ್' : 'Live Feed') : '📁 ' + (isKn ? 'ಸಂಗ್ರಹಿತ ಮಾಹಿತಿ' : 'Cached Benchmark')}</span>
            <span>🔄 ${isKn ? 'ನವೀಕರಣ' : 'Refreshed'}: ${p.last_refresh_time || 'Recent'}</span>
          </div>
        </div>

        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(139, 92, 246, 0.06); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.72rem; color: #7c3aed; font-weight: 600;">
              🔮 ${isKn ? 'ಕೊಯ್ಲು ಮುನ್ಸೂಚನೆ (ML)' : 'Harvest ML Forecast'}
            </span>
            <span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.62rem; font-weight: 700;">MODEL FORECAST</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
            <span style="font-size: 1.05rem; font-weight: 700; color: #7c3aed;">
              ₹${Number(f.forecast_price_range[0]).toLocaleString('en-IN')} - ₹${Number(f.forecast_price_range[1]).toLocaleString('en-IN')}
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">
              ${f.expected_harvest_window || f.harvest_window}
            </span>
          </div>
        </div>

        <button type="button" class="btn btn-sm" style="margin-top: 12px; width: 100%; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-hover); color: var(--text-primary); cursor: pointer; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="window.inspectCropForecast('${item.crop.toLowerCase()}')">
          📈 <span class="txt-kn">ಇತಿಹಾಸ & ಮುನ್ಸೂಚನೆ ವಿವರ</span><span class="txt-en" style="display: none;">View Trends & Harvest Forecast</span>
        </button>
      `;
      grid.appendChild(card);
    });
  }
}


// ==============================================================================
// MANNUMITRA MILESTONE 1: SHARED FARM PROFILE & MULTI-STAGE DECISION SUPPORT
// ==============================================================================

const FARM_STORAGE_KEY = 'mannumitra_farmer_profile';

const DEFAULT_FARM_PROFILE = {
  district: 'Mandya',
  soil_type: 'red_soil',
  nitrogen: 90,
  phosphorus: 42,
  potassium: 43,
  ph: 6.5,
  temperature: 24.5,
  humidity: 65,
  rainfall: 200,
  soil_verified_by_farmer: false,
  soil_source: 'standard_defaults',
  water_source: 'borewell',
  is_irrigated: true,
  irrigation_method: 'drip',
  water_availability_level: 'moderate',
  water_quality: 'normal',
  measured_ec_ds_m: null,
  sowing_date: '2026-06-15',
  priority_mode: 'balanced',
  farm_area_acres: 1.0,
  selected_mandi: ''
};

window.getFarmerProfile = function() {
  try {
    const saved = localStorage.getItem(FARM_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_FARM_PROFILE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Error reading farmer profile:', e);
  }
  return { ...DEFAULT_FARM_PROFILE };
};

window.saveFarmerProfile = function(updates) {
  try {
    const current = window.getFarmerProfile();
    const merged = { ...current, ...updates };
    localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(merged));
    window.updateFarmerProfileUI(merged);
    return merged;
  } catch (e) {
    console.warn('Error saving farmer profile:', e);
    return { ...DEFAULT_FARM_PROFILE, ...updates };
  }
};

window.confirmClearFarmerProfile = function() {
  const isKn = state.lang === 'kn';
  const msg = isKn
    ? 'ನಿಮ್ಮ ಜಮೀನಿನ ಉಳಿಸಿದ ಮಾಹಿತಿ, ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿದ್ದೀರಾ?\n(Are you sure you want to clear your saved farm profile data?)'
    : 'Are you sure you want to clear your saved farm profile, verified soil data, and preferences?';
  
  if (window.confirm(msg)) {
    window.clearFarmerProfile();
  }
};

window.clearFarmerProfile = function() {
  localStorage.removeItem(FARM_STORAGE_KEY);
  const def = { ...DEFAULT_FARM_PROFILE };
  window.updateFarmerProfileUI(def);

  // Reset Core Main Form Controls
  const elWaterLvl = document.getElementById('rec-water-level'); if (elWaterLvl) elWaterLvl.value = 'moderate';
  const elSow = document.getElementById('rec-sowing-date'); if (elSow) elSow.value = '2026-06-15';

  // Reset Additional Strategy Controls
  const elWaterSrc = document.getElementById('rec-water-source'); if (elWaterSrc) elWaterSrc.value = 'borewell';
  const elIrrig = document.getElementById('rec-irrigation-method'); if (elIrrig) elIrrig.value = 'drip';
  const elQuality = document.getElementById('rec-water-quality'); if (elQuality) elQuality.value = 'normal';
  const elArea = document.getElementById('rec-farm-area'); if (elArea) elArea.value = '1.0';
  const elMandi = document.getElementById('rec-preferred-mandi'); if (elMandi) elMandi.value = '';
  const elMode = document.getElementById('rec-priority-mode'); if (elMode) elMode.value = 'balanced';

  // Reset Application State Form
  state.form.district = 'Mandya';
  state.form.soil_type = 'red_soil';

  // Reset Soil selection cards & district chips
  const redSoilObj = state.soilTypes.find(s => s.id === 'red_soil');
  if (redSoilObj) selectSoil(redSoilObj, true);
  const mandyaDistObj = KARNATAKA_DISTRICTS.find(d => d.id === 'Mandya');
  if (mandyaDistObj) selectDistrictForStep3(mandyaDistObj);

  updateTopActivePillAndSummary();
  updateSoilNutrientsStatusUI(def);

  alert(state.lang === 'kn' ? 'ಜಮೀನಿನ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಮಣ್ಣಿನ ಮೌಲ್ಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ.' : 'Farm profile and soil test parameters successfully cleared.');
};

window.updateFarmerProfileUI = function(p) {
  if (!p) p = window.getFarmerProfile();

  // Verification Badge in Water Resources card
  const badge = document.getElementById('farm-soil-verification-badge');
  const icon = document.getElementById('soil-verif-icon');
  const text = document.getElementById('soil-verif-text');
  if (badge && text) {
    if (p.soil_verified_by_farmer) {
      badge.style.background = '#ecfdf5';
      badge.style.color = '#065f46';
      badge.style.borderColor = '#10b981';
      if (icon) icon.textContent = '✓';
      text.textContent = state.lang === 'kn' ? 'ದೃಢೀಕೃತ ಮಣ್ಣು ಪರೀಕ್ಷೆ (SHC OCR)' : 'Verified Soil Health Card (SHC)';
    } else {
      badge.style.background = '#eff6ff';
      badge.style.color = '#1e40af';
      badge.style.borderColor = '#bfdbfe';
      if (icon) icon.textContent = '⚡';
      text.textContent = state.lang === 'kn' ? 'ಪ್ರಾದೇಶಿಕ ಅಂದಾಜು / Regional Baseline' : 'Regional Baseline (ICAR Mandya)';
    }
  }

  // Update Soil Nutrients Card Status Indicator
  updateSoilNutrientsStatusUI(p);

  // Core Main Inputs
  const elLevel = document.getElementById('rec-water-level'); if (elLevel && p.water_availability_level) elLevel.value = p.water_availability_level;
  const elSow = document.getElementById('rec-sowing-date'); if (elSow && p.sowing_date) elSow.value = p.sowing_date;

  // Additional Strategy Inputs
  const elSource = document.getElementById('rec-water-source'); if (elSource && p.water_source) elSource.value = p.water_source;
  const elMethod = document.getElementById('rec-irrigation-method'); if (elMethod && p.irrigation_method) elMethod.value = p.irrigation_method;
  const elQuality = document.getElementById('rec-water-quality'); if (elQuality && p.water_quality) elQuality.value = p.water_quality;
  const elMode = document.getElementById('rec-priority-mode'); if (elMode && p.priority_mode) elMode.value = p.priority_mode;
  const elArea = document.getElementById('rec-farm-area'); if (elArea && p.farm_area_acres) elArea.value = p.farm_area_acres;
  const elMandi = document.getElementById('rec-preferred-mandi'); if (elMandi && p.selected_mandi) elMandi.value = p.selected_mandi;
};

// Listen to changes on Strategy and Water inputs
document.addEventListener('change', (e) => {
  if (!e.target) return;
  const id = e.target.id;
  if (id === 'rec-water-level') {
    window.saveFarmerProfile({ water_availability_level: e.target.value });
  } else if (id === 'rec-sowing-date') {
    window.saveFarmerProfile({ sowing_date: e.target.value });
  } else if (id === 'rec-water-source') {
    window.saveFarmerProfile({ water_source: e.target.value });
  } else if (id === 'rec-irrigation-method') {
    window.saveFarmerProfile({ irrigation_method: e.target.value });
  } else if (id === 'rec-water-quality') {
    window.saveFarmerProfile({ water_quality: e.target.value });
  } else if (id === 'rec-farm-area') {
    window.saveFarmerProfile({ farm_area_acres: parseFloat(e.target.value) || 1.0 });
  } else if (id === 'rec-preferred-mandi') {
    window.saveFarmerProfile({ selected_mandi: e.target.value });
  } else if (id === 'rec-priority-mode') {
    const mode = e.target.value;
    const desc = document.getElementById('priority-mode-desc-text');
    if (desc) {
      if (mode === 'water_priority') {
        desc.textContent = state.lang === 'kn'
          ? 'ನೀರಿನ ಉಳಿತಾಯ ಆದ್ಯತೆ: ನೀರಿನ ಹೊಂದಾಣಿಕೆಗೆ 50%, ಕೃಷಿ ವಿಜ್ಞಾನಕ್ಕೆ 30%, ಮಾರುಕಟ್ಟೆಗೆ 20% ತೂಕ. ನೀರಾವರಿ ಕೊರತೆಯುಳ್ಳ ಪ್ರದೇಶಗಳಿಗೆ ಸೂಕ್ತ.'
          : 'Water Conservation Priority: 50% weight on water compatibility, 30% agronomic match, 20% market. Prioritizes drought-resilient crops.';
      } else if (mode === 'market_priority') {
        desc.textContent = state.lang === 'kn'
          ? 'ಮಾರುಕಟ್ಟೆ ಆದಾಯ ಆದ್ಯತೆ: ಮಾರುಕಟ್ಟೆ ದರ & ಪ್ರವೃತ್ತಿಗೆ 55%, ಕೃಷಿ ವಿಜ್ಞಾನಕ್ಕೆ 30%, ನೀರಿಗೆ 15% ತೂಕ. ಹೆಚ್ಚಿನ APMC ಮಾರುಕಟ್ಟೆ ಆದಾಯಕ್ಕೆ ಆದ್ಯತೆ.'
          : 'Market Value Priority: 55% weight on APMC price & momentum, 30% agronomic match, 15% water. Maximizes revenue potential.';
      } else {
        desc.textContent = state.lang === 'kn'
          ? 'ಸಮತೋಲಿತ ವಿಧಾನ: ಕೃಷಿ ವಿಜ್ಞಾನ (45%), ನೀರಿನ ಹೊಂದಾಣಿಕೆ (25%) ಮತ್ತು ಮಾರುಕಟ್ಟೆ ದರ/ಪ್ರವೃತ್ತಿಯನ್ನು (30%) ಸಮನ್ವಯಗೊಳಿಸುತ್ತದೆ.'
          : 'Balanced Strategy: 45% agronomic match, 25% water compatibility, 30% APMC market price & 30-day momentum.';
      }
    }
    window.saveFarmerProfile({ priority_mode: mode });
  }
});

// Update Soil Health Card Apply Button
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.updateFarmerProfileUI();
  }, 300);
});

// Override / Enhance fetchRecommendation with Unified Multi-Stage Payload
window.fetchRecommendation = async function() {
  showLoading(true);

  try {
    const prof = window.getFarmerProfile();
    const curDistrict = state.form.district || 'Mandya';
    const curSoilType = state.form.soil_type || 'red_soil';
    const curSource = document.getElementById('rec-water-source')?.value || prof.water_source || 'borewell';
    const curMethod = document.getElementById('rec-irrigation-method')?.value || prof.irrigation_method || 'drip';
    const curLevel = document.getElementById('rec-water-level')?.value || prof.water_availability_level || 'moderate';
    const curQuality = document.getElementById('rec-water-quality')?.value || prof.water_quality || 'normal';
    const curSow = document.getElementById('rec-sowing-date')?.value || prof.sowing_date || '2026-06-15';
    const curMode = document.getElementById('rec-priority-mode')?.value || prof.priority_mode || 'balanced';
    const curArea = parseFloat(document.getElementById('rec-farm-area')?.value || prof.farm_area_acres || 1.0);
    const curMandi = document.getElementById('rec-preferred-mandi')?.value || prof.selected_mandi || null;

    // Save profile state
    window.saveFarmerProfile({
      district: curDistrict,
      soil_type: curSoilType,
      water_source: curSource,
      irrigation_method: curMethod,
      water_availability_level: curLevel,
      water_quality: curQuality,
      sowing_date: curSow,
      priority_mode: curMode,
      farm_area_acres: curArea,
      selected_mandi: curMandi || ''
    });

    const payload = {
      // 7 Core ML Features strictly used by Random Forest
      nitrogen: parseFloat(document.getElementById('slider-n')?.value || state.form.nitrogen || 90),
      phosphorus: parseFloat(document.getElementById('slider-p')?.value || state.form.phosphorus || 42),
      potassium: parseFloat(document.getElementById('slider-k')?.value || state.form.potassium || 43),
      temperature: parseFloat(document.getElementById('slider-temp')?.value || state.form.temperature || 24.5),
      humidity: parseFloat(document.getElementById('slider-hum')?.value || state.form.humidity || 65),
      ph: parseFloat(document.getElementById('slider-ph')?.value || state.form.ph || 6.5),
      rainfall: parseFloat(document.getElementById('slider-rain')?.value || state.form.rainfall || 200),

      // Farm context
      district: curDistrict,
      soil_type: curSoilType,
      farm_area_acres: curArea,
      selected_mandi: curMandi || null,

      // Water & Planning context
      water_source: curSource,
      is_irrigated: (curSource !== 'rainfed'),
      irrigation_method: curMethod,
      water_availability_level: curLevel,
      water_quality: curQuality,
      sowing_date: curSow,
      priority_mode: curMode,
      soil_verified_by_farmer: prof.soil_verified_by_farmer
    };

    const res = await fetch(`${API_BASE}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }

    const data = await res.json();
    state.lastRecommendation = data;

    // Render visual crop recommendation cards (Top 3 Model Predicted + 3 Alternative Crops)
    renderRecommendationResult(data);
    renderMilestone1Top3DecisionCards(data);

    setWizardStep(4);
    
    // Scroll smoothly to results
    const root = document.getElementById('screen-result');
    if (root) root.scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    alert(`ದೋಷ: ${err.message}\nError: ${err.message}`);
    console.error('fetchRecommendation Error:', err);
  } finally {
    showLoading(false);
  }
};

// Global Toggle Handler for Details Drawers
window.toggleCompactDetails = function(drawerId, btn) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  const isKn = state.lang === 'kn';
  const isHidden = (drawer.style.display === 'none' || !drawer.style.display);
  if (isHidden) {
    drawer.style.display = 'block';
    if (btn) {
      btn.innerHTML = `<span>${isKn ? 'ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ ↑' : 'Hide Details ↑'}</span>`;
      btn.classList.add('active');
    }
  } else {
    drawer.style.display = 'none';
    if (btn) {
      btn.innerHTML = `<span>${isKn ? 'ವಿವರಗಳನ್ನು ನೋಡಿ ↓' : 'View Details ↓'}</span>`;
      btn.classList.remove('active');
    }
  }
};
window.toggleVisualDetails = window.toggleCompactDetails;

// Render Dual Pipelines: Top 3 Overall + Agronomic Alternatives
function renderMilestone1Top3DecisionCards(data) {
  const root = document.getElementById('milestone1-top3-results-root');
  if (!root) return;

  const crops = (data.recommended_crops || []).slice(0, 3);
  if (crops.length === 0) {
    root.innerHTML = '';
    return;
  }

  // Cleanly hide legacy dashboard elements, why-lists, alternative crop cards, and unsuitable panels
  const legacyElements = document.querySelectorAll(
    '#screen-result .hero-crop-featured-card, ' +
    '#screen-result .rec-section-card, ' +
    '#screen-result .clean-drawer, ' +
    '#screen-result .rec-result-header, ' +
    '#screen-result #unsuitable-section'
  );
  legacyElements.forEach(el => el.style.display = 'none');

  const isKn = state.lang === 'kn';

  const cropIcons = {
    ragi: '🌾', groundnut: '🥜', rice: '🌾', maize: '🌽', cotton: '☁️',
    sugarcane: '🎋', pigeonpeas: '🌱', chickpea: '🫘', tomato: '🍅',
    arecanut: '🌴', coffee: '☕', turmeric: '🌿', banana: '🍌', jowar: '🌾',
    bajra: '🌾', onion: '🧅', chilli: '🌶️', sunflower: '🌻', papaya: '🌱', coconut: '🥥',
    soybean: '🫘', blackgram: '🫘', mungbean: '🫘', horsegram: '🫘',
    cardamom: '🌿', cashew: '🥜', mulberry: '🍃', sapota: '🥔'
  };

  const cropNamesKn = {
    ragi: 'ರಾಗಿ (Finger Millet)', groundnut: 'ಕಡಲೆಕಾಯಿ (Groundnut)', rice: 'ಭತ್ತ (Paddy Rice)',
    maize: 'ಮೆಕ್ಕೆಜೋಳ (Maize)', cotton: 'ಹತ್ತಿ (Cotton)', sugarcane: 'ಕಬ್ಬು (Sugarcane)',
    pigeonpeas: 'ತೊಗರಿ (Red Gram)', chickpea: 'ಕಡಲೆ (Bengal Gram)', tomato: 'ಟೊಮೆಟೊ (Tomato)',
    arecanut: 'ಅಡಿಕೆ (Arecanut)', coffee: 'ಕಾಫಿ (Coffee)', turmeric: 'ಅರಿಶಿನ (Turmeric)',
    banana: 'ಬಾಳೆ (Banana)', jowar: 'ಜೋಳ (Jowar)', bajra: 'ಸಜ್ಜೆ (Bajra)',
    onion: 'ಈರುಳ್ಳಿ (Onion)', chilli: 'ಮೆಣಸಿನಕಾಯಿ (Chilli)', sunflower: 'ಸೂರ್ಯಕಾಂತಿ (Sunflower)',
    papaya: 'ಪರಂಗಿ (Papaya)', coconut: 'ತೆಂಗು (Coconut)',
    watermelon: 'ಕಲ್ಲಂಗಡಿ (Watermelon)', pepper: 'ಕರಿಮೆಣಸು (Black Pepper)',
    muskmelon: 'ಖರ್ಬೂಜ (Muskmelon)', mango: 'ಮಾವಿನಹಣ್ಣು (Mango)',
    grapes: 'ದ್ರಾಕ್ಷಿ (Grapes)', pomegranate: 'ದಾಳಿಂಬೆ (Pomegranate)', ginger: 'ಶುಂಠಿ (Ginger)',
    soybean: 'ಸೋಯಾಬೀನ್ (Soybean)', blackgram: 'ಉದ್ದು (Black Gram)', mungbean: 'ಹೆಸರುಕಾಳು (Green Gram)',
    horsegram: 'ಹುರುಳಿ (Horse Gram)', cardamom: 'ಏಲಕ್ಕಿ (Cardamom)', cashew: 'ಗೋಡಂಬಿ (Cashew)',
    mulberry: 'ಹಿಪ್ಪುನೇರಳೆ (Mulberry)', sapota: 'ಚಿಕ್ಕು (Sapota)'
  };

  const cropNamesEn = {
    ragi: 'Ragi (Finger Millet)', groundnut: 'Groundnut', rice: 'Paddy (Rice)',
    maize: 'Maize (Corn)', cotton: 'Cotton', sugarcane: 'Sugarcane',
    pigeonpeas: 'Red Gram (Pigeonpea)', chickpea: 'Bengal Gram (Chickpea)', tomato: 'Tomato',
    arecanut: 'Arecanut', coffee: 'Coffee', turmeric: 'Turmeric',
    banana: 'Banana', jowar: 'Jowar (Sorghum)', bajra: 'Bajra (Pearl Millet)',
    onion: 'Onion', chilli: 'Green Chilli', sunflower: 'Sunflower',
    papaya: 'Papaya', coconut: 'Coconut', watermelon: 'Watermelon',
    pepper: 'Black Pepper', muskmelon: 'Muskmelon', mango: 'Mango',
    grapes: 'Grapes', pomegranate: 'Pomegranate', ginger: 'Ginger',
    soybean: 'Soybean', blackgram: 'Black Gram', mungbean: 'Green Gram (Moong)',
    horsegram: 'Horse Gram', cardamom: 'Cardamom', cashew: 'Cashew',
    mulberry: 'Mulberry', sapota: 'Sapota'
  };

  // Helper for detailed information drawer (revealed only upon clicking View Details)
  function renderDetailDrawerHtml(c, drawerId, isAlternative) {
    const pNextStep = (isKn && c.practical_next_step_kn)
      ? c.practical_next_step_kn
      : (c.practical_next_step || (isKn ? 'ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ.' : 'Consult local Raitha Samparka Kendra for field verification.'));

    let scopeNoteHtml = '';
    if (isAlternative) {
      scopeNoteHtml = `
        <div class="visual-detail-block" style="border-left: 3px solid #0284c7; background: #f0f9ff;">
          <h4 style="color: #0369a1;">ℹ️ ${isKn ? 'ಕೃಷಿ ಸೂಕ್ತತೆ ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ' : 'Agronomic Evaluation Scope'}</h4>
          <p style="color: #0c4a6e; font-size: 0.84rem;">
            ${isKn
              ? 'ಈ ಬೆಳೆಯನ್ನು ಕೇವಲ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶಗಳು (NPK, pH) ಮತ್ತು ಹವಾಮಾನ ಸೂಕ್ತತೆಗಾಗಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಮಾರುಕಟ್ಟೆ ದರ ಅಥವಾ ನೀರಿನ ನಿರ್ಬಂಧಗಳನ್ನು ಇದಕ್ಕೆ ಅನ್ವಯಿಸಿಲ್ಲ. ಬಿತ್ತುವ ಮುನ್ನ ನಿಮ್ಮ ಹೊಲದ ನೀರಾವರಿ ಲಭ್ಯತೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
              : 'Evaluated solely on soil nutrient compatibility (NPK, pH) and regional climate suitability, without factoring in market prices or water constraints. Verify irrigation availability and mandi demand before planting.'}
          </p>
        </div>
      `;
    }

    const mandiPriceText = c.market_modal_price
      ? `₹${Number(c.market_modal_price).toLocaleString('en-IN')}/${c.price_unit || 'Quintal'} (${c.market_primary_mandi || 'APMC'})`
      : (isKn ? 'ಮಾರುಕಟ್ಟೆ ದರ ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ' : 'Mandi price data currently unavailable');

    const mandiDateText = c.market_observation_date || c.market_bulletin_date || 'N/A';

    return `
      <div class="visual-details-drawer" id="${drawerId}" style="display: none;">
        ${scopeNoteHtml}

        <!-- 1. Soil and Climate Suitability -->
        <div class="visual-detail-block">
          <h4>🌱 ${isKn ? 'ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ಹೊಂದಾಣಿಕೆ' : 'Soil and Climate Suitability'}</h4>
          <p>${c.detailed_explanations?.soil_and_climate_compatibility || (isKn ? 'ನಿಮ್ಮ ಪ್ರದೇಶದ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನಕ್ಕೆ ಸೂಕ್ತವಾಗಿದೆ.' : 'Well-suited for regional agro-climatic conditions.')}</p>
        </div>

        <!-- 2. Water Requirements -->
        <div class="visual-detail-block">
          <h4>💧 ${isKn ? 'ನೀರಿನ ಅಗತ್ಯತೆಗಳು ಮತ್ತು ಸಲಹೆ' : 'Water Requirements & Irrigation Advice'}</h4>
          <p>${c.detailed_explanations?.water_demand_and_constraints || c.water_advisory || (isKn ? 'ಬೆಳೆಯ ನೀರಾವರಿ ಅಗತ್ಯತೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.' : 'Check local irrigation and rainfall requirements.')}</p>
        </div>

        <!-- 3. Available Mandi Prices -->
        <div class="visual-detail-block">
          <h4>💰 ${isKn ? 'ಲಭ್ಯವಿರುವ ಮಾರುಕಟ್ಟೆ ದರಗಳು' : 'Available Mandi Prices'}</h4>
          <p>${c.detailed_explanations?.current_mandi_price_and_date || mandiPriceText}</p>
          <div class="visual-detail-meta">
            <span>${isKn ? 'ಮಾರುಕಟ್ಟೆ:' : 'Market:'} <strong>${c.market_primary_mandi || 'APMC'}</strong></span>
            <span>• ${isKn ? 'ದಿನಾಂಕ:' : 'Date:'} <strong>${mandiDateText}</strong></span>
          </div>
        </div>

        <!-- 4. Planting and Harvesting Information -->
        <div class="visual-detail-block">
          <h4>📅 ${isKn ? 'ಬಿತ್ತನೆ ಮತ್ತು ಕೊಯ್ಲು ಮಾಹಿತಿ' : 'Planting and Harvesting Information'}</h4>
          <p>${c.detailed_explanations?.price_trend_and_forecast_uncertainty || (c.harvest_window ? (isKn ? `ಕೊಯ್ಲು ಅವಧಿ: ${c.harvest_window}` : `Harvest window: ${c.harvest_window}`) : (isKn ? 'ಸ್ಥಳೀಯ ಋತುಮಾನಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಬಿತ್ತನೆ ಮಾಡಿ.' : 'Plant according to regional season.'))}</p>
        </div>

        <!-- 5. Important Advice and Next Steps -->
        <div class="visual-detail-block" style="border-left: 3px solid #16a34a; background: #f0fdf4;">
          <h4 style="color: #166534;">👉 ${isKn ? 'ಮುಖ್ಯ ಸಲಹೆ ಮತ್ತು ಮುಂದಿನ ಹೆಜ್ಜೆ' : 'Important Advice & Next Step'}</h4>
          <p style="color: #14532d; font-weight: 500;">${pNextStep}</p>
        </div>
      </div>
    `;
  }

  let html = `
    <div class="rec-results-container">

      <!-- ============================================================== -->
      <!-- SECTION 1: TOP 3 MODEL PREDICTED CROPS                         -->
      <!-- ============================================================== -->
      <section class="rec-section-box" id="rec-overall-top3-section">
        <div class="rec-section-hdr">
          <div class="rec-section-hdr-row">
            <span class="rec-section-hdr-icon">🌾</span>
            <h2 class="rec-section-hdr-title">${isKn ? 'ಮಾದರಿ ಮುನ್ಸೂಚಿತ ಅಗ್ರ 3 ಬೆಳೆಗಳು (Top 3 Model Predicted Crops)' : 'Top 3 Model Predicted Crops'}</h2>
          </div>
          <p class="rec-section-hdr-sub">
            ${isKn
              ? 'Random Forest ಮಾದರಿಯು ನಿಮ್ಮ 7 ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ವಿವರಗಳನ್ನು (N, P, K, pH, ತಾಪಮಾನ, ಆರ್ದ್ರತೆ, ಮಳೆ) ವಿಶ್ಲೇಷಿಸಿ ಮುನ್ಸೂಚಿಸಿದ ಅಗ್ರ 3 ಬೆಳೆಗಳು.'
              : 'Top 3 crops predicted by the Random Forest model from your 7 soil nutrient and climate parameters.'}
          </p>
        </div>

        <div class="rec-top3-grid">
  `;

  // Render Exactly 3 Top Model Predicted Visual Cards
  crops.forEach((c, idx) => {
    const rank = idx + 1;
    const cropId = c.crop.toLowerCase();
    const cropName = isKn
      ? (c.name_kn || cropNamesKn[cropId] || c.crop.toUpperCase())
      : (c.name_en || cropNamesEn[cropId] || c.crop.toUpperCase());
    const cropIcon = cropIcons[cropId] || '🌱';
    const imgSrc = getCropVisualImage(cropId);
    const drawerId = `details-top3-${rank}`;

    // Prominence styling for #1
    const cardClass = rank === 1 ? 'visual-alt-card top-rank-1' : 'visual-alt-card';
    const badgeClass = rank === 1 ? 'visual-alt-badge badge-rank-1' : (rank === 2 ? 'visual-alt-badge badge-rank-2' : 'visual-alt-badge badge-rank-3');
    const rankBadgeText = `#${rank} ${isKn ? (rank === 1 ? 'ಅತ್ಯುತ್ತಮ ಶಿಫಾರಸು' : 'ಮುನ್ಸೂಚನೆ') : (rank === 1 ? 'Top Recommendation' : 'Prediction')}`;

    // One short explanation
    let shortSentence = '';
    if (isKn) {
      shortSentence = c.short_explanation_kn || (rank === 1
        ? 'ಮಣ್ಣು, ನೀರಿನ ಲಭ್ಯತೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಮೌಲ್ಯವನ್ನು ಪರಿಗಣಿಸಿ ಅತ್ಯುತ್ತಮ ಸಮಗ್ರ ಆಯ್ಕೆ.'
        : (rank === 2
          ? 'ಉತ್ತಮ ಕೃಷಿ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಸಮತೋಲಿತ ಸಂಪನ್ಮೂಲ ಸಾಮರ್ಥ್ಯ ಹೊಂದಿರುವ ಆಯ್ಕೆ.'
          : 'ಸ್ಥಳೀಯ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳಿಗೆ ಹೊಂದಿಕೊಳ್ಳುವ ಪ್ರಾಯೋಗಿಕ ಬೆಳೆ.'));
    } else {
      shortSentence = c.short_explanation_en || (rank === 1
        ? 'Best overall match considering your soil, water availability, and market value.'
        : (rank === 2
          ? 'Strong secondary option with balanced agronomic and farming feasibility.'
          : 'Viable farming choice compatible with local soil and seasonal conditions.'));
    }

    html += `
      <div class="${cardClass}">
        <div class="visual-alt-photo-wrap">
          <img src="${imgSrc}" alt="${cropName}" class="visual-alt-img" loading="lazy" onerror="this.onerror=null; this.src='public/images/crops/default_crop.svg';">
          <span class="${badgeClass}">${rankBadgeText}</span>
        </div>

        <div class="visual-alt-body">
          <h3 class="visual-alt-title">${cropIcon} ${cropName}</h3>
          <p class="visual-alt-desc">${shortSentence}</p>

          <div class="rec-card-footer">
            <button type="button" class="rec-btn-details-toggle" data-target="${drawerId}" onclick="toggleCompactDetails('${drawerId}', this)">
              <span>${isKn ? 'ವಿವರಗಳನ್ನು ನೋಡಿ ↓' : 'View Details ↓'}</span>
            </button>

            <!-- Expandable Deep Details Drawer -->
            ${renderDetailDrawerHtml(c, drawerId, false)}
          </div>
        </div>
      </div>
    `;
  });

  html += `
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- SECTION 2: 3 ALTERNATIVE CROPS — SOIL & AGRONOMIC SUITABILITY  -->
      <!-- ============================================================== -->
      <section class="rec-section-box" id="rec-agronomic-alternatives-section">
        <div class="rec-section-hdr">
          <div class="rec-section-hdr-row">
            <span class="rec-section-hdr-icon">🌱</span>
            <h2 class="rec-section-hdr-title">${isKn ? '3 ಪರ್ಯಾಯ ಬೆಳೆಗಳು — ಮಣ್ಣು ಮತ್ತು ಕೃಷಿ ಸೂಕ್ತತೆ (3 Alternative Crops)' : '3 Alternative Crops — Soil & Agronomic Fit'}</h2>
          </div>
          <p class="rec-section-hdr-sub">
            ${isKn
              ? 'ಕೇವಲ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶಗಳು (NPK), pH ಮತ್ತು ಹವಾಮಾನ ಹೊಂದಾಣಿಕೆಯ ಆಧಾರದ ಮೇಲೆ ಪ್ರತ್ಯೇಕವಾಗಿ ಶ್ರೇಯಾಂಕ ನೀಡಲಾಗಿದೆ (ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳಿಂದ ಪ್ರಭಾವಿತವಾಗಿಲ್ಲ).'
              : 'Ranked strictly on soil nutrient compatibility (NPK), pH, and climate factors — independent of market prices or water availability.'}
          </p>
        </div>
  `;

  // Agronomic Alternatives from Pipeline B (Strictly deduplicated against top 3)
  const topCropKeys = new Set(crops.map(c => (c.crop || c.id || '').toLowerCase().trim()));
  const altCrops = (data.agronomic_alternative_crops || data.alternative_crops || [])
    .filter(a => !topCropKeys.has((a.crop || a.id || '').toLowerCase().trim()))
    .slice(0, 3);

  if (altCrops.length === 0) {
    html += `
      <div class="rec-alt-empty-notice">
        <span style="font-size: 1.4rem;">ℹ️</span>
        <span>${isKn ? 'ಲಭ್ಯವಿರುವ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ಮಾಹಿತಿಯಿಂದ ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಕೃಷಿ ಪರ್ಯಾಯಗಳನ್ನು ನಿರ್ಧರಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ.' : 'No additional agronomic alternatives could be determined from the available soil and climate data.'}</span>
      </div>
    `;
  } else {
    html += `<div class="rec-alts-grid">`;

    altCrops.forEach((alt, idx) => {
      const altRank = idx + 1;
      const altId = alt.crop.toLowerCase();
      const altName = isKn
        ? (alt.name_kn || cropNamesKn[altId] || alt.crop.toUpperCase())
        : (alt.name_en || cropNamesEn[altId] || alt.crop.toUpperCase());
      const altIcon = cropIcons[altId] || '🌱';
      const altImg = getCropVisualImage(altId);
      const drawerId = `details-alt-${altRank}`;

      // One short explanation (Strictly no percentages, no scores, no market prices)
      const shortAltSentence = isKn
        ? (alt.short_explanation_kn || 'ನಿಮ್ಮ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಮಟ್ಟಗಳು ಮತ್ತು ತಾಪಮಾನಕ್ಕೆ ಸೂಕ್ತವಾದ ಬೆಳೆ.')
        : (alt.short_explanation_en || 'Strong agronomic fit for your soil nutrient levels and temperature range.');

      const altBadgeText = isKn ? `#${altRank} ಕೃಷಿ ಪರ್ಯಾಯ` : `#${altRank} Agronomic Alternative`;

      html += `
        <div class="visual-alt-card">
          <div class="visual-alt-photo-wrap">
            <img src="${altImg}" alt="${altName}" class="visual-alt-img" loading="lazy" onerror="this.onerror=null; this.src='public/images/crops/default_crop.svg';">
            <span class="visual-alt-badge badge-alt">${altBadgeText}</span>
          </div>

          <div class="visual-alt-body">
            <h3 class="visual-alt-title">${altIcon} ${altName}</h3>
            <p class="visual-alt-desc">${shortAltSentence}</p>

            <div class="rec-card-footer">
              <button type="button" class="rec-btn-details-toggle alt-btn" data-target="${drawerId}" onclick="toggleCompactDetails('${drawerId}', this)">
                <span>${isKn ? 'ವಿವರಗಳನ್ನು ನೋಡಿ ↓' : 'View Details ↓'}</span>
              </button>

              <!-- Expandable Deep Details Drawer -->
              ${renderDetailDrawerHtml(alt, drawerId, true)}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `
      </section>
    </div>
  `;

  root.innerHTML = html;
}

// ==============================================================================
// GOVERNMENT SCHEMES & CROP INSURANCE HUB FEATURE
// ==============================================================================
let schemesState = {
  allSchemes: [],
  filteredSchemes: [],
  category: 'all',
  level: 'all',
  district: 'all',
  searchQuery: '',
  isLoaded: false,
  controlsBound: false
};

async function initSchemesFeature() {
  const container = document.getElementById('schemes-cards-grid');
  if (!container) return;

  setupSchemesControlsOnce();

  if (!schemesState.isLoaded) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
        <div class="spinner" style="margin: 0 auto 10px; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <div>ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ... / Loading verified official schemes...</div>
      </div>
    `;

    try {
      const resp = await fetch('/api/schemes');
      if (resp.ok) {
        const data = await resp.json();
        schemesState.allSchemes = data.schemes || [];
        schemesState.isLoaded = true;
      } else {
        throw new Error('API status ' + resp.status);
      }
    } catch (err) {
      console.warn('Failed to fetch /api/schemes:', err);
    }
  }

  filterAndRenderSchemes();
}

function setupSchemesControlsOnce() {
  if (schemesState.controlsBound) return;
  schemesState.controlsBound = true;

  const searchInput = document.getElementById('schemes-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      schemesState.searchQuery = e.target.value.toLowerCase().trim();
      filterAndRenderSchemes();
    });
  }

  const catFilter = document.getElementById('schemes-category-filter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      schemesState.category = e.target.value.toLowerCase();
      filterAndRenderSchemes();
    });
  }

  const lvlFilter = document.getElementById('schemes-level-filter');
  if (lvlFilter) {
    lvlFilter.addEventListener('change', (e) => {
      schemesState.level = e.target.value.toLowerCase();
      filterAndRenderSchemes();
    });
  }

  const distFilter = document.getElementById('schemes-district-filter');
  if (distFilter) {
    distFilter.addEventListener('change', (e) => {
      schemesState.district = e.target.value.toLowerCase();
      filterAndRenderSchemes();
    });
  }

  const resetBtn = document.getElementById('schemes-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      schemesState.category = 'all';
      schemesState.level = 'all';
      schemesState.district = 'all';
      schemesState.searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (catFilter) catFilter.value = 'all';
      if (lvlFilter) lvlFilter.value = 'all';
      if (distFilter) distFilter.value = 'all';
      filterAndRenderSchemes();
    });
  }
}

function filterAndRenderSchemes() {
  const container = document.getElementById('schemes-cards-grid');
  if (!container) return;

  const isKn = state.lang === 'kn';
  const q = schemesState.searchQuery;
  const cat = schemesState.category;
  const lvl = schemesState.level;
  const dist = schemesState.district;

  let filtered = schemesState.allSchemes.filter(s => {
    // Category match
    if (cat !== 'all') {
      const matchCat = (s.category || '').toLowerCase().includes(cat) || 
                       (s.category_kn || '').toLowerCase().includes(cat);
      if (!matchCat) return false;
    }

    // Level match
    if (lvl !== 'all') {
      const sLvl = (s.level || '').toLowerCase();
      if (lvl === 'central' && !sLvl.includes('central')) return false;
      if (lvl === 'state' && (!sLvl.includes('state') && !sLvl.includes('karnataka'))) return false;
    }

    // District match
    if (dist !== 'all') {
      const districts = (s.applicable_districts || []).map(d => d.toLowerCase());
      if (!districts.includes('all') && !districts.includes(dist)) return false;
    }

    // Search query match
    if (q) {
      const haystack = (
        (s.name_en || '') + ' ' +
        (s.name_kn || '') + ' ' +
        (s.category || '') + ' ' +
        (s.benefit || '') + ' ' +
        (s.benefit_kn || '') + ' ' +
        (s.eligibility || '') + ' ' +
        (s.provider || '')
      ).toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  // Update count text
  const countText = document.getElementById('schemes-count-text');
  if (countText) {
    countText.textContent = isKn
      ? `ತೋರಿಸಲಾಗುತ್ತಿದೆ: ${filtered.length} ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು`
      : `Showing ${filtered.length} verified government schemes & portals`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
        <h3 style="margin: 0 0 6px; font-size: 1.1rem; color: var(--text-primary);">
          ${isKn ? 'ಯಾವುದೇ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No matching schemes found'}
        </h3>
        <p style="margin: 0; font-size: 0.85rem;">
          ${isKn ? 'ದಯವಿಟ್ಟು ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ ಅಥವಾ ಮರುಹೊಂದಿಸಿ.' : 'Please clear your search query or adjust your filters.'}
        </p>
      </div>
    `;
    return;
  }

  const categoryIcons = {
    'income support': '💰',
    'crop insurance': '🛡️',
    'credit & loans': '💳',
    'credit': '💳',
    'irrigation': '💧',
    'soil health': '🧪',
    'market access': '📈',
    'millet subsidy': '🌾',
    'farmer registration & id': '🆔'
  };

  const categoryColors = {
    'income support': { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
    'crop insurance': { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
    'credit & loans': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    'credit': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    'irrigation': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'soil health': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    'market access': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
    'millet subsidy': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'farmer registration & id': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }
  };

  let html = '';
  filtered.forEach(s => {
    const catLower = (s.category || '').toLowerCase();
    const icon = categoryIcons[catLower] || '📜';
    const catTheme = categoryColors[catLower] || { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };

    const titleDisplay = isKn ? `${s.name_kn} (${s.name_en})` : `${s.name_en} (${s.name_kn})`;
    const benefitDisplay = (isKn && s.benefit_kn) ? s.benefit_kn : s.benefit;
    const eligibilityDisplay = (isKn && s.eligibility_kn) ? s.eligibility_kn : s.eligibility;
    const docs = (isKn && s.documents_kn) ? s.documents_kn : (s.documents || []);
    const nextSteps = (isKn && s.next_steps_kn) ? s.next_steps_kn : (s.next_steps_en || []);
    const actionLabel = (isKn && s.action_label_kn) ? s.action_label_kn : (s.action_label_en || 'Open Official Portal');

    const isCentral = (s.level || '').toLowerCase().includes('central');
    const levelBadgeText = isKn 
      ? (isCentral ? 'ಕೇಂದ್ರ ಸರ್ಕಾರ' : 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಸರ್ಕಾರ')
      : (isCentral ? 'Central Govt' : 'Karnataka State');
    const levelBadgeColor = isCentral ? '#0284c7' : '#059669';

    html += `
      <div class="card scheme-card-enhanced" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); position: relative; transition: transform 0.2s, box-shadow 0.2s;">
        
        <div>
          <!-- Top Row: Icon, Category Pill, Level Badge -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1.4rem; line-height: 1;">${icon}</span>
              <span style="background: ${catTheme.bg}; color: ${catTheme.text}; border: 1px solid ${catTheme.border}; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                ${isKn ? (s.category_kn || s.category) : s.category}
              </span>
            </div>
            <span style="background: ${isCentral ? '#e0f2fe' : '#e8f5e9'}; color: ${levelBadgeColor}; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
              🏛️ ${levelBadgeText}
            </span>
          </div>

          <!-- Scheme Title & Provider -->
          <h3 style="margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
            ${titleDisplay}
          </h3>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px;">
            🏢 ${s.department || s.provider}
          </div>

          <!-- Highlight Benefit Box -->
          <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 10px 12px; border-radius: 6px; font-size: 0.83rem; color: var(--text-primary); margin-bottom: 12px; line-height: 1.45;">
            <strong>🎁 ${isKn ? 'ಸೌಲಭ್ಯ (Key Benefit):' : 'Key Benefit:'}</strong> ${benefitDisplay}
          </div>

          <!-- Eligibility Summary -->
          <div style="font-size: 0.80rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.45;">
            <strong style="color: var(--text-primary);">👤 ${isKn ? 'ಅರ್ಹತೆ (Eligibility):' : 'Eligibility:'}</strong> ${eligibilityDisplay}
          </div>

          <!-- Required Documents Checklist -->
          ${docs.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">
                📑 ${isKn ? 'ಅಗತ್ಯ ದಾಖಲೆಗಳು (Important Documents):' : 'Required Documents:'}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${docs.map(d => `
                  <span style="background: #f1f5f9; color: #334155; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0; display: inline-flex; align-items: center; gap: 4px;">
                    <span style="color: #10b981; font-weight: 900;">✓</span> ${d}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Farmer Next Steps Expandable -->
          ${nextSteps.length > 0 ? `
            <details style="margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 0.78rem;">
              <summary style="font-weight: 700; color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <span>📋</span>
                <span>${isKn ? 'ರೈತರ ಮುಂದಿನ ಹಂತಗಳು (Next Steps to Apply)' : 'Next Steps for Farmers (Click to Expand)'}</span>
              </summary>
              <ol style="margin: 8px 0 0 18px; padding: 0; line-height: 1.5; color: #475569;">
                ${nextSteps.map(step => `<li>${step}</li>`).join('')}
              </ol>
            </details>
          ` : ''}

        </div>

        <!-- Card Footer: Official Action Buttons & Verification Badge -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 0.70rem; color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              <span>✓</span> <span>${isKn ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Verified Official Portal'}</span> • <span>${s.last_verified_date}</span>
            </span>
            <span style="font-size: 0.70rem; background: #ecfdf5; color: #047857; padding: 1px 6px; border-radius: 4px; font-weight: 700;">
              ${s.status}
            </span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <a href="${s.application_url || s.official_source}" target="_blank" rel="noopener noreferrer" 
               class="btn" style="background: #0284c7; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);">
              <span>🌐</span>
              <span>${actionLabel} ↗</span>
            </a>

            ${s.calculator_url ? `
              <a href="${s.calculator_url}" target="_blank" rel="noopener noreferrer" 
                 class="btn" style="background: #f8fafc; color: #0284c7; border: 1px solid #bae6fd; padding: 7px 12px; border-radius: 6px; text-decoration: none; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <span>🧮</span>
                <span>${isKn ? 'ಪ್ರೀಮಿಯಂ ಲೆಕ್ಕ' : 'Calculator'} ↗</span>
              </a>
            ` : ''}

            <a href="${s.official_source}" target="_blank" rel="noopener noreferrer" 
               style="font-size: 0.75rem; color: var(--text-muted); text-decoration: underline;">
              ${isKn ? 'ಅಧಿಕೃತ ಮೂಲ' : 'Official Source'} ↗
            </a>
          </div>

        </div>

      </div>
    `;
  });

  container.innerHTML = html;
}

window.initSchemesFeature = initSchemesFeature;
