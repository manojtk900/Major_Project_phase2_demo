/**
 * MannuMitra Feature Handlers for Soil OCR, Water Engine, and Market Intelligence
 */

export function initSoilOCRFeature() {
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

  if (browseBtn) browseBtn.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
  dropzone.onclick = () => fileInput.click();

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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files[0]) {
      handleFileSelected(fileInput.files[0]);
    }
  };

  function handleFileSelected(file) {
    if (fileName) fileName.textContent = file.name;
    if (fileInfo) fileInfo.style.display = 'flex';
    if (statusBanner) statusBanner.style.display = 'none';
  }

  function applyExtractedValues(params) {
    if (!params) return;
    if (params.N && document.getElementById('ocr-val-n')) document.getElementById('ocr-val-n').value = params.N.value;
    if (params.P && document.getElementById('ocr-val-p')) document.getElementById('ocr-val-p').value = params.P.value;
    if (params.K && document.getElementById('ocr-val-k')) document.getElementById('ocr-val-k').value = params.K.value;
    if (params.ph && document.getElementById('ocr-val-ph')) document.getElementById('ocr-val-ph').value = params.ph.value;
    if (params.ec && document.getElementById('ocr-val-ec')) document.getElementById('ocr-val-ec').value = params.ec.value;
    if (params.oc && document.getElementById('ocr-val-oc')) document.getElementById('ocr-val-oc').value = params.oc.value;

    const isKn = true;
    if (params.N && document.getElementById('ocr-val-n')) {
      const tagN = document.getElementById('status-tag-n');
      if (tagN) { tagN.textContent = '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ'; tagN.style.color = '#059669'; }
    }
    if (params.P && document.getElementById('ocr-val-p')) {
      const tagP = document.getElementById('status-tag-p');
      if (tagP) { tagP.textContent = '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ'; tagP.style.color = '#059669'; }
    }
    if (params.K && document.getElementById('ocr-val-k')) {
      const tagK = document.getElementById('status-tag-k');
      if (tagK) { tagK.textContent = '✓ ದೃಢೀಕರಿಸಲಾಗಿದೆ'; tagK.style.color = '#059669'; }
    }
    if (params.ph && document.getElementById('ocr-val-ph')) {
      const phVal = Number(params.ph.value);
      const tagPh = document.getElementById('status-tag-ph');
      if (tagPh) {
        if (phVal < 5.8) { tagPh.textContent = '⚠️ ಆಮ್ಲೀಯ (Acidic)'; tagPh.style.color = '#d97706'; }
        else if (phVal > 7.8) { tagPh.textContent = '⚠️ ಕ್ಷಾರೀಯ (Alkaline)'; tagPh.style.color = '#d97706'; }
        else { tagPh.textContent = '✓ ತಟಸ್ಥ (Neutral)'; tagPh.style.color = '#059669'; }
      }
    }
    if (params.ec && document.getElementById('ocr-val-ec')) {
      const ecVal = Number(params.ec.value);
      const tagEc = document.getElementById('status-tag-ec');
      if (tagEc) {
        if (ecVal > 1.0) { tagEc.textContent = '⚠️ ಲವಣಾಂಶ ಅಪಾಯ (Saline)'; tagEc.style.color = '#d97706'; }
        else { tagEc.textContent = '✓ ಸಾಮಾನ್ಯ (Normal)'; tagEc.style.color = '#059669'; }
      }
    }
    if (params.oc && document.getElementById('ocr-val-oc')) {
      const ocVal = Number(params.oc.value);
      const tagOc = document.getElementById('status-tag-oc');
      if (tagOc) {
        if (ocVal < 0.45) { tagOc.textContent = '⚠️ ಕಡಿಮೆ ಸಾವಯವ (Low OC)'; tagOc.style.color = '#d97706'; }
        else { tagOc.textContent = '✓ ಸೂಕ್ತ (Optimal)'; tagOc.style.color = '#059669'; }
      }
    }

    const badge = document.getElementById('ocr-verify-badge');
    if (badge) {
      badge.textContent = '✓ AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ';
      badge.style.background = '#10b981';
    }
  }

  const defaultDemoFile = 'soil_report_01_mandya.pdf';

  async function loadAndExtractDemoReport(chosenFile) {
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
          statusBanner.innerHTML = `✓ <strong>ಮಣ್ಣು ಆರೋಗ್ಯ ಕಾರ್ಡ್ (${loc}) ನೈಜ PDF OCR ಮೂಲಕ ಯಶಸ್ವಿಯಾಗಿ ಪಡೆಯಲಾಗಿದೆ!</strong> (${data.sample_id || 'DEMO'}) — ಪರಿಶೀಲಿಸಿ, ಶಿಫಾರಸು ಇಂಜಿನ್‌ಗೆ ಅನ್ವಯಿಸಿ.`;
        }

        if (applyBtn) {
          applyBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          applyBtn.style.transform = 'scale(1.02)';
          setTimeout(() => { applyBtn.style.transform = 'scale(1)'; }, 400);
        }
      } else {
        alert('ವರದಿ ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ: ' + (data.message || 'ದೋಷ'));
      }
    } catch (err) {
      console.error('OCR Extraction Error:', err);
    }
  }

  if (demoBtn) {
    demoBtn.onclick = async (e) => {
      e.stopPropagation();
      demoBtn.disabled = true;
      const origText = demoBtn.innerHTML;
      demoBtn.innerHTML = '⏳ ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...';
      try {
        await loadAndExtractDemoReport(defaultDemoFile);
      } finally {
        demoBtn.disabled = false;
        demoBtn.innerHTML = origText;
      }
    };
  }

  if (analyzeBtn) {
    analyzeBtn.onclick = async () => {
      const hasUploadedFile = fileInput.files && fileInput.files[0];

      if (!hasUploadedFile) {
        await loadAndExtractDemoReport(defaultDemoFile);
        return;
      }

      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...';

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
            statusBanner.innerHTML = `✓ <strong>ವರದಿಯಿಂದ ಮೌಲ್ಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ!</strong> (${data.parameters_detected} ನಿಯತಾಂಕಗಳು) — ಪರಿಶೀಲಿಸಿ, ನಂತರ ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.`;
          }

          if (applyBtn) {
            applyBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            applyBtn.style.transform = 'scale(1.02)';
            setTimeout(() => { applyBtn.style.transform = 'scale(1)'; }, 400);
          }
        } else {
          alert('ವರದಿ ವಿಶ್ಲೇಷಣೆ ವಿಫಲವಾಗಿದೆ: ' + (data.message || 'ದೋಷ ಉಂಟಾಗಿದೆ'));
        }
      } catch (err) {
        console.error('OCR Extraction Error:', err);
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'ವಿಶ್ಲೇಷಿಸಿ';
      }
    };
  }

  if (applyBtn) {
    applyBtn.onclick = () => {
      const n = Math.round(parseFloat(document.getElementById('ocr-val-n')?.value) || 245.5);
      const p = Math.round(parseFloat(document.getElementById('ocr-val-p')?.value) || 48.2);
      const k = Math.round(parseFloat(document.getElementById('ocr-val-k')?.value) || 195.0);
      const ph = parseFloat(document.getElementById('ocr-val-ph')?.value) || 6.8;

      if (window.navTo) window.navTo('recommend');
      setTimeout(() => {
        const sliderN = document.getElementById('slider-n');
        const sliderP = document.getElementById('slider-p');
        const sliderK = document.getElementById('slider-k');
        const sliderPh = document.getElementById('slider-ph');
        if (sliderN) { sliderN.value = n; sliderN.dispatchEvent(new Event('input')); }
        if (sliderP) { sliderP.value = p; sliderP.dispatchEvent(new Event('input')); }
        if (sliderK) { sliderK.value = k; sliderK.dispatchEvent(new Event('input')); }
        if (sliderPh) { sliderPh.value = ph; sliderPh.dispatchEvent(new Event('input')); }
      }, 350);
    };
  }
}

export function initWaterFeature() {
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
    calcBtn.textContent = 'ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗುತ್ತಿದೆ...';

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

        if (scoreEl) scoreEl.textContent = `${ev.compatibility_score}%`;
        if (statusEl) statusEl.textContent = ev.status;
        if (reqEl) reqEl.textContent = `${ev.crop_water_requirement_mm[0]} - ${ev.crop_water_requirement_mm[1]} mm`;
        if (idxEl) idxEl.textContent = `${ev.water_availability_index} / 1.0`;
        if (advEl) advEl.textContent = ev.advisory;

        if (scoreEl) {
          if (ev.compatibility_score >= 75) scoreEl.style.color = '#10b981';
          else if (ev.compatibility_score >= 50) scoreEl.style.color = '#f59e0b';
          else scoreEl.style.color = '#ef4444';
        }
      }
    } catch (err) {
      console.error('Water Evaluation Error:', err);
    } finally {
      calcBtn.disabled = false;
      calcBtn.textContent = '💧 ಹೊಂದಾಣಿಕೆ ಲೆಕ್ಕಾಚಾರ ಮಾಡಿ (Evaluate Water Compatibility)';
    }
  }

  calcBtn.onclick = evaluateWater;

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
}
