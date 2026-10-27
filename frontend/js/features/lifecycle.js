/**
 * Crop Lifecycle Feature Module for MannuMitra.
 * Visual guide to crop growth stages, approximate durations, and short explanations.
 * Free of complicated tracking, progress bars, percentages, and counters.
 */

import { i18n } from '../i18n.js';

export class LifecycleFeature {
  constructor() {
    this.selectedCrop = 'rice';
  }

  async init() {
    if (typeof window !== 'undefined' && window.selectLifecycleCrop) {
      window.selectLifecycleCrop(this.selectedCrop);
    }
  }

  selectCrop(cropId) {
    this.selectedCrop = cropId || 'rice';
    if (typeof window !== 'undefined' && window.selectLifecycleCrop) {
      window.selectLifecycleCrop(this.selectedCrop);
    }
  }

  async loadLifecycle(cropId) {
    this.selectCrop(cropId);
  }
}

export const lifecycleFeature = new LifecycleFeature();
if (typeof window !== 'undefined') {
  window.lifecycleModule = lifecycleFeature;
}
export default lifecycleFeature;

