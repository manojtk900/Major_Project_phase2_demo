"""
MannuMitra - Crop Lifecycle and Stage Detail API Router
Powered by UAS Bengaluru / Karnataka Package of Practices knowledge base.
Provides day-by-day active stage tracking, timeline nodes, and farmer guidance.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.lifecycle import (
    CropLifecycleMeta,
    CropLifecycleResponse,
    LifecycleStageDetail,
    CurrentStageCalculation,
    CalendarDayDetail
)
from app.services.lifecycle_service import lifecycle_service

router = APIRouter(prefix="/api/lifecycle", tags=["Crop Lifecycle"])

SUPPORTED_PILOT_CROPS = ["ragi", "rice", "maize", "tomato", "arecanut", "cotton"]

@router.get("/crops", response_model=List[CropLifecycleMeta], summary="List pilot crops with structured lifecycles")
def get_supported_lifecycle_crops():
    """Returns metadata for all 5 Karnataka pilot crops with verified lifecycle definitions."""
    return lifecycle_service.get_supported_crops()

@router.get("/{crop_id}", response_model=CropLifecycleResponse, summary="Get full lifecycle definition for a crop")
def get_crop_lifecycle(crop_id: str):
    """Returns full lifecycle definition, stages, day windows, tasks, and tips for a crop."""
    data = lifecycle_service.get_crop_lifecycle(crop_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lifecycle definition not found for crop '{crop_id}'. Supported pilot crops: {', '.join(SUPPORTED_PILOT_CROPS)}"
        )
    return data

@router.get("/{crop_id}/stage/{stage_id}", response_model=LifecycleStageDetail, summary="Get rich detail for a specific stage")
def get_lifecycle_stage_detail(crop_id: str, stage_id: str):
    """Returns stage detail: actions, photos, animations, quick tips and package of practices."""
    stage = lifecycle_service.get_stage_detail(crop_id, stage_id)
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stage '{stage_id}' not found for crop '{crop_id}'."
        )
    return stage

@router.get("/{crop_id}/stage-by-day", response_model=CurrentStageCalculation, summary="Calculate active stage and progress from sowing date")
def get_stage_by_day(
    crop_id: str,
    sowing_date: Optional[str] = Query(None, description="Sowing or planting date (YYYY-MM-DD)"),
    district: Optional[str] = Query(None, description="Optional Karnataka district name"),
    target_date: Optional[str] = Query(None, description="Optional target date to simulate")
):
    """
    Calculates active lifecycle stage, timeline nodes, crop age, overall progress,
    and weather-aware today's action from sowing date.
    """
    cid = crop_id.lower().strip()
    if cid not in SUPPORTED_PILOT_CROPS:
        norm = lifecycle_service.normalize_crop_id(cid)
        if norm not in SUPPORTED_PILOT_CROPS:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lifecycle tracking currently supports Karnataka pilot crops: {', '.join(SUPPORTED_PILOT_CROPS)}. Received: '{crop_id}'"
            )

    try:
        # Default gracefully if sowing_date is not provided
        s_date = sowing_date if (sowing_date and sowing_date.strip()) else "2026-06-15"
        return lifecycle_service.calculate_stage_by_day(
            crop_id=cid,
            sowing_date_str=s_date,
            district=district,
            target_date_str=target_date
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error calculating crop lifecycle for '{crop_id}': {str(e)}"
        )
