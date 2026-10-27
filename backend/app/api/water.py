"""
MannuMitra - Water Resource Compatibility API Router (Milestone 1)
Supports farm water profile, FAO-56 requirements, and salinity quality evaluation.
"""
from fastapi import APIRouter
from app.schemas.recommendation import WaterEvaluationRequest
from app.services.water_service import WaterSuitabilityEngine, CROP_WATER_PROFILES

router = APIRouter(prefix="/api/water", tags=["Water Suitability"])
water_engine = WaterSuitabilityEngine()

@router.get("/profiles")
def get_water_profiles():
    return {"crop_water_profiles": CROP_WATER_PROFILES}

@router.post("/evaluate")
def evaluate_water(payload: WaterEvaluationRequest):
    eval_result = water_engine.evaluate_crop_water_compatibility(
        crop=payload.crop,
        water_source=payload.water_source,
        is_irrigated=payload.is_irrigated,
        irrigation_method=payload.irrigation_method,
        water_availability_level=payload.water_availability_level,
        water_quality=payload.water_quality,
        measured_ec_ds_m=payload.measured_ec_ds_m,
        seasonal_rainfall_mm=payload.seasonal_rainfall_mm or 600.0
    )
    return {"status": "success", "evaluation": eval_result}
