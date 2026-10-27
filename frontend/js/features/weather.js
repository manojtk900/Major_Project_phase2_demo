/**
 * Weather Service & Agricultural Forecast Feature Module.
 * Integrates Open-Meteo API free ,, with Chart.js visualization, Karnataka agro-climatic advisories,
 * and live satellite views.
 */

import { api } from '../api.js';
import { i18n } from '../i18n.js';

export class WeatherFeature {
  constructor() {
    this.districts = [];
    this.currentWeather = null;
    this.selectedDistrict = 'Mandya';
    this.tempChart = null;
    this.rainChart = null;
  }

  async init() {
    await this.loadDistricts();
    await this.fetchWeather(this.selectedDistrict);
  }

  async loadDistricts() {
    const sel = document.getElementById('weather-district-dropdown');
    try {
      const data = await api.getWeatherDistricts();
      this.districts = data.districts || [];
      if (sel) {
        sel.innerHTML = '';
        this.districts.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.name_en || d.id;
          opt.textContent = `${d.name_kn || d.id} (${d.name_en || d.id})`;
          if (opt.value.toLowerCase() === this.selectedDistrict.toLowerCase()) {
            opt.selected = true;
          }
          sel.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('[WeatherFeature] Error loading districts:', err);
    }
  }

  async fetchWeather(district) {
    this.selectedDistrict = district;
    const errorBanner = document.getElementById('weather-error-banner');
    if (errorBanner) errorBanner.style.display = 'none';

    try {
      const data = await api.getWeatherByDistrict(district);
      this.currentWeather = data;
      this.renderWeather(data);
    } catch (err) {
      console.error('[WeatherFeature] Failed to fetch weather:', err);
      if (errorBanner) errorBanner.style.display = 'flex';
    }
  }

  onDistrictChange(val) {
    if (val) this.fetchWeather(val);
  }

  useMyLocation() {
    if (!navigator.geolocation) {
      this.showGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await api.getWeatherByCoords(latitude, longitude);
          this.currentWeather = data;
          this.renderWeather(data);
        } catch (e) {
          this.showGeoNotice('Unable to fetch weather for current coordinates.');
        }
      },
      _err => {
        this.showGeoNotice('Location permission denied.');
      }
    );
  }

  showGeoNotice(msg) {
    const banner = document.getElementById('geo-notice-banner');
    if (banner) {
      banner.style.display = 'flex';
    }
  }

  renderWeather(data) {
    const isKn = i18n.currentLang === 'kn';

    // Current temp & condition
    const tempEl = document.getElementById('weather-curr-temp');
    const condEl = document.getElementById('weather-curr-cond');
    const humEl = document.getElementById('weather-curr-humidity');
    const windEl = document.getElementById('weather-curr-wind');
    const rainEl = document.getElementById('weather-curr-rainfall');
    const distEl = document.getElementById('weather-curr-district');

    if (tempEl) tempEl.textContent = Math.round(data.current?.temperature || 28);
    if (condEl) condEl.textContent = isKn ? (data.current?.weather_desc_kn || data.current?.condition || 'ಭಾಗಶಃ ಮೋಡ') : (data.current?.weather_desc_en || data.current?.condition || 'Partly Cloudy');
    if (humEl) humEl.textContent = `${Math.round(data.current?.relative_humidity || 65)}%`;
    if (windEl) windEl.textContent = `${Math.round(data.current?.wind_speed || 12)} km/h`;
    if (rainEl) rainEl.textContent = `${Math.round(data.normal_rainfall || 760)} mm`;
    if (distEl) distEl.textContent = `${data.district || 'Mandya'}, Karnataka`;

    // Advisory Box
    const advTitle = document.getElementById('weather-work-action-title');
    const advSub = document.getElementById('weather-work-action-sub');
    const advKnTitle = document.getElementById('weather-work-action-kn-title');
    const advKnSub = document.getElementById('weather-work-action-kn-sub');

    if (data.advisory) {
      if (advTitle) advTitle.textContent = data.advisory.title_en || 'Weather is favorable for farm operations.';
      if (advSub) advSub.textContent = data.advisory.desc_en || 'Normal irrigation and field scouting recommended.';
      if (advKnTitle) advKnTitle.textContent = data.advisory.title_kn || 'ಕೃಷಿ ಕೆಲಸಗಳಿಗೆ ಅನುಕೂಲಕರ ವಾತಾವರಣವಿದೆ.';
      if (advKnSub) advKnSub.textContent = data.advisory.desc_kn || 'ಸಾಮಾನ್ಯ ನೀರಾವರಿ ಮತ್ತು ಕೀಟ ನಿಗಾ ವಹಿಸಿ.';
    }

    // 7-day forecast cards
    this.renderForecastGrid(data.daily || []);
  }

  renderForecastGrid(daily) {
    const grid = document.getElementById('weather-forecast-grid');
    if (!grid) return;

    if (!daily || daily.length === 0) {
      grid.innerHTML = '<div style="padding: 16px; color: var(--text-muted);">Forecast not available</div>';
      return;
    }

    const html = daily.slice(0, 7).map((day, idx) => {
      const dateObj = new Date(day.date);
      const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return `
        <div class="forecast-card ${idx === 0 ? 'active' : ''}">
          <div class="fc-day">${dayName}</div>
          <div class="fc-icon">${day.icon || '⛅'}</div>
          <div class="fc-temp">
            <span class="fc-max">${Math.round(day.temp_max || 30)}°</span>
            <span class="fc-min">${Math.round(day.temp_min || 20)}°</span>
          </div>
          <div class="fc-rain">${Math.round(day.precipitation || 0)} mm</div>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;
    this.updateCharts(daily);
  }

  updateCharts(daily) {
    if (typeof Chart === 'undefined') return;

    const tempCanvas = document.getElementById('weather-temp-chart');
    const rainCanvas = document.getElementById('weather-rain-chart');
    if (!tempCanvas || !rainCanvas) return;

    const labels = daily.map(d => d.date ? d.date.slice(5) : '');
    const tempMax = daily.map(d => d.temp_max || 0);
    const tempMin = daily.map(d => d.temp_min || 0);
    const rainfall = daily.map(d => d.precipitation || 0);

    if (this.tempChart) this.tempChart.destroy();
    if (this.rainChart) this.rainChart.destroy();

    this.tempChart = new Chart(tempCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Max Temp (°C)', data: tempMax, borderColor: '#e53935', tension: 0.3 },
          { label: 'Min Temp (°C)', data: tempMin, borderColor: '#1e88e5', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    this.rainChart = new Chart(rainCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Rainfall (mm)', data: rainfall, backgroundColor: '#42a5f5' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  toggleDetailedForecast() {
    const drawer = document.getElementById('weather-charts-drawer');
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    }
  }

  openSatelliteModal() {
    const modal = document.getElementById('satellite-modal');
    if (modal) modal.style.display = 'flex';
  }

  closeSatelliteModal() {
    const modal = document.getElementById('satellite-modal');
    if (modal) modal.style.display = 'none';
  }

  retryWeatherFetch() {
    this.fetchWeather(this.selectedDistrict);
  }
}

export const weatherFeature = new WeatherFeature();
if (typeof window !== 'undefined') {
  window.weatherModule = weatherFeature;
}
export default weatherFeature;
