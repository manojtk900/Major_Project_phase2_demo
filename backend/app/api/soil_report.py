"""
MannuMitra - Soil Health Card OCR API Router
Supports dynamic uploading of physical and digital Soil Health Cards,
batch demonstration reports for 10 Karnataka districts, and live PDF extraction.
"""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Query
from fastapi.responses import FileResponse, JSONResponse
from app.services.soil_ocr_service import SoilReportOCRService

router = APIRouter(prefix="/api/soil-report", tags=["Soil Report OCR"])
soil_ocr = SoilReportOCRService()

WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
DEMO_DIR = WORKSPACE_ROOT / "demo_samples" / "soil_reports"

SAMPLE_REPORTS_METADATA = [
    {
        "filename": "soil_report_01_mandya.pdf",
        "district_en": "Mandya",
        "district_kn": "ಮಂಡ್ಯ (Mandya)",
        "sample_id": "DEMO-SHC-KA01",
        "soil_type_en": "Red Loamy Soil (Alfisol)",
        "soil_type_kn": "ಕೆಂಪು ಗೋಡು ಮಣ್ಣು",
        "ph_profile": "6.8 (Neutral)",
        "summary": "Cauvery Basin neutral loam with balanced macronutrient profile."
    },
    {
        "filename": "soil_report_02_mysuru.pdf",
        "district_en": "Mysuru",
        "district_kn": "ಮೈಸೂರು (Mysuru)",
        "sample_id": "DEMO-SHC-KA02",
        "soil_type_en": "Red Sandy Loam (Inceptisol)",
        "soil_type_kn": "ಕೆಂಪು ಮರಳು ಗೋಡು ಮಣ್ಣು",
        "ph_profile": "6.2 (Slightly Acidic)",
        "summary": "Light textured soil with low nitrogen and phosphorus reserves."
    },
    {
        "filename": "soil_report_03_belagavi.pdf",
        "district_en": "Belagavi",
        "district_kn": "ಬೆಳಗಾವಿ (Belagavi)",
        "sample_id": "DEMO-SHC-KA03",
        "soil_type_en": "Deep Black Clay / Vertisol",
        "soil_type_kn": "ಕಪ್ಪು ಜೇಡಿ ಮಣ್ಣು (Vertisol)",
        "ph_profile": "7.9 (Moderately Alkaline)",
        "summary": "Heavy vertisol with high potassium and mild alkaline reaction."
    },
    {
        "filename": "soil_report_04_shivamogga.pdf",
        "district_en": "Shivamogga",
        "district_kn": "ಶಿವಮೊಗ್ಗ (Shivamogga)",
        "sample_id": "DEMO-SHC-KA04",
        "soil_type_en": "Laterite Soil (Oxisol)",
        "soil_type_kn": "ಲ್ಯಾಟರೈಟ್ / ಮುರಕಲ್ಲು ಮಣ್ಣು",
        "ph_profile": "5.3 (Strongly Acidic)",
        "summary": "Malnad high rainfall acidic laterite with strong phosphorus fixation."
    },
    {
        "filename": "soil_report_05_hassan.pdf",
        "district_en": "Hassan",
        "district_kn": "ಹಾಸನ (Hassan)",
        "sample_id": "DEMO-SHC-KA05",
        "soil_type_en": "Red Sandy Clay Loam",
        "soil_type_kn": "ಕೆಂಪು ಮರಳು ಜೇಡಿ ಗೋಡು",
        "ph_profile": "6.4 (Slightly Acidic)",
        "summary": "Fertile transition loam with balanced moisture and nutrient retention."
    },
    {
        "filename": "soil_report_06_tumakuru.pdf",
        "district_en": "Tumakuru",
        "district_kn": "ತುಮಕೂರು (Tumakuru)",
        "sample_id": "DEMO-SHC-KA06",
        "soil_type_en": "Coarse Red Sandy Loam",
        "soil_type_kn": "ಒರಟು ಕೆಂಪು ಮರಳು ಮಣ್ಣು",
        "ph_profile": "7.1 (Neutral)",
        "summary": "Permeable sandy loam with very low organic carbon (0.35%)."
    },
    {
        "filename": "soil_report_07_dharwad.pdf",
        "district_en": "Dharwad",
        "district_kn": "ಧಾರವಾಡ (Dharwad)",
        "sample_id": "DEMO-SHC-KA07",
        "soil_type_en": "Medium Black Soil (Vertic Inceptisol)",
        "soil_type_kn": "ಮಧ್ಯಮ ಕಪ್ಪು ಮಣ್ಣು",
        "ph_profile": "7.5 (Slightly Alkaline)",
        "summary": "Productive agricultural university transitional black soil."
    },
    {
        "filename": "soil_report_08_ballari.pdf",
        "district_en": "Ballari",
        "district_kn": "ಬಳ್ಳಾರಿ (Ballari)",
        "sample_id": "DEMO-SHC-KA08",
        "soil_type_en": "Calcareous Black Soil (Salinity Risk)",
        "soil_type_kn": "ಸುಣ್ಣಯುಕ್ತ ಕಪ್ಪು ಮಣ್ಣು",
        "ph_profile": "8.3 (Strongly Alkaline)",
        "summary": "High base saturation, elevated EC (1.72 dS/m), needs gypsum."
    },
    {
        "filename": "soil_report_09_kolar.pdf",
        "district_en": "Kolar",
        "district_kn": "ಕೋಲಾರ (Kolar)",
        "sample_id": "DEMO-SHC-KA09",
        "soil_type_en": "Red Gravelly Loam (Alfisol)",
        "soil_type_kn": "ಕೆಂಪು ಜಲ್ಲಿ ಗೋಡು ಮಣ್ಣು",
        "ph_profile": "6.9 (Neutral)",
        "summary": "Intensive horticultural soil exhibiting high legacy P build-up."
    },
    {
        "filename": "soil_report_10_chikkamagaluru.pdf",
        "district_en": "Chikkamagaluru",
        "district_kn": "ಚಿಕ್ಕಮಗಳೂರು (Chikkamagaluru)",
        "sample_id": "DEMO-SHC-KA10",
        "soil_type_en": "Humic Acidic Laterite (Plantation Soil)",
        "soil_type_kn": "ಸಾವಯವ ಸಮೃದ್ಧ ಲ್ಯಾಟರೈಟ್",
        "ph_profile": "5.1 (Strongly Acidic)",
        "summary": "High organic matter forest laterite with strong lime requirement."
    }
]

@router.post("/upload")
async def upload_soil_report(file: UploadFile = File(...)):
    content = await file.read()
    result = soil_ocr.extract_from_bytes(file.filename, content)
    return result

@router.get("/samples")
def list_sample_soil_reports():
    """List the 10 scientific demo soil reports across Karnataka districts."""
    return {
        "status": "success",
        "total_samples": len(SAMPLE_REPORTS_METADATA),
        "samples": SAMPLE_REPORTS_METADATA
    }

@router.get("/demo")
async def demo_soil_report(filename: Optional[str] = Query(None)):
    """
    Extract soil values from one of the demonstration soil test reports.
    If filename is supplied, executes native OCR text extraction on that specific PDF.
    """
    target_filename = filename or "soil_report_01_mandya.pdf"
    target_file = DEMO_DIR / target_filename
    
    # Fallback to legacy demo files if file does not exist
    if not target_file.exists():
        target_file = DEMO_DIR / "sample_soil_health_card.pdf"
        target_filename = target_file.name

    if target_file.exists():
        content = target_file.read_bytes()
        res = soil_ocr.extract_from_bytes(target_filename, content)
        
        # Enrich with metadata if matched
        meta = next((m for m in SAMPLE_REPORTS_METADATA if m["filename"] == target_filename), None)
        if meta:
            res["sample_id"] = meta["sample_id"]
            res["location"] = f"{meta['district_en']} district, Karnataka"
            res["soil_type"] = meta["soil_type_en"]
        else:
            res["sample_id"] = "DEMO-SOIL-001"
            res["location"] = "Mandya district, Karnataka"
            res["soil_type"] = "Red loamy soil"
            
        res["report_date"] = "15-Oct-2026"
        res["laboratory_name"] = "Demonstration Soil Testing Laboratory"
        res["verification_notice"] = "SAMPLE DATA — FOR PROJECT DEMONSTRATION ONLY"
        res["is_demo"] = True
        return res
    
    return JSONResponse(status_code=404, content={"status": "error", "message": f"Sample report '{target_filename}' not found."})

@router.get("/sample-file/{filename}")
async def get_demo_sample_file(filename: str):
    """Serve any verified demo soil report PDF or sample image with strict traversal protection."""
    # Prevent directory traversal
    clean_name = Path(filename).name
    file_path = (DEMO_DIR / clean_name).resolve()
    
    if file_path.is_file() and DEMO_DIR in file_path.parents and file_path.exists():
        media_type = "application/pdf" if clean_name.endswith(".pdf") else (
            "image/png" if clean_name.endswith(".png") else (
                "image/jpeg" if clean_name.endswith((".jpg", ".jpeg")) else "text/plain; charset=utf-8"
            )
        )
        return FileResponse(str(file_path), media_type=media_type, filename=clean_name)
        
    return JSONResponse(status_code=404, content={"status": "error", "message": f"Sample file '{clean_name}' not found"})
