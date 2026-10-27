"""
MannuMitra - Pydantic Request and Response Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from app.schemas.farm_profile import UnifiedRecommendationRequest, FarmWaterProfile, CropPlanningPreferences

# RecommendationRequest backwards-compatible alias / extension
class RecommendationRequest(UnifiedRecommendationRequest):
    pass

class WaterEvaluationRequest(BaseModel):
    crop: str = Field(..., description="Target crop name")
    water_source: str = Field(default="borewell")
    is_irrigated: bool = Field(default=True)
    irrigation_method: Optional[str] = Field(default="drip")
    water_availability_level: Optional[str] = Field(default="moderate")
    water_quality: Optional[str] = Field(default="normal")
    measured_ec_ds_m: Optional[float] = Field(default=None)
    seasonal_rainfall_mm: Optional[float] = Field(default=600.0)
