/**
 *  Plant Disease Scanner Feature Module for PFS.
 * Connects MobileNetV2 vision models, Crop Gatekeeper validation,
 * and organic/chemical treatments to the UI.
 */

import { api } from '../api.js';
import { i18n } from '../i18n.js';

export class DiseaseFeature {
  constructor() {
    this.selectedCrop = 'arecanut';
    this.selectedFile = null;
    this.lastResult = null;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const fileInput = document.getElementById('disease-file-input');
    const cameraInput = document.getElementById('disease-camera-input');
    const browseBtn = document.getElementById('btn-disease-browse');
    const cameraBtn = document.getElementById('btn-disease-camera');
    const clearBtn = document.getElementById('btn-disease-clear');
    const detectBtn = document.getElementById('btn-detect-disease');
    const sampleBtn = document.getElementById('btn-disease-sample');
    const dropzone = document.getElementById('disease-dropzone');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    }

    if (cameraBtn && cameraInput) {
      cameraBtn.addEventListener('click', () => cameraInput.click());
      cameraInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSelection());
    }

    if (detectBtn) {
      detectBtn.addEventListener('click', () => this.executeDetection());
    }

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelect(e.dataTransfer.files[0]);
        }
      });
    }
  }

  selectCrop(cropId) {
    this.selectedCrop = cropId;
    document.querySelectorAll('#disease-crop-chips .disease-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-crop') === cropId);
    });

    const mismatchCard = document.getElementById('disease-crop-mismatch-card');
    if (mismatchCard) mismatchCard.style.display = 'none';
  }

  handleFileSelect(file) {
    if (!file) return;
    this.selectedFile = file;

    const preview = document.getElementById('disease-preview-container');
    const dropzone = document.getElementById('disease-dropzone');
    const previewImg = document.getElementById('disease-preview-img');
    const fileName = document.getElementById('disease-file-name');
    const fileSize = document.getElementById('disease-file-size');
    const detectBtn = document.getElementById('btn-detect-disease');

    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (previewImg) previewImg.src = e.target.result;
      if (dropzone) dropzone.style.display = 'none';
      if (preview) preview.style.display = 'block';
      if (detectBtn) detectBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  clearSelection() {
    this.selectedFile = null;
    const preview = document.getElementById('disease-preview-container');
    const dropzone = document.getElementById('disease-dropzone');
    const detectBtn = document.getElementById('btn-detect-disease');
    const resultCard = document.getElementById('disease-result-card');

    if (preview) preview.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
    if (detectBtn) detectBtn.disabled = true;
    if (resultCard) resultCard.style.display = 'none';
  }

  async executeDetection() {
    if (!this.selectedFile) return;

    const detectBtn = document.getElementById('btn-detect-disease');
    const errorBanner = document.getElementById('disease-error-banner');
    const mismatchCard = document.getElementById('disease-crop-mismatch-card');
    const resultCard = document.getElementById('disease-result-card');

    if (detectBtn) detectBtn.disabled = true;
    if (errorBanner) errorBanner.style.display = 'none';
    if (mismatchCard) mismatchCard.style.display = 'none';

    try {
      const data = await api.detectDisease(this.selectedCrop, this.selectedFile);
      this.lastResult = data;

      // Handle crop mismatch
      if (data.crop_validation && !data.crop_validation.match) {
        if (mismatchCard) {
          mismatchCard.style.display = 'block';
          const detCrop = document.getElementById('mismatch-detected-crop');
          const selCrop = document.getElementById('mismatch-selected-crop');
          if (detCrop) detCrop.textContent = data.crop_validation.detected_crop;
          if (selCrop) selCrop.textContent = this.selectedCrop;
        }
        return;
      }

      // Render disease result
      if (resultCard) {
        resultCard.style.display = 'block';
        this.renderDiagnosis(data);
      }
    } catch (err) {
      if (errorBanner) {
        errorBanner.style.display = 'block';
        const txt = document.getElementById('disease-error-text');
        if (txt) txt.textContent = err.message || 'Error detecting disease';
      }
    } finally {
      if (detectBtn) detectBtn.disabled = false;
    }
  }

  renderDiagnosis(data) {
    const isKn = i18n.currentLang === 'kn';
    const nameKn = document.getElementById('res-disease-name-kn');
    const nameEn = document.getElementById('res-disease-name-en');
    const confTxt = document.getElementById('res-confidence-txt');
    const confBar = document.getElementById('res-confidence-bar');
    const badge = document.getElementById('res-health-badge');

    const pct = Math.round((data.confidence || 0.95) * 100);

    if (nameKn) nameKn.textContent = data.disease_name_kn || data.disease_name;
    if (nameEn) nameEn.textContent = data.disease_name_en || data.disease_name;
    if (confTxt) confTxt.textContent = `${pct}%`;
    if (confBar) confBar.style.width = `${pct}%`;

    if (badge) {
      if (data.is_healthy) {
        badge.textContent = isKn ? 'ಆರೋಗ್ಯಕರ ಸಸ್ಯ' : 'Healthy Plant';
        badge.style.background = '#e8f5e9';
        badge.style.color = '#2e7d32';
      } else {
        badge.textContent = isKn ? 'ರೋಗ ಪತ್ತೆಯಾಗಿದೆ' : 'Disease Detected';
        badge.style.background = '#ffebee';
        badge.style.color = '#c62828';
      }
    }

    // Treatments
    const organicList = document.getElementById('res-organic-list');
    const chemicalList = document.getElementById('res-chemical-list');
    const symptomsList = document.getElementById('res-symptoms-list');

    if (symptomsList && data.symptoms) {
      symptomsList.innerHTML = data.symptoms.map(s => `<li>${isKn ? (s.kn || s) : (s.en || s)}</li>`).join('');
    }
    if (organicList && data.treatment?.organic) {
      organicList.innerHTML = data.treatment.organic.map(t => `<li>${isKn ? (t.kn || t) : (t.en || t)}</li>`).join('');
    }
    if (chemicalList && data.treatment?.chemical) {
      chemicalList.innerHTML = data.treatment.chemical.map(t => `<li>${isKn ? (t.kn || t) : (t.en || t)}</li>`).join('');
    }
  }
}

export const diseaseFeature = new DiseaseFeature();
if (typeof window !== 'undefined') {
  window.diseaseModule = diseaseFeature;
}
export default diseaseFeature;
