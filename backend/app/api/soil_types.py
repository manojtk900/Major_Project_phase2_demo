"""
MannuMitra - Soil Types Reference API
"""
import json
from pathlib import Path
from fastapi import APIRouter

from app.core.config import DATA_DIR, BASE_DIR

router = APIRouter(prefix="/api", tags=["Soil Types"])
_LOCAL_SOIL = DATA_DIR / "references" / "karnataka_soil_defaults.json"
_FALLBACK_SOIL = BASE_DIR / "data" / "references" / "karnataka_soil_defaults.json"
SOIL_FILE = _LOCAL_SOIL if _LOCAL_SOIL.exists() else _FALLBACK_SOIL

@router.get("/soil-types")
def get_soil_types():
    if SOIL_FILE.exists():
        data = json.loads(SOIL_FILE.read_text(encoding="utf-8"))
        return {"soil_types": data.get("soil_types", [])}
    return {"soil_types": []}
