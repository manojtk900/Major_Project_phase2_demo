"""
MannuMitra - Plant Pathology Diagnostic API Router
Supports both /api/disease/diagnose and /api/disease/detect,
as well as listing and serving the 10 genuine academic demonstration images.
"""
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from app.services.disease_service import disease_service, SUPPORTED_CROPS

router = APIRouter(prefix="/api/disease", tags=["Plant Pathology and Diagnostics"])

WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
DISEASE_DIR = WORKSPACE_ROOT / "demo_samples" / "disease_images"

DEMO_DISEASE_SAMPLES = [
    {
        "filename": "arecanut_disease_demo_01.jpg",
        "crop": "arecanut",
        "crop_name_en": "Arecanut",
        "crop_name_kn": "ಅಡಿಕೆ",
        "label_en": "Healthy Leaf",
        "label_kn": "ಆರೋಗ್ಯಕರ ಎಲೆ",
        "is_healthy": True,
        "source_dataset": "Arecanut Disease Dataset (Basava44 / Sumanth S Adiga)",
        "icon": "🌴"
    },
    {
        "filename": "arecanut_disease_demo_02.jpg",
        "crop": "arecanut",
        "crop_name_en": "Arecanut",
        "crop_name_kn": "ಅಡಿಕೆ",
        "label_en": "Koleroga / Fruit Rot",
        "label_kn": "ಕೊಳೆರೋಗ (ಮಹಾಲಿ)",
        "is_healthy": False,
        "source_dataset": "Arecanut Disease Dataset (Basava44 / Sumanth S Adiga)",
        "icon": "🌴"
    },
    {
        "filename": "maize_disease_demo_01.jpg",
        "crop": "maize",
        "crop_name_en": "Maize",
        "crop_name_kn": "ಮೆಕ್ಕೆ ಜೋಳ",
        "label_en": "Common Rust",
        "label_kn": "ಕಾಂಡ/ಎಲೆ ತುಕ್ಕು ರೋಗ",
        "is_healthy": False,
        "source_dataset": "PlantVillage Dataset (Mohanty et al., 2016)",
        "icon": "🌽"
    },
    {
        "filename": "maize_disease_demo_02.jpg",
        "crop": "maize",
        "crop_name_en": "Maize",
        "crop_name_kn": "ಮೆಕ್ಕೆ ಜೋಳ",
        "label_en": "Healthy Leaf",
        "label_kn": "ಆರೋಗ್ಯಕರ ಎಲೆ",
        "is_healthy": True,
        "source_dataset": "PlantVillage Dataset (Mohanty et al., 2016)",
        "icon": "🌽"
    },
    {
        "filename": "tomato_disease_demo_01.jpg",
        "crop": "tomato",
        "crop_name_en": "Tomato",
        "crop_name_kn": "ಟೊಮೇಟೊ",
        "label_en": "Early Blight",
        "label_kn": "ಮುಂಗಾರು ಬ್ಲೈಟ್ ರೋಗ",
        "is_healthy": False,
        "source_dataset": "PlantVillage Dataset (Mohanty et al., 2016)",
        "icon": "🍅"
    },
    {
        "filename": "tomato_disease_demo_02.jpg",
        "crop": "tomato",
        "crop_name_en": "Tomato",
        "crop_name_kn": "ಟೊಮೇಟೊ",
        "label_en": "Healthy Leaf",
        "label_kn": "ಆರೋಗ್ಯಕರ ಎಲೆ",
        "is_healthy": True,
        "source_dataset": "PlantVillage Dataset (Mohanty et al., 2016)",
        "icon": "🍅"
    },
    {
        "filename": "rice_disease_demo_01.jpg",
        "crop": "rice",
        "crop_name_en": "Rice (Paddy)",
        "crop_name_kn": "ಭತ್ತ",
        "label_en": "Brown Spot",
        "label_kn": "ಕಂದು ಚುಕ್ಕೆ ರೋಗ",
        "is_healthy": False,
        "source_dataset": "Rice Leaf Disease Dataset (UCI ML / ICAR)",
        "icon": "🌾"
    },
    {
        "filename": "rice_disease_demo_02.jpg",
        "crop": "rice",
        "crop_name_en": "Rice (Paddy)",
        "crop_name_kn": "ಭತ್ತ",
        "label_en": "Bacterial Blight",
        "label_kn": "ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಎಲೆ ಬ್ಲೈಟ್",
        "is_healthy": False,
        "source_dataset": "Rice Leaf Disease Dataset (UCI ML / ICAR)",
        "icon": "🌾"
    },
    {
        "filename": "cotton_disease_demo_01.jpg",
        "crop": "cotton",
        "crop_name_en": "Cotton",
        "crop_name_kn": "ಹತ್ತಿ",
        "label_en": "Bacterial Blight",
        "label_kn": "ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಬ್ಲೈಟ್",
        "is_healthy": False,
        "source_dataset": "Cotton Plant Disease Dataset (Kaggle / Farmaan10)",
        "icon": "🌿"
    },
    {
        "filename": "cotton_disease_demo_02.jpg",
        "crop": "cotton",
        "crop_name_en": "Cotton",
        "crop_name_kn": "ಹತ್ತಿ",
        "label_en": "Healthy Leaf",
        "label_kn": "ಆರೋಗ್ಯಕರ ಎಲೆ",
        "is_healthy": True,
        "source_dataset": "Cotton Plant Disease Dataset (Kaggle / Farmaan10)",
        "icon": "🌿"
    }
]

@router.get("/supported-crops")
def get_disease_supported_crops():
    return {"supported_crops": SUPPORTED_CROPS}

@router.get("/demo-samples")
def get_demo_disease_samples():
    """List the 10 verified demonstration images across 5 crops with metadata."""
    results = []
    for item in DEMO_DISEASE_SAMPLES:
        entry = dict(item)
        entry["image_url"] = f"/api/disease/demo-sample-file/{item['filename']}"
        entry["demonstration_only"] = True
        results.append(entry)
    return {"status": "success", "total_samples": len(results), "samples": results}

@router.get("/demo-sample-file/{filename}")
async def get_demo_disease_sample_file(filename: str):
    """Serve verified demonstration leaf image file."""
    clean_name = Path(filename).name
    file_path = (DISEASE_DIR / clean_name).resolve()
    
    if file_path.is_file() and DISEASE_DIR in file_path.parents and file_path.exists():
        return FileResponse(str(file_path), media_type="image/jpeg", filename=clean_name)
        
    return JSONResponse(status_code=404, content={"status": "error", "message": f"Sample image '{clean_name}' not found"})

@router.post("/diagnose")
@router.post("/detect")
async def diagnose_plant_disease(
    file: UploadFile = File(None),
    crop: Optional[str] = Form(None),
    plant_id: Optional[str] = Form(None)
):
    target_crop = crop or plant_id
    if not target_crop:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Missing crop or plant_id parameter."})

    if file is None or not hasattr(file, "read"):
        return JSONResponse(status_code=400, content={"status": "error", "message": "No image uploaded. Please upload a clear plant leaf image."})

    try:
        content = await file.read()
    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "error", "message": f"Failed to read uploaded file: {str(e)}"})

    if not content or len(content) == 0:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Uploaded file is empty. Please select a valid leaf image."})

    try:
        result = disease_service.diagnose(target_crop, content)
    except ValueError as ve:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(ve)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Diagnosis error: {str(e)}"})

    if result.get("status") == "rejected":
        return JSONResponse(status_code=400, content=result)

    return result

