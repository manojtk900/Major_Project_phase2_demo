"""
MannuMitra - Core Configuration and Settings
"""
from pathlib import Path

# Resolve base dir dynamically (works in D:/Final_Predictve_Forming_System, D:/improved forming system, or D:/MannuMitra)
_CANDIDATES = [
    Path(__file__).resolve().parents[3],
    Path("D:/Final_Predictve_Forming_System"),
    Path("D:/improved forming system"),
    Path("D:/MannuMitra")
]
BASE_DIR = _CANDIDATES[0]
for c in _CANDIDATES:
    if (c / "models").exists() and (c / "frontend").exists():
        BASE_DIR = c
        break

MODELS_DIR = BASE_DIR / "models"
BASELINE_DIR = MODELS_DIR / "baseline"
EXPERIMENTS_DIR = MODELS_DIR / "experiments"
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIR = BASE_DIR / "frontend"

# Active Production Crop Recommendation Model (30-Crop Random Forest)
CROP_MODEL_DIR = MODELS_DIR / "rf_30_class"
CROP_MODEL_PATH = CROP_MODEL_DIR / "rf_final.pkl"

DEFAULT_WEIGHTS = {
    "agronomic": 0.35,
    "water": 0.25,
    "market_price": 0.15,
    "harvest_outlook": 0.15,
    "risk_completeness": 0.10
}
