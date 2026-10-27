/**
 * Centralized API Client Module for PFS.
 * Communicates with the FastAPI backend over standard REST endpoints.
 */

const API_BASE = window.location.origin;

class ApiClient {
  constructor(base = API_BASE) {
    this.base = base;
  }

  async _get(endpoint, params = {}) {
    const url = new URL(`${this.base}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = `Request to ${endpoint} failed with HTTP ${res.status}`;
      try {
        const json = JSON.parse(errBody);
        errMsg = json.detail || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }
    return res.json();
  }

  async _post(endpoint, data = {}, isFormData = false) {
    const options = {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data)
    };

    if (!isFormData) {
      options.headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }

    const res = await fetch(`${this.base}${endpoint}`, options);
    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = `Request to ${endpoint} failed with HTTP ${res.status}`;
      try {
        const json = JSON.parse(errBody);
        errMsg = json.detail || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }
    return res.json();
  }

  // --- Health & Metadata ---
  getHealth() {
    return this._get('/api/health');
  }

  // --- Crop Recommendation ---
  getSoilTypes() {
    return this._get('/api/soil-types');
  }

  getCrops() {
    return this._get('/api/crops');
  }

  submitRecommendation(payload) {
    return this._post('/api/recommend', payload);
  }

  // --- Weather Service ---
  getWeatherDistricts() {
    return this._get('/api/weather/districts');
  }

  getWeatherByDistrict(district) {
    return this._get('/api/weather', { district });
  }

  getWeatherByCoords(latitude, longitude) {
    return this._get('/api/weather', { latitude, longitude });
  }

  // --- Crop Care & Lifecycle ---
  getLifecycleCrops() {
    return this._get('/api/lifecycle/crops');
  }

  getCropLifecycle(cropId) {
    return this._get(`/api/lifecycle/${encodeURIComponent(cropId)}`);
  }

  getTodayAdvice(cropId, district = 'Mandya', sowingDate = null) {
    return this._get(`/api/crop-care/${encodeURIComponent(cropId)}/today-advice`, {
      district,
      sowing_date: sowingDate
    });
  }

  // --- Disease Scanner ---
  getDiseasePlants() {
    return this._get('/api/disease/plants');
  }

  detectDisease(plantId, imageFile) {
    const formData = new FormData();
    formData.append('plant_id', plantId);
    formData.append('file', imageFile);
    return this._post('/api/disease/detect', formData, true);
  }

  // --- Economics ---
  getEconomicsCrops() {
    return this._get('/api/economics/crops');
  }

  getEconomicsDefaults(cropId) {
    return this._get(`/api/economics/defaults/${encodeURIComponent(cropId)}`);
  }

  calculateEconomicsProfit(payload) {
    return this._post('/api/economics/calculate-profit', payload);
  }
}

export const api = new ApiClient();
if (typeof window !== 'undefined') {
  window.api = api;
}
export default api;
