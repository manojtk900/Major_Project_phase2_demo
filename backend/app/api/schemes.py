"""
MannuMitra - Farmer Welfare and Schemes Directory API Router
Supports full scheme catalogue, multi-criteria filtering, and dedicated crop insurance hub.
"""
from typing import Optional
from fastapi import APIRouter
from app.services.scheme_service import FarmerSchemeService

router = APIRouter(prefix="/api/schemes", tags=["Farmer Welfare Schemes"])
scheme_service = FarmerSchemeService()

@router.get("")
def get_schemes(
    crop: Optional[str] = None,
    is_irrigated: Optional[bool] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None
):
    schemes = scheme_service.find_relevant_schemes(
        crop=crop,
        is_irrigated=is_irrigated,
        category=category,
        level=level,
        district=district,
        search=search
    )
    return {
        "status": "success",
        "total_count": len(schemes),
        "schemes": schemes,
        "insurance_resources": scheme_service.get_insurance_resources()
    }

@router.get("/insurance")
def get_insurance_resources():
    return {
        "status": "success",
        "insurance_resources": scheme_service.get_insurance_resources()
    }
