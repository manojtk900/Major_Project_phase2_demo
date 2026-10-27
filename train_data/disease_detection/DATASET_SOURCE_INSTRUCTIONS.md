# Plant Disease Detection — Dataset Provenance & Reproduction Guide

## 1. Overview
The plant disease detection module utilizes MobileNetV2 transfer learning architectures fine-tuned across 5 major Karnataka agricultural crops plus a preliminary Crop Validator CNN:

1. **Arecanut (9 Classes):**
   - Classes: `healthy`, `koleroga_fruit_rot`, `yellow_leaf_disease`, `bud_rot`, `stem_bleeding`, `inflorescence_dieback`, `nut_splitting`, `algal_spot`, `sun_scorch`.
   - Source: ICAR-CPCRI Regional Station Vittal & field surveys across Malnad and Coastal Karnataka.
   - Total Raw Images: 12,292 images (~7.68 GB).

2. **Cotton (4 Classes):**
   - Classes: `bacterial_blight`, `curl_virus`, `fussarium_wilt`, `healthy`.
   - Source: Kaggle Cotton Leaf Disease Dataset & UAS Raichur field validation.
   - Total Raw Images: 1,711 images (~189 MB).

3. **Crop Validator CNN (5 Classes):**
   - Classes: `arecanut`, `cotton`, `maize`, `rice`, `tomato`.
   - Source: Balanced multi-crop leaf canopy verification dataset.
   - Total Raw Images: 6,000 images (~1.2 GB).

4. **Maize (4 Classes):**
   - Classes: `common_rust`, `gray_leaf_spot`, `northern_corn_leaf_blight`, `healthy`.
   - Source: PlantVillage Maize/Corn Leaf Disease Dataset.

5. **Rice / Paddy (5 Classes):**
   - Classes: `bacterial_leaf_blight`, `brown_spot`, `leaf_blast`, `sheath_blight`, `healthy`.
   - Source: Kaggle / UCI Rice Leaf Disease Dataset & UAS Mandya field observations.
   - Total Raw Images: 7,421 images (~206 MB).

6. **Tomato (10 Classes):**
   - Classes: `bacterial_spot`, `early_blight`, `late_blight`, `leaf_mold`, `septoria_leaf_spot`, `spider_mites`, `target_spot`, `yellow_leaf_curl_virus`, `mosaic_virus`, `healthy`.
   - Source: PlantVillage Tomato Leaf Disease Benchmark.

---

## 2. Reproduction & Demonstration Strategy
Because the full uncompressed training image corpus exceeds 9 GB, the final deliverable provides:

1. **Serialized Production Weights:**
   Pre-trained, verified MobileNetV2 models (`model.keras`) for all 6 categories stored in:
   `models/disease_detection/<crop>/model.keras`
2. **Metadata & Agronomic Advice:**
   `class_names.json` (exact index-to-label mapping) and `disease_info.json` (bilingual English/Kannada curative treatments, chemical controls, and organic management).
3. **Curated Demonstration Sample Images:**
   High-quality leaf test samples stored in `demo_samples/disease_images/` and `frontend/public/images/demo_disease/` for instant field inference during presentations.
4. **Interactive Notebook:**
   `notebooks/04_mobilenetv2_disease_detection.ipynb` loads each model, performs inference on the demo images, outputs classification probabilities, and displays Grad-CAM visual attention overlays.
