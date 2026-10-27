"""
MannuMitra - Crop Lifecycle Pydantic Schemas
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LifecycleStageDetail(BaseModel):
    stage_id: str
    name_en: str
    name_kn: str
    icon: str
    start_day: Optional[int] = None
    end_day: Optional[int] = None
    start_month: Optional[int] = None
    end_month: Optional[int] = None
    description_en: str
    description_kn: str
    tasks_en: List[str] = []
    tasks_kn: List[str] = []
    key_observations_en: Optional[str] = None
    key_observations_kn: Optional[str] = None
    weather_sensitivity: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    main_photo: Optional[Dict[str, Any]] = None
    what_happens_en: Optional[str] = None
    what_happens_kn: Optional[str] = None
    farmer_actions: Optional[Dict[str, Any]] = None
    gallery_photos: Optional[List[Dict[str, Any]]] = None
    video: Optional[Dict[str, Any]] = None
    animation_type: Optional[str] = None
    quick_tip_en: Optional[str] = None
    quick_tip_kn: Optional[str] = None
    references: Optional[List[Dict[str, Any]]] = None


class CropLifecycleMeta(BaseModel):
    crop_id: str
    crop_name_en: str
    crop_name_kn: str
    lifecycle_type: str
    total_duration_days: int
    stages_count: int


class CropLifecycleResponse(BaseModel):
    crop_id: str
    crop_name_en: str
    crop_name_kn: str
    lifecycle_type: str
    total_duration_days: int
    harvest_window_days: Optional[int] = None
    stages: List[LifecycleStageDetail]


class TimelineNode(BaseModel):
    stage_id: str
    name_en: str
    name_kn: str
    icon: str
    status: str  # "completed", "current", "upcoming"
    day_range: Optional[str] = None
    image_url: Optional[str] = None


class TodayActionDetail(BaseModel):
    headline_en: str
    headline_kn: str
    action_en: str
    action_kn: str
    reason_en: Optional[str] = None
    reason_kn: Optional[str] = None
    weather_context_en: Optional[str] = None
    weather_context_kn: Optional[str] = None
    is_weather_alert: bool = False
    icon: str = "🌱"


class CurrentStageCalculation(BaseModel):
    crop_id: str
    crop_name_en: str
    crop_name_kn: str
    lifecycle_type: str
    sowing_date: str
    current_date: str
    current_day: int
    crop_age_label: str = "Day 1"
    elapsed_days: int = 0
    remaining_days: Optional[int] = None
    total_duration_days: int
    progress_percentage: int
    overall_progress_text: str = ""
    stage_progress_percentage: int = 0
    stage_day_current: int = 1
    stage_total_days: int = 1
    stage_progress_text: str = ""
    current_stage: LifecycleStageDetail
    next_stage: Optional[Dict[str, Any]] = None
    days_to_next_stage: Optional[int] = None
    completed_stages: List[str] = []
    upcoming_stages: List[str] = []
    timeline: List[TimelineNode] = []
    timeline_nodes: Optional[List[TimelineNode]] = None
    today_action: TodayActionDetail
    projected_harvest_date: Optional[str] = None
    calendar_dates: Optional[Dict[str, Any]] = None


class CalendarDayDetail(BaseModel):
    date: str
    crop_day: int
    stage_id: str
    stage_name_en: str
    stage_name_kn: str
    stage_icon: str
    planned_action_en: str
    planned_action_kn: str
    status: str  # "completed", "current", "upcoming"
    is_today: bool = False
