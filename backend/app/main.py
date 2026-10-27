import sys
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

"""
MannuMitra - Core FastAPI Application (Production DSS Backend)
Modular architecture incorporating all sub-routers:
  - api/crop.py
  - api/water.py
  - api/market.py
  - api/soil_report.py
  - api/disease.py
  - api/schemes.py
  - api/weather.py
"""
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.api.crop import router as crop_router
from app.api.water import router as water_router
from app.api.market import router as market_router
from app.api.soil_report import router as soil_report_router
from app.api.disease import router as disease_router
from app.api.schemes import router as schemes_router
from app.api.weather import router as weather_router
from app.api.soil_types import router as soil_types_router
from app.api.lifecycle import router as lifecycle_router
from app.api.economics import router as economics_router
from app.core.config import FRONTEND_DIR

app = FastAPI(
    title="MannuMitra: Market-Aware Predictive Farming & Crop Health DSS",
    description="Integrated Agronomic, Resource-Aware, and Market-Driven Decision Support System for Indian Farmers",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/ui"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# Register modular sub-routers
app.include_router(crop_router)
app.include_router(water_router)
app.include_router(market_router)
app.include_router(soil_report_router)
app.include_router(disease_router)
app.include_router(schemes_router)
app.include_router(weather_router)
app.include_router(soil_types_router)
app.include_router(lifecycle_router)
app.include_router(economics_router)

# Mount frontend static files
if FRONTEND_DIR.exists():
    app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="ui")

DEMO_SAMPLES_DIR = FRONTEND_DIR.parent / "demo_samples"
if not DEMO_SAMPLES_DIR.exists():
    DEMO_SAMPLES_DIR = FRONTEND_DIR.parent / "s_demo_samples"
if DEMO_SAMPLES_DIR.exists():
    app.mount("/demo-samples", StaticFiles(directory=str(DEMO_SAMPLES_DIR)), name="demo-samples")

@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept and FRONTEND_DIR.exists():
        return RedirectResponse(url="/ui/")
    return {
        "system": "MannuMitra Decision Support Platform",
        "version": "2.0.0",
        "status": "operational",
        "ui_url": "/ui/",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "crop_model": "RandomForestClassifier (300 trees, 30 classes)",
        "model_artifact": "models/rf_30_class/rf_final.pkl",
        "decision_engine": "Integrated Multi-Stage (Agronomy + Water + Market + Forecast)",
        "water_engine": "FAO 56 / ICAR standard",
        "market_provider": "AGMARKNET Daily Bulletin Pipeline",
        "ocr_service": "Soil Report Digital Extraction",
        "disease_engine": "MobileNetV2 Transfer Learning (5 Crops + Pre-Screening + Grad-CAM)"
    }
