"""
Weather Service for MannuMitra using Open-Meteo API.
Provides district coordinate resolution, real-time current weather, 7-day daily forecast,
farmer-friendly agricultural advice, and in-memory caching.
"""

import time
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional

# Verified Coordinates and Agro-Climatic Normal Seasonal Rainfall for Karnataka Districts
KARNATAKA_DISTRICTS_DATA: Dict[str, Dict[str, Any]] = {
    "mandya": {
        "id": "mandya",
        "name_en": "Mandya",
        "name_kn": "ಮಂಡ್ಯ",
        "latitude": 12.52,
        "longitude": 76.90,
        "seasonal_rainfall_normal": 760,
        "primary_soil": "alluvial_soil",
        "zone": "Southern Dry Zone"
    },
    "bengaluru": {
        "id": "bengaluru",
        "name_en": "Bengaluru",
        "name_kn": "ಬೆಂಗಳೂರು",
        "latitude": 12.97,
        "longitude": 77.59,
        "seasonal_rainfall_normal": 850,
        "primary_soil": "red_soil",
        "zone": "Eastern Dry Zone"
    },
    "mysuru": {
        "id": "mysuru",
        "name_en": "Mysuru",
        "name_kn": "ಮೈಸೂರು",
        "latitude": 12.30,
        "longitude": 76.64,
        "seasonal_rainfall_normal": 780,
        "primary_soil": "red_soil",
        "zone": "Southern Transition Zone"
    },
    "tumakuru": {
        "id": "tumakuru",
        "name_en": "Tumakuru",
        "name_kn": "ತುಮಕೂರು",
        "latitude": 13.34,
        "longitude": 77.10,
        "seasonal_rainfall_normal": 720,
        "primary_soil": "red_soil",
        "zone": "Central Dry Zone"
    },
    "kolar": {
        "id": "kolar",
        "name_en": "Kolar",
        "name_kn": "ಕೋಲಾರ",
        "latitude": 13.14,
        "longitude": 78.13,
        "seasonal_rainfall_normal": 640,
        "primary_soil": "sandy_soil",
        "zone": "Eastern Dry Zone"
    },
    "dharwad": {
        "id": "dharwad",
        "name_en": "Dharwad",
        "name_kn": "ಧಾರವಾಡ",
        "latitude": 15.46,
        "longitude": 75.01,
        "seasonal_rainfall_normal": 780,
        "primary_soil": "black_soil",
        "zone": "Northern Transition Zone"
    },
    "kalaburagi": {
        "id": "kalaburagi",
        "name_en": "Kalaburagi",
        "name_kn": "ಕಲಬುರಗಿ",
        "latitude": 17.33,
        "longitude": 76.83,
        "seasonal_rainfall_normal": 650,
        "primary_soil": "black_soil",
        "zone": "North Eastern Dry Zone"
    },
    "belagavi": {
        "id": "belagavi",
        "name_en": "Belagavi",
        "name_kn": "ಬೆಳಗಾವಿ",
        "latitude": 15.85,
        "longitude": 74.50,
        "seasonal_rainfall_normal": 920,
        "primary_soil": "black_soil",
        "zone": "Northern Transition Zone"
    },
    "udupi": {
        "id": "udupi",
        "name_en": "Udupi",
        "name_kn": "ಉಡುಪಿ",
        "latitude": 13.34,
        "longitude": 74.74,
        "seasonal_rainfall_normal": 1550,
        "primary_soil": "alluvial_soil",
        "zone": "Coastal Zone"
    },
    "mangaluru": {
        "id": "mangaluru",
        "name_en": "Mangaluru",
        "name_kn": "ಮಂಗಳೂರು",
        "latitude": 12.91,
        "longitude": 74.86,
        "seasonal_rainfall_normal": 1650,
        "primary_soil": "alluvial_soil",
        "zone": "Coastal Zone"
    },
    "shivamogga": {
        "id": "shivamogga",
        "name_en": "Shivamogga",
        "name_kn": "ಶಿವಮೊಗ್ಗ",
        "latitude": 13.93,
        "longitude": 75.57,
        "seasonal_rainfall_normal": 1100,
        "primary_soil": "red_soil",
        "zone": "Hilly Zone"
    },
    "hassan": {
        "id": "hassan",
        "name_en": "Hassan",
        "name_kn": "ಹಾಸನ",
        "latitude": 13.01,
        "longitude": 76.10,
        "seasonal_rainfall_normal": 850,
        "primary_soil": "red_soil",
        "zone": "Southern Transition Zone"
    },
    "ballari": {
        "id": "ballari",
        "name_en": "Ballari",
        "name_kn": "ಬಳ್ಳಾರಿ",
        "latitude": 15.14,
        "longitude": 76.92,
        "seasonal_rainfall_normal": 580,
        "primary_soil": "black_soil",
        "zone": "Northern Dry Zone"
    },
    "vijayapura": {
        "id": "vijayapura",
        "name_en": "Vijayapura",
        "name_kn": "ವಿಜಯಪುರ",
        "latitude": 16.83,
        "longitude": 75.71,
        "seasonal_rainfall_normal": 550,
        "primary_soil": "black_soil",
        "zone": "Northern Dry Zone"
    },
    "raichur": {
        "id": "raichur",
        "name_en": "Raichur",
        "name_kn": "ರಾಯಚೂರು",
        "latitude": 16.20,
        "longitude": 77.36,
        "seasonal_rainfall_normal": 570,
        "primary_soil": "black_soil",
        "zone": "Northern Dry Zone"
    }
}

# WMO Weather Condition Descriptions
WMO_WEATHER_MAP = {
    0: {"en": "Clear sky", "kn": "ಶುಭ್ರ ಆಕಾಶ", "icon": "☀️"},
    1: {"en": "Mainly clear", "kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ", "icon": "🌤️"},
    2: {"en": "Partly cloudy", "kn": "ಭಾಗಶಃ ಮೋಡ", "icon": "⛅"},
    3: {"en": "Overcast", "kn": "ಮೋಡ ಕವಿದ ವಾತಾವರಣ", "icon": "☁️"},
    45: {"en": "Foggy", "kn": "ಮಂಜು ಮುಸುಕಿದ ವಾತಾವರಣ", "icon": "🌫️"},
    48: {"en": "Depositing rime fog", "kn": "ದಟ್ಟ ಮಂಜು", "icon": "🌫️"},
    51: {"en": "Light drizzle", "kn": "ಹಗುರ ತುಂತುರು ಮಳೆ", "icon": "🌦️"},
    53: {"en": "Moderate drizzle", "kn": "ತುಂತುರು ಮಳೆ", "icon": "🌦️"},
    55: {"en": "Dense drizzle", "kn": "ದಟ್ಟ ತುಂತುರು ಮಳೆ", "icon": "🌧️"},
    61: {"en": "Slight rain", "kn": "ಸಾಧಾರಣ ಮಳೆ", "icon": "🌧️"},
    63: {"en": "Moderate rain", "kn": "ಉತ್ತಮ ಮಳೆ", "icon": "🌧️"},
    65: {"en": "Heavy rain", "kn": "ಭಾರಿ ಮಳೆ", "icon": "⛈️"},
    80: {"en": "Rain showers", "kn": "ಮಳೆಯ ಸಿಂಚನ", "icon": "🌦️"},
    81: {"en": "Moderate showers", "kn": "ಮಳೆ ಜಡಿ", "icon": "🌧️"},
    82: {"en": "Violent showers", "kn": "ಅತಿಯಾದ ಮಳೆ", "icon": "⛈️"},
    95: {"en": "Thunderstorm", "kn": "ಗುಡುಗು ಸಹಿತ ಮಳೆ", "icon": "⛈️"},
    96: {"en": "Thunderstorm with hail", "kn": "ಆಲಿಕಲ್ಲು ಸಹಿತ ಗುಡುಗು ಮಳೆ", "icon": "⛈️"}
}


class WeatherService:
    def __init__(self, cache_ttl_seconds: int = 900):
        # 15 minutes in-memory cache
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get_supported_districts(self) -> List[Dict[str, Any]]:
        """Return list of supported Karnataka districts."""
        return [
            {
                "id": d["id"],
                "name_en": d["name_en"],
                "name_kn": d["name_kn"],
                "latitude": d["latitude"],
                "longitude": d["longitude"],
                "seasonal_rainfall_normal": d["seasonal_rainfall_normal"],
                "primary_soil": d["primary_soil"],
                "zone": d["zone"]
            }
            for d in KARNATAKA_DISTRICTS_DATA.values()
        ]

    def resolve_district(self, query: str) -> Optional[Dict[str, Any]]:
        """Resolve district name to metadata and coordinates."""
        clean_q = query.strip().lower()
        if clean_q in KARNATAKA_DISTRICTS_DATA:
            return KARNATAKA_DISTRICTS_DATA[clean_q]
        
        # Check partial match
        for key, data in KARNATAKA_DISTRICTS_DATA.items():
            if clean_q in key or key in clean_q or clean_q == data["name_en"].lower():
                return data

        # Fallback to Open-Meteo Geocoding API if not in pre-verified list
        return self._geocode_district_remote(query)

    def _geocode_district_remote(self, query: str) -> Optional[Dict[str, Any]]:
        try:
            enc = urllib.parse.quote(f"{query}, Karnataka, India")
            url = f"https://geocoding-api.open-meteo.com/v1/search?name={enc}&count=1&language=en&format=json"
            req = urllib.request.Request(url, headers={"User-Agent": "MannuMitra/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                geo_data = json.loads(resp.read().decode())
                results = geo_data.get("results", [])
                if results:
                    first = results[0]
                    return {
                        "id": query.lower().replace(" ", "_"),
                        "name_en": first.get("name", query.title()),
                        "name_kn": query.title(),
                        "latitude": round(first["latitude"], 2),
                        "longitude": round(first["longitude"], 2),
                        "seasonal_rainfall_normal": 750,
                        "primary_soil": "red_soil",
                        "zone": "Karnataka Zone"
                    }
        except Exception:
            pass
        return None

    def find_nearest_district(self, lat: float, lon: float) -> Dict[str, Any]:
        """Find the nearest Karnataka district by Euclidean distance."""
        best_dist = float('inf')
        best_district = KARNATAKA_DISTRICTS_DATA["mandya"]
        for dist in KARNATAKA_DISTRICTS_DATA.values():
            dlat = dist["latitude"] - lat
            dlon = dist["longitude"] - lon
            dist_sq = dlat * dlat + dlon * dlon
            if dist_sq < best_dist:
                best_dist = dist_sq
                best_district = dist
        return best_district

    def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Reverse-geocode coordinates into a readable location and district name.
        Uses Karnataka nearest-district matching with external API fallback for fine-grained town name.
        Guarantees non-null, readable district and place names.
        """
        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            lat = 12.52
            lon = 76.90

        nearest = self.find_nearest_district(lat, lon)
        place_name = nearest["name_en"]
        place_kn = nearest["name_kn"]
        district_name = nearest["name_en"]
        district_kn = nearest["name_kn"]
        state_name = "Karnataka"
        country_name = "India"

        # Attempt high-speed reverse geocode if network permits
        try:
            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=10"
            req = urllib.request.Request(url, headers={"User-Agent": "MannuMitra-AgriApp/1.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                geo = json.loads(resp.read().decode())
                address = geo.get("address", {})
                resolved = (
                    address.get("city")
                    or address.get("town")
                    or address.get("village")
                    or address.get("suburb")
                    or address.get("county")
                )
                if resolved:
                    place_name = resolved
                if address.get("state"):
                    state_name = address.get("state")
        except Exception:
            pass

        return {
            "name": place_name,
            "district": district_name,
            "name_en": place_name,
            "name_kn": place_kn,
            "district_en": district_name,
            "district_kn": district_kn,
            "state": state_name,
            "country": country_name,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "nearest_district_id": nearest["id"],
            "zone": nearest["zone"],
            "seasonal_rainfall_normal": nearest["seasonal_rainfall_normal"],
            "primary_soil": nearest["primary_soil"]
        }

    def fetch_weather_by_coords(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch current weather and 7-day forecast from Open-Meteo using coordinates.
        Uses in-memory cache and reverse geocoding to identify district.
        """
        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid coordinates: lat={lat}, lon={lon}")

        cache_key = f"coords_{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()

        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["timestamp"] < self.cache_ttl:
                return entry["data"]

        loc_info = self.reverse_geocode(lat, lon)
        loc_info["id"] = loc_info.get("nearest_district_id", "local_coords")

        api_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&"
            f"forecast_days=7&"
            f"timezone=auto"
        )

        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "MannuMitra-AgriApp/1.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw_data = json.loads(resp.read().decode())
                normalized = self._normalize_open_meteo(loc_info, raw_data)
                self._cache[cache_key] = {
                    "timestamp": now,
                    "data": normalized
                }
                return normalized
        except Exception as e:
            if cache_key in self._cache:
                return self._cache[cache_key]["data"]
            return self._generate_fallback_weather(loc_info, str(e))

    def fetch_weather(self, district_query: str) -> Dict[str, Any]:
        """
        Fetch current weather and 7-day forecast from Open-Meteo.
        Uses in-memory cache with fallback on network failure.
        """
        district_info = self.resolve_district(district_query)
        if not district_info:
            raise ValueError(f"Unknown or unsupported Karnataka district: '{district_query}'")

        dist_id = district_info["id"]
        now = time.time()

        # Check Cache
        if dist_id in self._cache:
            entry = self._cache[dist_id]
            if now - entry["timestamp"] < self.cache_ttl:
                return entry["data"]

        lat = district_info["latitude"]
        lon = district_info["longitude"]

        api_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&"
            f"forecast_days=7&"
            f"timezone=auto"
        )

        try:
            req = urllib.request.Request(api_url, headers={"User-Agent": "MannuMitra-AgriApp/1.0"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                raw_data = json.loads(resp.read().decode())
                normalized = self._normalize_open_meteo(district_info, raw_data)
                
                # Cache response
                self._cache[dist_id] = {
                    "timestamp": now,
                    "data": normalized
                }
                return normalized
        except Exception as e:
            # If cache has any stale data, return it
            if dist_id in self._cache:
                return self._cache[dist_id]["data"]

            # Fallback generated response so user app does not crash
            return self._generate_fallback_weather(district_info, str(e))

    def _normalize_open_meteo(self, district_info: Dict[str, Any], raw: Dict[str, Any]) -> Dict[str, Any]:
        curr = raw.get("current", {})
        daily = raw.get("daily", {})

        wmo_code = int(curr.get("weather_code", 0))
        condition = WMO_WEATHER_MAP.get(wmo_code, {"en": "Partly cloudy", "kn": "ಭಾಗಶಃ ಮೋಡ", "icon": "⛅"})

        current_temp = float(curr.get("temperature_2m", 26.0))
        feels_like = float(curr.get("apparent_temperature", round(current_temp + 1.2, 1)))
        current_hum = float(curr.get("relative_humidity_2m", 65.0))
        current_precip = float(curr.get("precipitation", 0.0))
        current_wind = float(curr.get("wind_speed_10m", 10.0))

        name_en = district_info.get("name_en", "Mandya")
        name_kn = district_info.get("name_kn", "ಮಂಡ್ಯ")
        zone = district_info.get("zone", "Karnataka Zone")
        seasonal_normal = district_info.get("seasonal_rainfall_normal", 760)

        # Format 7-Day Daily Forecast
        forecast_list = []
        times = daily.get("time", [])
        temp_maxs = daily.get("temperature_2m_max", [])
        temp_mins = daily.get("temperature_2m_min", [])
        precips = daily.get("precipitation_sum", [])
        probs = daily.get("precipitation_probability_max", [])
        codes = daily.get("weather_code", [])
        wind_maxs = daily.get("wind_speed_10m_max", [])

        day_names_en = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"]
        day_names_kn = ["ಇಂದು", "ನಾಳೆ", "ದಿನ 3", "ದಿನ 4", "ದಿನ 5", "ದಿನ 6", "ದಿನ 7"]

        for i in range(min(len(times), 7)):
            d_code = int(codes[i]) if i < len(codes) and codes[i] is not None else 1
            d_cond = WMO_WEATHER_MAP.get(d_code, {"en": "Clear", "kn": "ಶುಭ್ರ", "icon": "🌤️"})
            p_sum = round(float(precips[i]), 1) if i < len(precips) and precips[i] is not None else 0.0
            p_prob = int(probs[i]) if i < len(probs) and probs[i] is not None else 0
            t_max = round(float(temp_maxs[i]), 1) if i < len(temp_maxs) and temp_maxs[i] is not None else round(current_temp + 2, 1)
            t_min = round(float(temp_mins[i]), 1) if i < len(temp_mins) and temp_mins[i] is not None else round(current_temp - 4, 1)
            w_max = round(float(wind_maxs[i]), 1) if i < len(wind_maxs) and wind_maxs[i] is not None else 10.0

            forecast_list.append({
                "date": times[i],
                "day_index": i,
                "day_name_en": day_names_en[i] if i < len(day_names_en) else f"Day {i+1}",
                "day_name_kn": day_names_kn[i] if i < len(day_names_kn) else f"ದಿನ {i+1}",
                "temperature_max": t_max,
                "temp_max": t_max,
                "temperature_min": t_min,
                "temp_min": t_min,
                "rainfall": p_sum,
                "rainfall_mm": p_sum,
                "precipitation_sum": p_sum,
                "rain_probability": p_prob,
                "precipitation_probability": p_prob,
                "weather_code": d_code,
                "wind_speed_max": w_max,
                "description": d_cond["en"],
                "description_kn": d_cond["kn"],
                "condition_en": d_cond["en"],
                "condition_kn": d_cond["kn"],
                "condition_text_en": d_cond["en"],
                "condition_text_kn": d_cond["kn"],
                "icon": d_cond["icon"]
            })

        # Structured parallel daily arrays
        daily_arrays = {
            "time": times[:7],
            "temperature_2m_max": [round(float(x), 1) if x is not None else round(current_temp + 2, 1) for x in temp_maxs[:7]],
            "temperature_2m_min": [round(float(x), 1) if x is not None else round(current_temp - 4, 1) for x in temp_mins[:7]],
            "precipitation_sum": [round(float(x), 1) if x is not None else 0.0 for x in precips[:7]],
            "precipitation_probability_max": [int(x) if x is not None else 0 for x in probs[:7]],
            "weather_code": [int(x) if x is not None else 1 for x in codes[:7]],
            "wind_speed_10m_max": [round(float(x), 1) if x is not None else 10.0 for x in wind_maxs[:7]],
            "days": forecast_list
        }

        # Generate Agricultural Weather Advice
        advice = self._generate_agricultural_advice(
            temp=current_temp,
            hum=current_hum,
            wind=current_wind,
            precip_today=current_precip,
            forecast=forecast_list
        )

        location_obj = {
            "name": name_en,
            "district": name_en,
            "name_en": name_en,
            "name_kn": name_kn,
            "district_en": name_en,
            "district_kn": name_kn,
            "state": district_info.get("state", "Karnataka"),
            "country": district_info.get("country", "India"),
            "latitude": round(float(district_info["latitude"]), 4),
            "longitude": round(float(district_info["longitude"]), 4),
            "zone": zone
        }

        return {
            "status": "success",
            "source": "Open-Meteo Weather Forecast API",
            "attribution": "Weather data: Open-Meteo (Free Non-Commercial Licence)",
            "location": location_obj,
            "district": {
                "id": district_info.get("id", "district"),
                "name_en": name_en,
                "name_kn": name_kn,
                "zone": zone
            },
            "name_en": name_en,
            "name_kn": name_kn,
            "district_name": name_en,
            "district_kn": name_kn,
            "district_id": district_info.get("id", "district"),
            "zone": zone,
            "latitude": district_info["latitude"],
            "longitude": district_info["longitude"],
            "timezone": raw.get("timezone", "Asia/Kolkata"),
            "seasonal_rainfall_normal": seasonal_normal,
            "seasonal_rainfall_normal_mm": seasonal_normal,
            "primary_soil": district_info.get("primary_soil", "red_soil"),
            "current": {
                "temperature": round(current_temp, 1),
                "temp": round(current_temp, 1),
                "feels_like": round(feels_like, 1),
                "humidity": round(current_hum, 1),
                "rainfall": round(current_precip, 1),
                "rainfall_today": round(current_precip, 1),
                "rainfall_today_mm": round(current_precip, 1),
                "wind_speed": round(current_wind, 1),
                "wind_speed_kmh": round(current_wind, 1),
                "weather_code": wmo_code,
                "description": condition["en"],
                "description_kn": condition["kn"],
                "condition_en": condition["en"],
                "condition_kn": condition["kn"],
                "condition_text_en": condition["en"],
                "condition_text_kn": condition["kn"],
                "icon": condition["icon"]
            },
            "daily": forecast_list,
            "daily_forecast": forecast_list,
            "forecast": forecast_list,
            "daily_chart_data": daily_arrays,
            "advice": advice,
            "agricultural_advice": advice,
            "farming_advice": advice.get("tips", []),
            "distinction_note": (
                "Today's rainfall is current weather; seasonal normal rainfall is used for crop recommendation consistency."
            )
        }

    def _generate_agricultural_advice(
        self,
        temp: float,
        hum: float,
        wind: float,
        precip_today: float,
        forecast: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate practical, rule-based agricultural advice based on real forecast metrics.
        Never generates arbitrary predictions; uses strict meteorological thresholds.
        """
        tomorrow_rain = forecast[1].get("rainfall_mm", 0.0) if len(forecast) > 1 else 0.0
        tomorrow_prob = forecast[1].get("rain_probability", 0) if len(forecast) > 1 else 0
        total_3day_rain = sum(f.get("rainfall_mm", 0.0) for f in forecast[:3])
        max_upcoming_prob = max((f.get("rain_probability", 0) for f in forecast[:3]), default=0)
        max_upcoming_temp = max((f.get("temp_max", temp) for f in forecast[:3]), default=temp)

        tips = []

        # Rule 1: Heavy Rain Warning
        if precip_today >= 15.0 or total_3day_rain >= 25.0 or (tomorrow_rain >= 12.0 and tomorrow_prob >= 60):
            headline_en = "Heavy rain may occur. Avoid fertilizer and pesticide application before rain."
            headline_kn = "ಭಾರಿ ಮಳೆಯ ಸಾಧ್ಯತೆ ಇದೆ. ಮಳೆಯ ಮೊದಲು ರಾಸಾಯನಿಕ ಗೊಬ್ಬರ ಮತ್ತು ಕೀಟನಾಶಕ ಹಾಕಬೇಡಿ."
            alert_type = "heavy_rain"
            alert_icon = "⛈️"
            tips.append({
                "icon": "⚠️",
                "en": "Heavy rain may wash away applied fertilizers. Postpone top-dressing.",
                "kn": "ಭಾರಿ ಮಳೆಯಿಂದ ಗೊಬ್ಬರ ಕೊಚ್ಚಿಹೋಗುವ ಸಂಭವವಿದೆ. ಮೇಲುಗೊಬ್ಬರ ನೀಡುವುದನ್ನು ಮುಂದೂಡಿ."
            })
            tips.append({
                "icon": "🌊",
                "en": "Ensure proper drainage in low-lying fields to prevent waterlogging.",
                "kn": "ತಗ್ಗು ಪ್ರದೇಶದ ಜಮೀನಿನಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ಬಸಿದುಹೋಗಲು ಚರಂಡಿ ವ್ಯವಸ್ಥೆ ಮಾಡಿ."
            })

        # Rule 2: Rain expected tomorrow / soon
        elif tomorrow_prob >= 45 or tomorrow_rain >= 3.0 or max_upcoming_prob >= 50:
            headline_en = "Rain is expected soon. Avoid spraying pesticides before rain."
            headline_kn = "ನಾಳೆ ಮಳೆಯ ಸಾಧ್ಯತೆ ಇದೆ. ಮಳೆಯ ಮೊದಲು ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸಬೇಡಿ."
            alert_type = "rain_expected"
            alert_icon = "🌧️"
            tips.append({
                "icon": "🚫",
                "en": "Avoid foliar spraying; rain within 6-8 hours will wash off chemicals.",
                "kn": "ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ; ಮಳೆ ಬಂದರೆ ಔಷಧಿ ವ್ಯರ್ಥವಾಗುತ್ತದೆ."
            })
            tips.append({
                "icon": "💧",
                "en": "Skip scheduled irrigation today to conserve water and power.",
                "kn": "ಮಳೆ ಬರುವುದರಿಂದ ಇಂದಿನ ನೀರಾವರಿ ಸ್ಥಗಿತಗೊಳಿಸಿ ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಉಳಿಸಿ."
            })

        # Rule 3: Dry spell / low rain
        elif total_3day_rain < 1.0 and max_upcoming_prob <= 20:
            headline_en = "Dry weather expected. Check soil moisture and plan irrigation if needed."
            headline_kn = "ಮುಂದಿನ ಕೆಲವು ದಿನ ಮಳೆ ಕಡಿಮೆ. ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ನೀರಾವರಿ ಪರಿಶೀಲಿಸಿ."
            alert_type = "dry_weather"
            alert_icon = "☀️"
            tips.append({
                "icon": "🌾",
                "en": "Favorable weather for intercultural operations, weeding, and land preparation.",
                "kn": "ಜಮೀನಿನಲ್ಲಿ ಕಳೆ ಕೀಳುವುದು ಮತ್ತು ಸಾಗುವಳಿ ಕಾರ್ಯಗಳಿಗೆ ಇದು ಸೂಕ್ತ ಸಮಯ."
            })
            tips.append({
                "icon": "💧",
                "en": "Schedule light irrigation during early morning or evening hours.",
                "kn": "ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ತಂಪಾದ ಸಮಯದಲ್ಲಿ ಲಘು ನೀರಾವರಿ ಒದಗಿಸಿ."
            })

        # Rule 4: Moderate rain / Normal
        else:
            headline_en = "Moderate weather conditions. Plan field work after any light rain."
            headline_kn = "ಸಾಧಾರಣ ವಾತಾವರಣವಿದೆ. ಲಘು ಮಳೆಯ ನಂತರ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಯೋಜಿಸಿ."
            alert_type = "moderate"
            alert_icon = "🌱"
            tips.append({
                "icon": "🌱",
                "en": "Normal farming operations can proceed with regular crop inspection.",
                "kn": "ಸಾಮಾನ್ಯ ಕೃಷಿ ಚಟುವಟಿಕೆಗಳನ್ನು ಮುಂದುವರಿಸಬಹುದು."
            })

        # Secondary Advice based on Wind
        if wind >= 15.0:
            tips.append({
                "icon": "💨",
                "en": "Strong wind expected (15+ km/h). Avoid spraying to prevent drift.",
                "kn": "ಬಲವಾದ ಗಾಳಿ ಬೀಸುವ ಸಾಧ್ಯತೆ ಇದೆ (15+ km/h). ಸಿಂಪಡಣೆ ಮಾಡಬೇಡಿ."
            })

        # Secondary Advice based on Humidity
        if hum >= 75.0:
            tips.append({
                "icon": "🍄",
                "en": "High humidity conditions. Regularly inspect crops for fungal disease signs.",
                "kn": "ಹೆಚ್ಚಿನ ತೇವಾಂಶವಿದೆ. ಬೆಳೆಗಳಲ್ಲಿ ಶಿಲೀಂಧ್ರ ರೋಗದ ಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
            })

        return {
            "headline_en": headline_en,
            "headline_kn": headline_kn,
            "advice_en": headline_en,
            "advice_kn": headline_kn,
            "en": headline_en,
            "kn": headline_kn,
            "icon": alert_icon,
            "type": alert_type,
            "tips": tips
        }

    def _generate_fallback_weather(self, district_info: Dict[str, Any], err_msg: str) -> Dict[str, Any]:
        """Safe fallback response if Open-Meteo API is unreachable."""
        name_en = district_info.get("name_en", "Mandya")
        name_kn = district_info.get("name_kn", "ಮಂಡ್ಯ")
        zone = district_info.get("zone", "Karnataka Zone")
        seasonal_normal = district_info.get("seasonal_rainfall_normal", 760)

        fallback_forecast = [
            {
                "date": "Today",
                "day_index": 0,
                "day_name_en": "Today",
                "day_name_kn": "ಇಂದು",
                "temp_max": 29.0,
                "temperature_max": 29.0,
                "temp_min": 22.0,
                "temperature_min": 22.0,
                "rainfall_mm": 0.0,
                "rainfall": 0.0,
                "precipitation_sum": 0.0,
                "rain_probability": 20,
                "precipitation_probability": 20,
                "description": "Partly cloudy",
                "description_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_en": "Partly cloudy",
                "condition_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_text_en": "Partly cloudy",
                "condition_text_kn": "ಭಾಗಶಃ ಮೋಡ",
                "icon": "⛅"
            },
            {
                "date": "Tomorrow",
                "day_index": 1,
                "day_name_en": "Tomorrow",
                "day_name_kn": "ನಾಳೆ",
                "temp_max": 30.0,
                "temperature_max": 30.0,
                "temp_min": 23.0,
                "temperature_min": 23.0,
                "rainfall_mm": 2.0,
                "rainfall": 2.0,
                "precipitation_sum": 2.0,
                "rain_probability": 35,
                "precipitation_probability": 35,
                "description": "Mainly clear",
                "description_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "condition_en": "Mainly clear",
                "condition_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "condition_text_en": "Mainly clear",
                "condition_text_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "icon": "🌤️"
            },
            {
                "date": "Day 3",
                "day_index": 2,
                "day_name_en": "Day 3",
                "day_name_kn": "ದಿನ 3",
                "temp_max": 29.5,
                "temperature_max": 29.5,
                "temp_min": 22.5,
                "temperature_min": 22.5,
                "rainfall_mm": 0.0,
                "rainfall": 0.0,
                "precipitation_sum": 0.0,
                "rain_probability": 15,
                "precipitation_probability": 15,
                "description": "Clear sky",
                "description_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "condition_en": "Clear sky",
                "condition_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "condition_text_en": "Clear sky",
                "condition_text_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "icon": "☀️"
            },
            {
                "date": "Day 4",
                "day_index": 3,
                "day_name_en": "Day 4",
                "day_name_kn": "ದಿನ 4",
                "temp_max": 28.5,
                "temperature_max": 28.5,
                "temp_min": 21.5,
                "temperature_min": 21.5,
                "rainfall_mm": 5.0,
                "rainfall": 5.0,
                "precipitation_sum": 5.0,
                "rain_probability": 45,
                "precipitation_probability": 45,
                "description": "Rain showers",
                "description_kn": "ಮಳೆಯ ಸಿಂಚನ",
                "condition_en": "Rain showers",
                "condition_kn": "ಮಳೆಯ ಸಿಂಚನ",
                "condition_text_en": "Rain showers",
                "condition_text_kn": "ಮಳೆಯ ಸಿಂಚನ",
                "icon": "🌦️"
            },
            {
                "date": "Day 5",
                "day_index": 4,
                "day_name_en": "Day 5",
                "day_name_kn": "ದಿನ 5",
                "temp_max": 28.0,
                "temperature_max": 28.0,
                "temp_min": 21.0,
                "temperature_min": 21.0,
                "rainfall_mm": 0.0,
                "rainfall": 0.0,
                "precipitation_sum": 0.0,
                "rain_probability": 20,
                "precipitation_probability": 20,
                "description": "Partly cloudy",
                "description_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_en": "Partly cloudy",
                "condition_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_text_en": "Partly cloudy",
                "condition_text_kn": "ಭಾಗಶಃ ಮೋಡ",
                "icon": "⛅"
            },
            {
                "date": "Day 6",
                "day_index": 5,
                "day_name_en": "Day 6",
                "day_name_kn": "ದಿನ 6",
                "temp_max": 29.0,
                "temperature_max": 29.0,
                "temp_min": 22.0,
                "temperature_min": 22.0,
                "rainfall_mm": 0.0,
                "rainfall": 0.0,
                "precipitation_sum": 0.0,
                "rain_probability": 15,
                "precipitation_probability": 15,
                "description": "Mainly clear",
                "description_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "condition_en": "Mainly clear",
                "condition_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "condition_text_en": "Mainly clear",
                "condition_text_kn": "ಹೆಚ್ಚಾಗಿ ಶುಭ್ರ",
                "icon": "🌤️"
            },
            {
                "date": "Day 7",
                "day_index": 6,
                "day_name_en": "Day 7",
                "day_name_kn": "ದಿನ 7",
                "temp_max": 30.0,
                "temperature_max": 30.0,
                "temp_min": 23.0,
                "temperature_min": 23.0,
                "rainfall_mm": 0.0,
                "rainfall": 0.0,
                "precipitation_sum": 0.0,
                "rain_probability": 10,
                "precipitation_probability": 10,
                "description": "Clear sky",
                "description_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "condition_en": "Clear sky",
                "condition_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "condition_text_en": "Clear sky",
                "condition_text_kn": "ಶುಭ್ರ ಆಕಾಶ",
                "icon": "☀️"
            }
        ]

        fallback_advice = {
            "headline_en": "Normal regional conditions. Plan regular field work.",
            "headline_kn": "ಸಾಮಾನ್ಯ ಪ್ರಾದೇಶಿಕ ಹವಾಮಾನ. ದೈನಂದಿನ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಯೋಜಿಸಿ.",
            "advice_en": "Normal regional conditions. Plan regular field work.",
            "advice_kn": "ಸಾಮಾನ್ಯ ಪ್ರಾದೇಶಿಕ ಹವಾಮಾನ. ದೈನಂದಿನ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಯೋಜಿಸಿ.",
            "en": "Normal regional conditions. Plan regular field work.",
            "kn": "ಸಾಮಾನ್ಯ ಪ್ರಾದೇಶಿಕ ಹವಾಮಾನ. ದೈನಂದಿನ ಕೃಷಿ ಕೆಲಸಗಳನ್ನು ಯೋಜಿಸಿ.",
            "icon": "🌱",
            "type": "normal",
            "tips": [
                {
                    "icon": "🌱",
                    "en": "Check soil moisture before planning irrigation.",
                    "kn": "ನೀರಾವರಿ ಒದಗಿಸುವ ಮೊದಲು ಮಣ್ಣಿನ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ."
                }
            ]
        }

        fallback_daily_arrays = {
            "time": [f["date"] for f in fallback_forecast],
            "temperature_2m_max": [f["temp_max"] for f in fallback_forecast],
            "temperature_2m_min": [f["temp_min"] for f in fallback_forecast],
            "precipitation_sum": [f["precipitation_sum"] for f in fallback_forecast],
            "precipitation_probability_max": [f["precipitation_probability"] for f in fallback_forecast],
            "weather_code": [2, 1, 0, 61, 2, 1, 0],
            "wind_speed_10m_max": [12.0] * 7,
            "days": fallback_forecast
        }

        location_obj = {
            "name": name_en,
            "district": name_en,
            "name_en": name_en,
            "name_kn": name_kn,
            "district_en": name_en,
            "district_kn": name_kn,
            "state": district_info.get("state", "Karnataka"),
            "country": district_info.get("country", "India"),
            "latitude": round(float(district_info.get("latitude", 12.52)), 4),
            "longitude": round(float(district_info.get("longitude", 76.90)), 4),
            "zone": zone
        }

        return {
            "status": "partial_offline",
            "source": "MannuMitra Regional Climatological Baseline",
            "attribution": "Offline fallback data",
            "location": location_obj,
            "district": {
                "id": district_info.get("id", "district"),
                "name_en": name_en,
                "name_kn": name_kn,
                "zone": zone
            },
            "name_en": name_en,
            "name_kn": name_kn,
            "district_name": name_en,
            "district_kn": name_kn,
            "district_id": district_info.get("id", "district"),
            "zone": zone,
            "latitude": district_info.get("latitude", 12.52),
            "longitude": district_info.get("longitude", 76.90),
            "timezone": "Asia/Kolkata",
            "seasonal_rainfall_normal": seasonal_normal,
            "seasonal_rainfall_normal_mm": seasonal_normal,
            "primary_soil": district_info.get("primary_soil", "red_soil"),
            "current": {
                "temperature": 27.5,
                "temp": 27.5,
                "feels_like": 28.5,
                "humidity": 65.0,
                "rainfall": 0.0,
                "rainfall_today": 0.0,
                "rainfall_today_mm": 0.0,
                "wind_speed": 12.0,
                "wind_speed_kmh": 12.0,
                "weather_code": 2,
                "description": "Partly cloudy",
                "description_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_en": "Partly cloudy",
                "condition_kn": "ಭಾಗಶಃ ಮೋಡ",
                "condition_text_en": "Partly cloudy",
                "condition_text_kn": "ಭಾಗಶಃ ಮೋಡ",
                "icon": "⛅"
            },
            "daily": fallback_forecast,
            "daily_forecast": fallback_forecast,
            "forecast": fallback_forecast,
            "daily_chart_data": fallback_daily_arrays,
            "advice": fallback_advice,
            "agricultural_advice": fallback_advice,
            "farming_advice": fallback_advice["tips"],
            "error_note": err_msg
        }


weather_service = WeatherService()

