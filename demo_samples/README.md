# MannuMitra AI-Based Predictive Farming System — Demo Samples Package

This directory provides curated, verified scientific demonstration artifacts for the **MannuMitra (ಮಣ್ಣುಮಿತ್ರ)** platform. It enables live academic evaluation of the **Soil Health Card OCR Digital Extraction Pipeline** and the **Plant Pathology MobileNetV2 Deep Learning Diagnostic Engine** without requiring physical access to farm soil testing labs or field-collected leaf samples.

---

## Directory Organization

```text
demo_samples/
├── SAMPLE_DATASET_REGISTER.csv          <- Comprehensive 10-column metadata registry
├── README.md                            <- This documentation and evaluation guide
├── soil_reports/                        <- Exactly 10 scientific Soil Health Card PDFs
│   ├── soil_report_01_mandya.pdf        <- Cauvery Basin Red Loamy Soil (Neutral pH 6.8)
│   ├── soil_report_02_mysuru.pdf        <- Southern Transition Red Sandy Loam (Slightly Acidic pH 6.2)
│   ├── soil_report_03_belagavi.pdf      <- Northern Transition Deep Black Vertisol (Alkaline pH 7.9)
│   ├── soil_report_04_shivamogga.pdf     <- Malnad High Rainfall Laterite (Strongly Acidic pH 5.3)
│   ├── soil_report_05_hassan.pdf        <- Transition Sandy Clay Loam (Near-neutral pH 6.4)
│   ├── soil_report_06_tumakuru.pdf      <- Eastern Dry Zone Coarse Sandy Loam (Low OC 0.35%)
│   ├── soil_report_07_dharwad.pdf       <- Medium Black Soil (Optimal NPK Balance, pH 7.5)
│   ├── soil_report_08_ballari.pdf       <- Calcareous Black Soil (Salinity Risk EC 1.72 dS/m, pH 8.3)
│   ├── soil_report_09_kolar.pdf         <- Intensive Horticultural Belt (High Residual P 68 kg/ha)
│   ├── soil_report_10_chikkamagaluru.pdf<- Western Ghats Forest Plantation Laterite (High OC 1.18%)
│   ├── sample_soil_health_card.pdf      <- Legacy single-card reference PDF
│   └── sample_soil_health_card.png      <- Legacy 300 DPI image reference
└── disease_images/                      <- Exactly 10 authentic botanical leaf demo images
    ├── arecanut_disease_demo_01.jpg     <- Arecanut: Healthy Leaf (99.9% Model Confidence)
    ├── arecanut_disease_demo_02.jpg     <- Arecanut: Koleroga / Mahali Fruit Rot (100.0% Model Confidence)
    ├── maize_disease_demo_01.jpg        <- Maize: Common Rust Puccinia sorghi (100.0% Model Confidence)
    ├── maize_disease_demo_02.jpg        <- Maize: Healthy Leaf (100.0% Model Confidence)
    ├── tomato_disease_demo_01.jpg       <- Tomato: Early Blight Alternaria solani (54.2% Model Confidence)
    ├── tomato_disease_demo_02.jpg       <- Tomato: Healthy Leaf (100.0% Model Confidence)
    ├── rice_disease_demo_01.jpg         <- Rice: Brown Spot Bipolaris oryzae (99.9% Model Confidence)
    ├── rice_disease_demo_02.jpg         <- Rice: Bacterial Leaf Blight Xanthomonas oryzae (91.8% Model Confidence)
    ├── cotton_disease_demo_01.jpg       <- Cotton: Bacterial Blight Xanthomonas citri (99.9% Model Confidence)
    └── cotton_disease_demo_02.jpg       <- Cotton: Healthy Leaf (99.6% Model Confidence)
```

---

## 1. Scientific Soil Health Reports (10 District Samples)

### Purpose & Standards
Each soil report follows the official structural schema of the **Soil Health Card (SHC) scheme**, launched by the Ministry of Agriculture & Farmers Welfare, Government of India:
- **Reference Portal:** [https://soilhealth.dac.gov.in/](https://soilhealth.dac.gov.in/)
- **Background Details:** [PIB Press Release NoteId 155036](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155036&lang=2&reg=48)

### Report Structure
Every PDF document includes:
1. **Institutional Header:** Regional Agricultural Soil Testing Laboratory name and certification header.
2. **Sample Metadata:** Unique Sample ID (`DEMO-SHC-KA01` to `KA10`), Report Date, District, Taluk, and Soil Classification (Alfisol, Vertisol, Oxisol, etc.).
3. **Primary Test Parameters:**
   - Available Nitrogen (N) in `kg/ha`
   - Available Phosphorus (P) in `kg/ha`
   - Available Potassium (K) in `kg/ha`
   - Soil Reaction (pH) on standard `0-14 pH scale`
   - Electrical Conductivity (EC) in `dS/m`
   - Organic Carbon (OC) in `%`
4. **Reference Thresholds & Agronomic Rating:** Low / Medium / High / Deficient / Adequate status relative to ICAR reference guidelines.
5. **Soil Health Interpretation:** Concise narrative summarizing chemical buffering, cation exchange, and risk factors.
6. **Nutrient Advisory:** Actionable recommendations including Farm Yard Manure (FYM), gypsum, agricultural limestone, and balanced NPK scheduling.
7. **Explicit Synthetic Disclaimer:** Clear statement that data is fictional and intended exclusively for academic software testing.

### Agro-Climatic Diversity Summary

| File | District | Soil Classification | pH | EC (dS/m) | OC (%) | N (kg/ha) | P (kg/ha) | K (kg/ha) | Agro-Climatic Profile |
|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| `soil_report_01_mandya.pdf` | Mandya | Red Loamy Soil | 6.8 | 0.38 | 0.62 | 245.5 | 48.2 | 195.0 | Neutral Cauvery command loam, optimal fertility |
| `soil_report_02_mysuru.pdf` | Mysuru | Red Sandy Loam | 6.2 | 0.22 | 0.42 | 178.0 | 16.4 | 142.0 | Slightly acidic, low nutrient reserve |
| `soil_report_03_belagavi.pdf` | Belagavi | Deep Black Vertisol | 7.9 | 0.82 | 0.78 | 315.0 | 58.5 | 385.0 | Heavy black clay, rich potash, alkaline tendency |
| `soil_report_04_shivamogga.pdf`| Shivamogga | Laterite Soil | 5.3 | 0.14 | 0.88 | 162.0 | 12.8 | 118.0 | High rainfall zone, severe P fixation, acidic |
| `soil_report_05_hassan.pdf` | Hassan | Red Sandy Clay Loam | 6.4 | 0.28 | 0.55 | 225.0 | 34.0 | 215.0 | Balanced transitional loam, favorable buffer |
| `soil_report_06_tumakuru.pdf` | Tumakuru | Coarse Sandy Loam | 7.1 | 0.41 | 0.35 | 135.0 | 21.0 | 155.0 | Coarse texture, very low OC and nitrogen |
| `soil_report_07_dharwad.pdf` | Dharwad | Medium Black Soil | 7.5 | 0.56 | 0.68 | 280.0 | 41.5 | 295.0 | High base saturation, ideal for cotton/pulses |
| `soil_report_08_ballari.pdf` | Ballari | Calcareous Black Soil | 8.3 | 1.72 | 0.40 | 192.0 | 29.0 | 430.0 | High alkalinity, elevated EC, gypsum requirement |
| `soil_report_09_kolar.pdf` | Kolar | Red Gravelly Loam | 6.9 | 0.65 | 0.44 | 152.0 | 68.0 | 185.0 | High residual P build-up from DAP fertilizer |
| `soil_report_10_chikkamagaluru.pdf`| Chikkamagaluru | Humic Laterite | 5.1 | 0.12 | 1.18 | 295.0 | 22.5 | 235.0 | Forest plantation laterite, high OC, needs lime |

---

## 2. Plant Pathology Demonstration Images (10 Leaf Samples)

### Authenticity & Scientific Sourcing
- **Zero Synthetic Symptoms:** No AI-generated or manipulated disease symptoms are used.
- **Genuine Open Datasets:** Sourced exclusively from validated botanical disease datasets:
  - **PlantVillage Dataset:** Mohanty et al., *Frontiers in Plant Science* (2016). Licensed under Creative Commons CC BY-SA 4.0.
  - **UCI / ICAR Rice Leaf Disease Dataset:** Real-field rice pathology dataset covering bacterial leaf blight and brown spot.
  - **Kaggle Cotton Disease Dataset:** Open-access research collection for cotton foliar diagnosis.
  - **Arecanut Disease Dataset:** Basava44 / Sumanth S Adiga open research collection for arecanut palm health.

### Sourced Image Overview & Model Verification

| File | Crop | Genuine Pathology Label | Source Dataset | Image Resolution | Live Model Output | Model Confidence |
|:---|:---|:---|:---|:---:|:---|:---:|
| `arecanut_disease_demo_01.jpg` | Arecanut | Healthy Leaf | Arecanut Dataset | 800 x 800 | Healthy Leaf | 99.9% |
| `arecanut_disease_demo_02.jpg` | Arecanut | Koleroga / Fruit Rot (*Phytophthora*) | Arecanut Dataset | 600 x 800 | Fruit Rot / Koleroga (Mahali) | 100.0% |
| `maize_disease_demo_01.jpg` | Maize | Common Rust (*Puccinia sorghi*) | PlantVillage | 256 x 256 | Common Rust | 100.0% |
| `maize_disease_demo_02.jpg` | Maize | Healthy Leaf | PlantVillage | 256 x 256 | Healthy Leaf | 100.0% |
| `tomato_disease_demo_01.jpg` | Tomato | Early Blight (*Alternaria solani*) | PlantVillage | 256 x 256 | Early Blight | 54.2% |
| `tomato_disease_demo_02.jpg` | Tomato | Healthy Leaf | PlantVillage | 256 x 256 | Healthy Leaf | 100.0% |
| `rice_disease_demo_01.jpg` | Rice | Brown Spot (*Bipolaris oryzae*) | UCI / ICAR | 300 x 300 | Brown Spot | 99.9% |
| `rice_disease_demo_02.jpg` | Rice | Bacterial Blight (*Xanthomonas*) | UCI / ICAR | 999 x 291 | Bacterial Leaf Blight | 91.8% |
| `cotton_disease_demo_01.jpg` | Cotton | Bacterial Blight (*Xanthomonas*) | Cotton Dataset | 600 x 336 | Bacterial Blight | 99.9% |
| `cotton_disease_demo_02.jpg` | Cotton | Healthy Leaf | Cotton Dataset | 694 x 694 | Healthy Leaf | 99.6% |

---

## 3. How to Use in MannuMitra Web Application

### Testing Soil Report OCR
1. Start backend server:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
2. Open browser at `http://127.0.0.1:8000/ui/?v=5.4.0`.
3. Navigate to **Soil Report OCR (ಮಣ್ಣು ಪರೀಕ್ಷಾ ವರದಿ ಡಿಜಿಟಲೀಕರಣ)**.
4. **Method A — Demo Selector:** Use the dropdown selector to select any of the 10 district reports (e.g., Mandya, Belagavi, Shivamogga). The system automatically loads the PDF into the OCR pipeline and extracts all 6 parameters.
5. **Method B — Manual File Upload:** Drag and drop any file from `demo_samples/soil_reports/` into the upload dropzone, then click **Extract Data (ವಿಶ್ಲೇಷಿಸಿ)**.
6. Verify the extracted N, P, K, pH, EC, and OC values in the verification form, then click **Apply to Crop Recommendation** to pre-fill the recommendation engine.

### Testing Disease Detection
1. Navigate to **Disease Scanner (ಸಸ್ಯ ರೋಗ ತಪಾಸಣೆ)**.
2. Select the target crop tab (Arecanut, Maize, Tomato, Rice, or Cotton).
3. Click **Browse File (ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ)** and select any sample image from `demo_samples/disease_images/` (organized in crop subfolders or with descriptive filenames in root).
4. Click **Detect Plant Disease (ರೋಗ ಪತ್ತೆ ಹಚ್ಚಿ)** to send the image through the actual model API (`POST /api/disease/diagnose`).
5. Review the live model prediction, confidence percentage, Grad-CAM attention heatmap, and University of Agricultural Sciences (UAS) bilingual advisory.
6. Manual file upload, sample leaf prefill, and device camera capture remain fully functional.

---

## 4. Limitations & Academic Integrity Notice

1. **Synthetic Nature of Soil Reports:** All soil test reports in this package are generated strictly as demonstration benchmarks. They do not represent real farmers' personal information, actual physical survey numbers, or accredited state soil testing laboratory releases.
2. **Model Independence:** Demo images are evaluated live by the deep learning model. The user interface displays only the true model prediction and confidence score returned by `/api/disease/diagnose`; source dataset labels are never hardcoded as model outputs.
3. **Field Generalization:** Real-world farm images may contain background soil, complex shadows, or dual infections. The built-in `FieldImageQualityValidator` automatically screens for blur, underexposure, and glare to maintain diagnostic reliability.
