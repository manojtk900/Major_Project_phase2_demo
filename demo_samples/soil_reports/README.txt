================================================================================
MANNUMITRA PREDICTIVE FARMING SYSTEM — DEMO SOIL HEALTH CARD
================================================================================

Folder: demo_samples/soil_reports/
Created: October 2026

FILES IN THIS FOLDER:
--------------------------------------------------------------------------------
1. sample_soil_health_card.pdf
   - Printable / downloadable Soil Health Card report in standard PDF format.
   - Formatted with structured laboratory headers, sample metadata, and test values.

2. sample_soil_health_card.png
   - High-resolution 300 DPI raster image of the exact same soil test report.
   - Ideal for direct image upload or mobile camera simulation in the OCR module.

3. README.txt
   - This instruction and metadata documentation file.

DEMOSTRATION DATA SPECIFICATION:
--------------------------------------------------------------------------------
Status: SAMPLE DATA — FOR PROJECT DEMONSTRATION ONLY
Sample ID: DEMO-SOIL-001
Location: Mandya district, Karnataka
Soil Classification: Red loamy soil
Report Date: 15-Oct-2026
Laboratory Name: Demonstration Soil Testing Laboratory

SOIL PARAMETERS CONTAINED IN THIS REPORT:
- Available Nitrogen (N):       245.5 kg/ha  [Medium / Low-Normal]
- Available Phosphorus (P):     48.2 kg/ha   [Medium / Optimal]
- Available Potassium (K):      195.0 kg/ha  [Medium / Sufficient]
- Soil Reaction (pH):           6.8          [Neutral / Ideal]
- Electrical Conductivity (EC): 0.38 dS/m    [Normal / Non-Saline]
- Organic Carbon (OC):          0.62 %       [Medium / Satisfactory]

HOW TO DEMONSTRATE IN MANNUMITRA:
--------------------------------------------------------------------------------
1. Start the MannuMitra application:
   - Backend: cd backend && python -m uvicorn app.main:app --port 8000
   - URL: http://127.0.0.1:8000/ui/?v=5.4.0

2. Navigate to "Soil Report OCR" (ಮಣ್ಣು ಪರೀಕ್ಷಾ ವರದಿ ಡಿಜಿಟಲೀಕರಣ):
   - From the left sidebar or the home dashboard, click "Soil Report OCR".

3. Method A — Direct One-Click Demo:
   - Click the "Load Demo Soil Card" (ಮಾದರಿ ವರದಿ ಬಳಸಿ) button.
   - The system immediately loads the demonstration soil card file and populates:
     • N: 245.5 kg/ha
     • P: 48.2 kg/ha
     • K: 195.0 kg/ha
     • pH: 6.8
     • EC: 0.38 dS/m
     • OC: 0.62%

4. Method B — Manual File Upload (PDF or PNG):
   - Click "Browse File" (ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ) or drag-and-drop either:
     • demo_samples/soil_reports/sample_soil_health_card.pdf
     • demo_samples/soil_reports/sample_soil_health_card.png
   - The file name appears in the ready status bar.
   - Click "Extract Data" (ವಿಶ್ಲೇಷಿಸಿ).
   - The OCR extraction engine extracts the parameters.

5. Review and Transfer to Crop Recommendation:
   - Review each parameter in the Extracted Values & Verification card.
   - Click "Apply to Crop Recommendation" (ಬೆಳೆ ಶಿಫಾರಸು ಇಂಜಿನ್‌ಗೆ ಅನ್ವಯಿಸಿ).
   - The application automatically switches to the Crop Recommendation wizard,
     pre-fills N=245, P=48, K=195, and pH=6.8, and sets the farmer verification
     status flag for subsequent recommendation.

DISCLAIMER:
--------------------------------------------------------------------------------
This report contains fictional demonstration data generated strictly for
evaluating the MannuMitra digital extraction pipeline. It is not an official
government document, and does not represent laboratory analysis of any physical
farm parcel.
================================================================================
