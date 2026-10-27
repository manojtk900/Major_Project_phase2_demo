/**
 * Fertilizer & Nutrient Advisory Feature Module for PFS.
 * Implements ICAR and Karnataka Agri Universities (UAS-B, UAS-D)
 * scientific package of practices for basal and top-dressing nutrient schedules.
 */

export class FertilizerFeature {
  constructor() {
    this.selectedCrop = 'ragi';
  }

  init() {
    this.selectCrop(this.selectedCrop);
  }

  selectCrop(cropId) {
    this.selectedCrop = cropId;

    // Update chips
    document.querySelectorAll('#fert-crop-chips .fert-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-crop') === cropId);
    });

    // Update panels
    const panels = ['ragi', 'rice', 'maize', 'tomato', 'arecanut'];
    panels.forEach(p => {
      const el = document.getElementById(`fert-panel-${p}`);
      if (el) {
        el.style.display = (p === cropId) ? 'block' : 'none';
      }
    });
  }
}

export const fertilizerFeature = new FertilizerFeature();
if (typeof window !== 'undefined') {
  window.fertilizerModule = fertilizerFeature;
}
export default fertilizerFeature;
