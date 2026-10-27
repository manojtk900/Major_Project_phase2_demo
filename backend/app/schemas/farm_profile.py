"""
MannuMitra - Unified Farm Profile and Recommendation Data Contracts
Supports shared farm-water profile, farmer-verified soil data,
resource scaling (farm area), and configurable crop planning priorities.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Literal

class FarmWaterProfile(BaseModel):
    water_source: str = Field(
        default="borewell",
        description="Primary water source: borewell, canal, open_well, river, rainfed, other"
    )
    is_irrigated: bool = Field(
        default=True,
        description="Whether the land parcel has irrigation infrastructure"
    )
    irrigation_method: Optional[str] = Field(
        default="drip",
        description="Irrigation technology: drip, sprinkler, furrow, flood, rainfed"
    )
    water_availability_level: Optional[str] = Field(
        default="moderate",
        description="Perceived availability: scarce, moderate, abundant"
    )
    water_quality: Optional[str] = Field(
        default="normal",
        description="Water quality / salinity status: normal, moderate_salinity, saline"
    )
    measured_ec_ds_m: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=20.0,
        description="Electrical conductivity of irrigation water in dS/m if tested"
    )
    seasonal_rainfall_mm: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=5000.0,
        description="Expected or historical seasonal rainfall in mm"
    )
    farm_area_acres: Optional[float] = Field(
        default=1.0,
        ge=0.01,
        le=1000.0,
        description="Land parcel area in acres for volumetric irrigation calculations"
    )

class CropPlanningPreferences(BaseModel):
    sowing_date: Optional[str] = Field(
        default=None,
        description="Planned sowing date (YYYY-MM-DD or YYYY-MM)"
    )
    season: Optional[str] = Field(
        default=None,
        description="Agro-climatic season: Kharif, Rabi, Summer"
    )
    selected_mandi: Optional[str] = Field(
        default=None,
        description="Preferred local APMC Mandi"
    )
    selected_variety: Optional[str] = Field(
        default=None,
        description="Preferred crop variety if chosen"
    )
    priority_mode: Literal["balanced", "water_priority", "market_priority"] = Field(
        default="balanced",
        description="Strategy priority for multi-stage ranking"
    )
    custom_weights: Optional[Dict[str, float]] = Field(
        default=None,
        description="Optional custom weights overriding priority_mode"
    )

class UnifiedRecommendationRequest(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def map_short_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "nitrogen" not in data and "N" in data:
                data["nitrogen"] = data["N"]
            if "phosphorus" not in data and "P" in data:
                data["phosphorus"] = data["P"]
            if "potassium" not in data and "K" in data:
                data["potassium"] = data["K"]
        return data

    # Core 7 Trained ML Features (Strictly preserved for Random Forest model)
    nitrogen: float = Field(..., ge=0, le=500, description="Available Nitrogen (kg/ha)")
    phosphorus: float = Field(..., ge=0, le=500, description="Available Phosphorus (kg/ha)")
    potassium: float = Field(..., ge=0, le=500, description="Available Potassium (kg/ha)")
    temperature: float = Field(..., ge=-10, le=60, description="Ambient Temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative Humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH (0-14)")
    rainfall: float = Field(..., ge=0, le=3000, description="Annual / Seasonal Rainfall (mm)")

    # Farm & Location Context
    district: Optional[str] = Field(default="Mandya", description="Karnataka District")
    soil_type: Optional[str] = Field(default="red_soil", description="Soil classification")
    farm_area_acres: Optional[float] = Field(default=1.0, ge=0.01, le=1000.0, description="Farm area in acres")

    # Shared Farm Water Resources Profile
    water_source: str = Field(default="borewell")
    is_irrigated: bool = Field(default=True)
    irrigation_method: Optional[str] = Field(default="drip")
    water_availability_level: Optional[str] = Field(default="moderate")
    water_quality: Optional[str] = Field(default="normal")
    measured_ec_ds_m: Optional[float] = Field(default=None)

    # Planning & Strategic Trade-off Preferences
    sowing_date: Optional[str] = Field(default=None)
    season: Optional[str] = Field(default=None)
    selected_mandi: Optional[str] = Field(default=None)
    selected_variety: Optional[str] = Field(default=None)
    priority_mode: Literal["balanced", "water_priority", "market_priority"] = Field(default="balanced")
    custom_weights: Optional[Dict[str, float]] = Field(default=None)

    # Verification Flag from Soil Report OCR
    soil_verified_by_farmer: bool = Field(default=False)

    @field_validator("ph")
    @classmethod
    def validate_realistic_ph(cls, v: float) -> float:
        if v < 3.5 or v > 10.0:
            raise ValueError(f"Soil pH {v} is outside realistic agronomic bounds (3.5 - 10.0).")
        return v

    @field_validator("temperature")
    @classmethod
    def validate_realistic_temperature(cls, v: float) -> float:
        if v < 5.0 or v > 55.0:
            raise ValueError(f"Temperature {v}°C is outside realistic agricultural bounds (5°C - 55°C).")
        return v
