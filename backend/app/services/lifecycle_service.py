"""
Crop Lifecycle Service for AI-Based Predictive Farming System.
Provides day-by-day stage tracking, progress calculation, timeline nodes,
weather-aware today's action advice, and calendar mapping for pilot crops.
Supports both annual field crops and perennial plantation crops (Arecanut).
"""

import os
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional

from app.schemas.lifecycle import (
    LifecycleStageDetail,
    CropLifecycleMeta,
    CropLifecycleResponse,
    TimelineNode,
    TodayActionDetail,
    CurrentStageCalculation
)
from app.services.weather_service import weather_service
from app.core.config import DATA_DIR, BASE_DIR

import logging
from pathlib import Path
_LOCAL_LIFECYCLES = DATA_DIR / 'references/crop_lifecycles.json'
_FALLBACK_LIFECYCLES = BASE_DIR / 'data/references/crop_lifecycles.json'
LIFECYCLES_FILE = _LOCAL_LIFECYCLES if _LOCAL_LIFECYCLES.exists() else _FALLBACK_LIFECYCLES

logger = logging.getLogger("mannumitra.lifecycle_service")


class LifecycleService:
    """Singleton service for crop lifecycle calculation and knowledge base."""

    def __init__(self):
        self._crops: Dict[str, Any] = {}
        self._metadata: Dict[str, Any] = {}
        self._load_data()

    def _load_data(self):
        """Loads crop lifecycle data from reference JSON."""
        try:
            if os.path.exists(LIFECYCLES_FILE):
                with open(LIFECYCLES_FILE, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    self._metadata = content.get("_metadata", {})
                    self._crops = content.get("crops", {})
            else:
                self._crops = {}
        except Exception as e:
            logger.warning(f"Failed to load crop lifecycles from {LIFECYCLES_FILE}: {e}")
            self._crops = {}

    def get_supported_crops(self) -> List[CropLifecycleMeta]:
        """Returns metadata summary for all supported lifecycle crops."""
        results = []
        for cid, data in self._crops.items():
            results.append(CropLifecycleMeta(
                crop_id=cid,
                crop_name_en=data.get("crop_name_en", cid.title()),
                crop_name_kn=data.get("crop_name_kn", cid),
                lifecycle_type=data.get("lifecycle_type", "annual"),
                total_duration_days=data.get("total_duration_days", 100),
                stages_count=len(data.get("stages", []))
            ))
        return results

    def normalize_crop_id(self, crop_id: str) -> str:
        """Normalizes crop alias/input into canonical crop ID."""
        cleaned = (crop_id or "").strip().lower().replace("-", "_").replace(" ", "_")
        aliases = {
            "finger_millet": "ragi",
            "fingermillet": "ragi",
            "ragi": "ragi",
            "paddy": "rice",
            "rice": "rice",
            "corn": "maize",
            "maize": "maize",
            "tomato": "tomato",
            "supari": "arecanut",
            "arecanut": "arecanut",
            "betel_nut": "arecanut",
            "betel nut": "arecanut",
            "tamatar": "tomato"
        }
        return aliases.get(cleaned, cleaned)

    def get_crop_lifecycle(self, crop_id: str) -> Optional[CropLifecycleResponse]:
        """Returns full lifecycle definition for a crop."""
        cid = self.normalize_crop_id(crop_id)
        data = self._crops.get(cid)
        if not data:
            return None

        stages = [LifecycleStageDetail(**s) for s in data.get("stages", [])]
        return CropLifecycleResponse(
            crop_id=cid,
            crop_name_en=data.get("crop_name_en", cid.title()),
            crop_name_kn=data.get("crop_name_kn", cid),
            lifecycle_type=data.get("lifecycle_type", "annual"),
            total_duration_days=data.get("total_duration_days", 100),
            harvest_window_days=data.get("harvest_window_days"),
            stages=stages
        )

    def get_stage_detail(self, crop_id: str, stage_id: str) -> Optional[LifecycleStageDetail]:
        """Returns rich detail for a specific stage of a crop."""
        crop_resp = self.get_crop_lifecycle(crop_id)
        if not crop_resp:
            return None
        for stage in crop_resp.stages:
            if stage.stage_id == stage_id:
                return stage
        return None

    def calculate_stage_by_day(
        self,
        crop_id: str,
        sowing_date_str: str,
        district: Optional[str] = None,
        target_date_str: Optional[str] = None
    ) -> CurrentStageCalculation:
        """
        Calculates the active lifecycle stage, timeline, progress, and today's action
        from the sowing/planting date.
        """
        cid = self.normalize_crop_id(crop_id)
        crop_data = self._crops.get(cid)
        if not crop_data:
            # Fallback to ragi if unlisted
            cid = "ragi"
            crop_data = self._crops.get("ragi", {})

        # Parse dates
        try:
            sowing_date = datetime.strptime(sowing_date_str.strip(), "%Y-%m-%d").date()
        except Exception:
            sowing_date = date.today()

        if target_date_str:
            try:
                curr_date = datetime.strptime(target_date_str.strip(), "%Y-%m-%d").date()
            except Exception:
                curr_date = date.today()
        else:
            curr_date = date.today()

        lifecycle_type = crop_data.get("lifecycle_type", "annual")
        stages_raw = crop_data.get("stages", [])
        total_duration = crop_data.get("total_duration_days", 100)

        # Weather context
        weather_data = None
        if district:
            try:
                weather_data = weather_service.fetch_weather(district)
            except Exception:
                pass

        if lifecycle_type == "perennial":
            return self._calculate_perennial(
                cid=cid,
                crop_data=crop_data,
                sowing_date=sowing_date,
                curr_date=curr_date,
                weather_data=weather_data
            )
        else:
            return self._calculate_annual(
                cid=cid,
                crop_data=crop_data,
                sowing_date=sowing_date,
                curr_date=curr_date,
                weather_data=weather_data
            )

    def _calculate_annual(
        self,
        cid: str,
        crop_data: Dict[str, Any],
        sowing_date: date,
        curr_date: date,
        weather_data: Optional[Dict[str, Any]]
    ) -> CurrentStageCalculation:
        """Calculate progression for annual crops (Ragi, Rice, Maize, Tomato)."""
        stages_raw = crop_data.get("stages", [])
        total_duration = crop_data.get("total_duration_days", 100)

        # Day calculation (1-indexed)
        elapsed_days = (curr_date - sowing_date).days
        if elapsed_days < 0:
            # Sowing date is in the future
            current_day = 0
            crop_age_label = "Pre-sowing (ಬಿತ್ತನೆ ಪೂರ್ವ)"
            remaining_days = total_duration
            progress_pct = 0
            overall_progress_text = f"0 / {total_duration} days (0%)"
            current_stage_raw = stages_raw[0]
            current_stage_idx = 0
            stage_total_days = max(1, current_stage_raw.get("end_day", 10) - current_stage_raw.get("start_day", 1) + 1)
            stage_day_current = 0
            stage_progress_percentage = 0
            stage_progress_text = "Stage starts on sowing date"
        else:
            current_day = elapsed_days + 1
            crop_age_label = f"DAY {current_day}"
            effective_day = min(current_day, total_duration)
            remaining_days = max(0, total_duration - current_day)
            progress_pct = max(1, min(100, int((effective_day / total_duration) * 100)))
            overall_progress_text = f"{min(current_day, total_duration)} / {total_duration} days ({progress_pct}%)"

            # Find active stage
            current_stage_raw = stages_raw[0]
            current_stage_idx = 0

            for idx, s in enumerate(stages_raw):
                start = s.get("start_day", 1)
                end = s.get("end_day", total_duration)
                if start <= effective_day <= end:
                    current_stage_raw = s
                    current_stage_idx = idx
                    break
                elif effective_day > end:
                    current_stage_raw = s
                    current_stage_idx = idx

            stg_start = current_stage_raw.get("start_day", 1)
            stg_end = current_stage_raw.get("end_day", total_duration)
            stage_total_days = max(1, stg_end - stg_start + 1)
            if current_day > stg_end:
                stage_day_current = stage_total_days
                stage_progress_percentage = 100
                stage_progress_text = "Completed" if current_stage_idx < len(stages_raw) - 1 else "Harvest Window"
            else:
                stage_day_current = max(1, current_day - stg_start + 1)
                stage_progress_percentage = max(1, min(100, int((stage_day_current / stage_total_days) * 100)))
                stage_progress_text = f"Day {stage_day_current} of {stage_total_days} ({stage_progress_percentage}%)"

        current_stage = LifecycleStageDetail(**current_stage_raw)

        # Next stage identification
        next_stage = None
        days_to_next = None
        if current_stage_idx + 1 < len(stages_raw):
            nxt = stages_raw[current_stage_idx + 1]
            next_stage = {
                "stage_id": nxt["stage_id"],
                "name_en": nxt["name_en"],
                "name_kn": nxt["name_kn"],
                "icon": nxt["icon"],
                "start_day": nxt.get("start_day")
            }
            nxt_start = nxt.get("start_day", current_day + 1)
            days_to_next = max(1, nxt_start - current_day)

        # Completed & Upcoming stage IDs
        completed_stages = [
            s["stage_id"] for idx, s in enumerate(stages_raw)
            if idx < current_stage_idx
        ]
        upcoming_stages = [
            s["stage_id"] for idx, s in enumerate(stages_raw)
            if idx > current_stage_idx
        ]

        # Horizontal Timeline Nodes
        timeline = []
        for idx, s in enumerate(stages_raw):
            if idx < current_stage_idx:
                status = "completed"
            elif idx == current_stage_idx:
                status = "current"
            else:
                status = "upcoming"

            start = s.get("start_day", 1)
            end = s.get("end_day", total_duration)
            img_url = s.get("thumbnail") or (s.get("main_photo") or {}).get("url")
            timeline.append(TimelineNode(
                stage_id=s["stage_id"],
                name_en=s["name_en"],
                name_kn=s["name_kn"],
                icon=s["icon"],
                status=status,
                day_range=f"Day {start}-{end}",
                image_url=img_url
            ))

        # Synthesize Today's Action with Weather Context
        today_action = self._synthesize_today_action(
            crop_name_en=crop_data.get("crop_name_en", cid.title()),
            crop_name_kn=crop_data.get("crop_name_kn", cid),
            stage_raw=current_stage_raw,
            current_day=max(1, current_day),
            weather_data=weather_data
        )

        projected_harvest = sowing_date + timedelta(days=total_duration)

        # Calendar generation (dates up to today that were active)
        calendar_info = {
            "sowing_date": sowing_date.isoformat(),
            "current_date": curr_date.isoformat(),
            "projected_harvest_date": projected_harvest.isoformat(),
            "total_past_days": max(0, elapsed_days),
            "completed_dates": [
                (sowing_date + timedelta(days=i)).isoformat()
                for i in range(max(0, elapsed_days))
            ] if 0 <= elapsed_days <= 120 else []
        }

        return CurrentStageCalculation(
            crop_id=cid,
            crop_name_en=crop_data.get("crop_name_en", cid.title()),
            crop_name_kn=crop_data.get("crop_name_kn", cid),
            lifecycle_type="annual",
            sowing_date=sowing_date.isoformat(),
            current_date=curr_date.isoformat(),
            current_day=current_day,
            crop_age_label=crop_age_label,
            elapsed_days=max(0, elapsed_days),
            remaining_days=remaining_days,
            total_duration_days=total_duration,
            progress_percentage=progress_pct,
            overall_progress_text=overall_progress_text,
            stage_progress_percentage=stage_progress_percentage,
            stage_day_current=stage_day_current,
            stage_total_days=stage_total_days,
            stage_progress_text=stage_progress_text,
            current_stage=current_stage,
            next_stage=next_stage,
            days_to_next_stage=days_to_next,
            completed_stages=completed_stages,
            upcoming_stages=upcoming_stages,
            timeline=timeline,
            timeline_nodes=timeline,
            today_action=today_action,
            projected_harvest_date=projected_harvest.isoformat(),
            calendar_dates=calendar_info
        )

    def _calculate_perennial(
        self,
        cid: str,
        crop_data: Dict[str, Any],
        sowing_date: date,
        curr_date: date,
        weather_data: Optional[Dict[str, Any]]
    ) -> CurrentStageCalculation:
        """Calculate recurring seasonal management for Arecanut (perennial palm)."""
        stages_raw = crop_data.get("stages", [])
        curr_month = curr_date.month

        month_names_en = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        month_names_kn = ["ಜನವರಿ", "ಫೆಬ್ರವರಿ", "ಮಾರ್ಚ್", "ಏಪ್ರಿಲ್", "ಮೇ", "ಜೂನ್", "ಜುಲೈ", "ಆಗಸ್ಟ್", "ಸೆಪ್ಟೆಂಬರ್", "ಅಕ್ಟೋಬರ್", "ನವೆಂಬರ್", "ಡಿಸೆಂಬರ್"]

        current_stage_raw = stages_raw[0]
        current_stage_idx = 0

        for idx, s in enumerate(stages_raw):
            sm = s.get("start_month", 1)
            em = s.get("end_month", 12)
            if sm <= curr_month <= em:
                current_stage_raw = s
                current_stage_idx = idx
                break

        current_stage = LifecycleStageDetail(**current_stage_raw)

        # Next stage
        next_stage = None
        days_to_next = None
        nxt_idx = (current_stage_idx + 1) % len(stages_raw)
        nxt = stages_raw[nxt_idx]
        next_stage = {
            "stage_id": nxt["stage_id"],
            "name_en": nxt["name_en"],
            "name_kn": nxt["name_kn"],
            "icon": nxt["icon"],
            "start_month": nxt.get("start_month")
        }

        # Days until next month boundary
        em = current_stage_raw.get("end_month", curr_month)
        if em >= curr_month:
            next_month_first = date(curr_date.year, em % 12 + 1, 1) if em < 12 else date(curr_date.year + 1, 1, 1)
            days_to_next = max(1, (next_month_first - curr_date).days)
        else:
            days_to_next = 30

        # Day of year out of 365
        day_of_year = curr_date.timetuple().tm_yday
        progress_pct = max(1, min(100, int((day_of_year / 365.0) * 100)))

        # Stage progress in months
        sm = current_stage_raw.get("start_month", 1)
        em = current_stage_raw.get("end_month", 12)
        total_stage_months = max(1, em - sm + 1)
        cur_stage_month = min(total_stage_months, max(1, curr_month - sm + 1))
        stage_progress_percentage = max(1, min(100, int((cur_stage_month / total_stage_months) * 100)))
        stage_progress_text = f"Month {cur_stage_month} of {total_stage_months} in stage ({stage_progress_percentage}%)"

        completed_stages = [
            s["stage_id"] for idx, s in enumerate(stages_raw)
            if idx < current_stage_idx
        ]
        upcoming_stages = [
            s["stage_id"] for idx, s in enumerate(stages_raw)
            if idx > current_stage_idx
        ]

        # Timeline nodes
        timeline = []
        month_abbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for idx, s in enumerate(stages_raw):
            status = "completed" if idx < current_stage_idx else ("current" if idx == current_stage_idx else "upcoming")
            sm_idx = s.get("start_month", 1)
            em_idx = s.get("end_month", 12)
            range_label = f"{month_abbr[sm_idx-1]}–{month_abbr[em_idx-1]}"
            img_url = s.get("thumbnail") or (s.get("main_photo") or {}).get("url")
            timeline.append(TimelineNode(
                stage_id=s["stage_id"],
                name_en=s["name_en"],
                name_kn=s["name_kn"],
                icon=s["icon"],
                status=status,
                day_range=range_label,
                image_url=img_url
            ))

        today_action = self._synthesize_today_action(
            crop_name_en=crop_data.get("crop_name_en", cid.title()),
            crop_name_kn=crop_data.get("crop_name_kn", cid),
            stage_raw=current_stage_raw,
            current_day=day_of_year,
            weather_data=weather_data
        )

        calendar_info = {
            "sowing_date": sowing_date.isoformat(),
            "current_date": curr_date.isoformat(),
            "lifecycle_cycle": "Annual Recurring Management Calendar",
            "active_month": curr_month,
            "day_of_year": day_of_year
        }

        return CurrentStageCalculation(
            crop_id=cid,
            crop_name_en=crop_data.get("crop_name_en", cid.title()),
            crop_name_kn=crop_data.get("crop_name_kn", cid),
            lifecycle_type="perennial",
            sowing_date=sowing_date.isoformat(),
            current_date=curr_date.isoformat(),
            current_day=day_of_year,
            crop_age_label=f"Month {curr_month} ({month_names_en[curr_month-1]})",
            elapsed_days=max(0, (curr_date - sowing_date).days),
            remaining_days=None,  # No false harvest countdown for perennial plantation
            total_duration_days=365,
            progress_percentage=progress_pct,
            overall_progress_text=f"Month {curr_month} of 12 (Annual Management • {progress_pct}%)",
            stage_progress_percentage=stage_progress_percentage,
            stage_day_current=cur_stage_month * 30,
            stage_total_days=total_stage_months * 30,
            stage_progress_text=stage_progress_text,
            current_stage=current_stage,
            next_stage=next_stage,
            days_to_next_stage=days_to_next,
            completed_stages=completed_stages,
            upcoming_stages=upcoming_stages,
            timeline=timeline,
            timeline_nodes=timeline,
            today_action=today_action,
            projected_harvest_date=None,  # Perennial plantation: recurring seasonal harvest
            calendar_dates=calendar_info
        )

    def _synthesize_today_action(
        self,
        crop_name_en: str,
        crop_name_kn: str,
        stage_raw: Dict[str, Any],
        current_day: int,
        weather_data: Optional[Dict[str, Any]]
    ) -> TodayActionDetail:
        """Combine current stage primary task with live weather telemetry and explicit reasons."""
        tasks_en = stage_raw.get("tasks_en", ["Inspect crop health"])
        tasks_kn = stage_raw.get("tasks_kn", ["ಬೆಳೆ ಪರಿಶೀಲನೆ ನಡೆಸಿ"])
        ws = stage_raw.get("weather_sensitivity", {})
        stage_name_en = stage_raw.get("name_en", "Growth Stage")
        stage_name_kn = stage_raw.get("name_kn", "ಬೆಳವಣಿಗೆ ಹಂತ")
        obs_en = stage_raw.get("key_observations_en", "Maintain adequate soil moisture and field hygiene.")
        obs_kn = stage_raw.get("key_observations_kn", "ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ತೋಟದ ನೈರ್ಮಲ್ಯ ಕಾಪಾಡಿ.")

        primary_task_en = tasks_en[0] if tasks_en else "Regular field inspection"
        primary_task_kn = tasks_kn[0] if tasks_kn else "ನಿಯಮಿತ ಬೆಳೆ ಪರಿಶೀಲನೆ"

        # Default Reason
        reason_en = f"The crop is currently in the {stage_name_en} stage (Day {current_day}). {obs_en}"
        reason_kn = f"ಬೆಳೆಯು ಪ್ರಸ್ತುತ {stage_name_kn} ಹಂತದಲ್ಲಿದೆ ({current_day}ನೇ ದಿನ). {obs_kn}"

        # Check weather forecast
        is_alert = False
        icon = stage_raw.get("icon", "🌱")
        weather_ctx_en = None
        weather_ctx_kn = None

        if weather_data:
            current = weather_data.get("current", {})
            daily = weather_data.get("daily", [])

            temp = float(current.get("temperature", 26.0))
            rain_today = float(current.get("rainfall", 0.0))
            rain_prob = 0
            rain_forecast = 0.0

            if daily and len(daily) > 0:
                first = daily[0]
                rain_prob = int(first.get("rain_probability", 0))
                rain_forecast = float(first.get("precipitation_sum", 0.0))

            # Rule 1: Rain forecast in 24h
            if rain_prob >= 40 or rain_forecast >= 2.0 or rain_today >= 2.0:
                is_alert = True
                icon = "🌧️"
                weather_ctx_en = f"Rain likely in next 24-48h ({rain_prob}% chance, ~{rain_forecast:.1f} mm). Postpone foliar spraying and irrigation."
                weather_ctx_kn = f"ಮುಂದಿನ 24-48 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆಯ ಸಂಭವವಿದೆ (~{rain_forecast:.1f} ಮಿಮೀ). ಸಿಂಪರಣೆ ಮತ್ತು ನೀರಾವರಿ ಮುಂದೂಡಿ."
                reason_en = f"The crop is in {stage_name_en}. Rain is expected today (~{rain_forecast:.1f} mm); delay chemical sprays and irrigation to prevent leaching and disease."
                reason_kn = f"ಬೆಳೆಯು {stage_name_kn} ಹಂತದಲ್ಲಿದೆ. ಇಂದು ಮಳೆಯ ಸಂಭವವಿರುವುದರಿಂದ (~{rain_forecast:.1f} ಮಿಮೀ) ಗೊಬ್ಬರ ಕೊಚ್ಚಿಹೋಗುವುದನ್ನು ತಡೆಯಲು ಸಿಂಪರಣೆ ಹಾಗೂ ನೀರಾವರಿ ಮುಂದೂಡಿ."
                if "action_on_rain_en" in ws:
                    primary_task_en = ws["action_on_rain_en"]
                    primary_task_kn = ws.get("action_on_rain_kn", primary_task_kn)

            # Rule 2: High heat >= 34°C
            elif temp >= 34.0:
                icon = "☀️"
                weather_ctx_en = f"High ambient temperature ({temp:.1f}°C). Water evaporation is high. Irrigate in evening if moisture is low."
                weather_ctx_kn = f"ಹೆಚ್ಚಿನ ತಾಪಮಾನ ({temp:.1f}°C). ಸಂಜೆಯ ವೇಳೆಯಲ್ಲಿ ಲಘು ನೀರಾವರಿ ಒದಗಿಸಿ."
                reason_en = f"The crop is in {stage_name_en}. High ambient heat ({temp:.1f}°C) accelerates moisture loss; evening light irrigation maintains root activity."
                reason_kn = f"ಬೆಳೆಯು {stage_name_kn} ಹಂತದಲ್ಲಿದೆ. ತಾಪಮಾನ ({temp:.1f}°C) ಅಧಿಕವಾಗಿರುವುದರಿಂದ ಮಣ್ಣಿನ ತೇವಾಂಶ ಕಾಪಾಡಲು ಸಂಜೆ ನೀರಾವರಿ ನೀಡಿ."

            # Rule 3: Favorable dry weather
            else:
                icon = "🌤️"
                weather_ctx_en = f"Favorable weather ({temp:.1f}°C). Ideal condition for field operations."
                weather_ctx_kn = f"ಅನುಕೂಲಕರ ಹವಾಮಾನ ({temp:.1f}°C). ಕೃಷಿ ಕೆಲಸಗಳಿಗೆ ಸೂಕ್ತ ಸಮಯ."
                reason_en = f"The crop is in {stage_name_en} (Day {current_day}). Weather ({temp:.1f}°C) is clear and favorable for field operations."
                reason_kn = f"ಬೆಳೆಯು {stage_name_kn} ಹಂತದಲ್ಲಿದೆ ({current_day}ನೇ ದಿನ). ಹವಾಮಾನವು ({temp:.1f}°C) ಕೃಷಿ ಕೆಲಸಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ."

        return TodayActionDetail(
            headline_en=f"Today's Farm Action for {crop_name_en} ({crop_name_kn})",
            headline_kn=f"{crop_name_kn} — ಇಂದಿನ ಕೃಷಿ ಸಲಹೆ ({current_day}ನೇ ದಿನ)",
            action_en=primary_task_en,
            action_kn=primary_task_kn,
            reason_en=reason_en,
            reason_kn=reason_kn,
            weather_context_en=weather_ctx_en,
            weather_context_kn=weather_ctx_kn,
            is_weather_alert=is_alert,
            icon=icon
        )

    def get_day_detail(
        self,
        crop_id: str,
        sowing_date_str: str,
        target_date_str: str
    ) -> Any:
        """Return planned lifecycle stage and task for any specified calendar day."""
        from app.schemas import CalendarDayDetail

        cid = self.normalize_crop_id(crop_id)
        crop_data = self._crops.get(cid, self._crops.get("ragi", {}))
        stages_raw = crop_data.get("stages", [])
        total_duration = crop_data.get("total_duration_days", 100)
        lifecycle_type = crop_data.get("lifecycle_type", "annual")

        try:
            sowing_date = datetime.strptime(sowing_date_str.strip(), "%Y-%m-%d").date()
        except Exception:
            sowing_date = date.today()

        try:
            target_date = datetime.strptime(target_date_str.strip(), "%Y-%m-%d").date()
        except Exception:
            target_date = date.today()

        today = date.today()
        is_today = (target_date == today)

        if target_date < today:
            status = "completed"
        elif target_date == today:
            status = "current"
        else:
            status = "upcoming"

        elapsed = (target_date - sowing_date).days
        crop_day = max(0, elapsed + 1) if elapsed >= 0 else 0

        if lifecycle_type == "perennial":
            m = target_date.month
            matched_stage = stages_raw[0]
            for s in stages_raw:
                if s.get("start_month", 1) <= m <= s.get("end_month", 12):
                    matched_stage = s
                    break
        else:
            matched_stage = stages_raw[0]
            effective_day = min(total_duration, max(1, crop_day))
            for s in stages_raw:
                if s.get("start_day", 1) <= effective_day <= s.get("end_day", total_duration):
                    matched_stage = s
                    break

        tasks_en = matched_stage.get("tasks_en", ["Regular field maintenance"])
        tasks_kn = matched_stage.get("tasks_kn", ["ನಿಯಮಿತ ಕೃಷಿ ನಿರ್ವಹಣೆ"])
        planned_en = tasks_en[0] if tasks_en else "Field inspection"
        planned_kn = tasks_kn[0] if tasks_kn else "ಬೆಳೆ ಪರಿಶೀಲನೆ"

        return CalendarDayDetail(
            date=target_date.isoformat(),
            crop_day=crop_day,
            stage_id=matched_stage["stage_id"],
            stage_name_en=matched_stage["name_en"],
            stage_name_kn=matched_stage["name_kn"],
            stage_icon=matched_stage.get("icon", "🌱"),
            planned_action_en=planned_en,
            planned_action_kn=planned_kn,
            status=status,
            is_today=is_today
        )


lifecycle_service = LifecycleService()

