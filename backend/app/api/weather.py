"""
MannuMitra - Real-Time Live Weather & Agricultural Advisory API Router
Powered by Open-Meteo & Karnataka KSNDMC Station Coordinates.
Provides real live weather data, 7-day daily forecast, agricultural advice,
and backward-compatible contracts for existing tests.
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
from app.services.weather_service import weather_service, KARNATAKA_DISTRICTS_DATA

router = APIRouter(prefix="/api/weather", tags=["Weather Advisory"])

@router.get("/districts")
def get_districts():
    """Returns list of supported Karnataka districts with coordinates and agro-climatic normals."""
    districts = weather_service.get_supported_districts()
    return {
        "status": "success",
        "districts": districts,
        "total": len(districts)
    }

@router.get("/current")
@router.get("")
@router.get("/forecast")
def get_weather(
    district: Optional[str] = Query(default="Mandya", description="Karnataka district name"),
    lat: Optional[float] = Query(None, description="GPS latitude"),
    lon: Optional[float] = Query(None, description="GPS longitude"),
    latitude: Optional[float] = Query(None, description="GPS latitude"),
    longitude: Optional[float] = Query(None, description="GPS longitude")
):
    """
    Fetch real live weather from Open-Meteo API for selected Karnataka district or GPS coords.
    Includes current conditions, 7-day forecast, and agricultural guidance.
    """
    use_lat = latitude if latitude is not None else lat
    use_lon = longitude if longitude is not None else lon

    try:
        if use_lat is not None and use_lon is not None:
            data = weather_service.fetch_weather_by_coords(use_lat, use_lon)
            dist_name = data.get("district", "Karnataka")
        else:
            dist_name = district or "Mandya"
            data = weather_service.fetch_weather(dist_name)

        curr = data.get("current", {})
        temp = float(curr.get("temperature", 27.0))
        hum = float(curr.get("relative_humidity", 65.0))
        precip = float(curr.get("precipitation", 0.0))
        cond_en = curr.get("weather_desc_en") or curr.get("condition") or "Partly Cloudy"
        cond_kn = curr.get("weather_desc_kn") or curr.get("condition_kn") or "ಭಾಗಶಃ ಮೋಡ"

        adv = data.get("advisory", {})
        adv_title_en = adv.get("title_en") or f"Favorable conditions for field operations in {dist_name}."
        adv_desc_en = adv.get("desc_en") or "Normal irrigation and field scouting recommended."
        adv_title_kn = adv.get("title_kn") or f"{dist_name} ಜಿಲ್ಲೆಯಲ್ಲಿ ಕೃಷಿ ಚಟುವಟಿಕೆಗಳಿಗೆ ಅನುಕೂಲಕರ ಹವಾಮಾನವಿದೆ."
        adv_desc_kn = adv.get("desc_kn") or "ಸಾಮಾನ್ಯ ನೀರಾವರಿ ಮತ್ತು ಕೀಟ ನಿಗಾ ವಹಿಸಿ."

        # Structured response containing BOTH full live Open-Meteo model
        # AND backward-compatible fields required by test_mannumitra_core
        return {
            "status": "success",
            "district": dist_name,
            "current_weather": {
                "temp": temp,
                "humidity": hum,
                "rainfall": precip,
                "condition": cond_en,
                "condition_kn": cond_kn
            },
            "current": curr,
            "daily": data.get("daily", []),
            "forecast": data.get("daily", []),
            "location": data.get("location", {}),
            "zone": data.get("zone", "Karnataka Agro Zone"),
            "temperature": temp,
            "humidity": hum,
            "rainfall": precip,
            "condition": cond_en,
            "condition_kn": cond_kn,
            "advisory": adv_title_en,
            "advisory_kn": adv_title_kn,
            "agricultural_advice": {
                "headline_en": adv_title_en,
                "headline_kn": adv_title_kn,
                "instruction_en": adv_desc_en,
                "instruction_kn": adv_desc_kn,
                "icon": curr.get("icon", "⛅"),
                "tips": [
                    {"en": "Good time for field preparation. Monitor soil moisture.", "kn": "ಇದು ಹೊಲ ಸಿದ್ಧತೆಗೆ ಅನುಕೂಲಕರ ಸಮಯ. ಮಣ್ಣಿನ ತೇವಾಂಶ ಗಮನಿಸಿ."}
                ]
            },
            "seasonal_rainfall_normal_mm": data.get("seasonal_rainfall_normal", 760),
            "source": "Live Open-Meteo API & Karnataka Agro-Climatic Advisory"
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving weather for district '{district}': {str(e)}"
        )
