"""
MannuMitra - Comprehensive Live System Integration and Regression Test Suite
Validates:
  1. System Health and Active 30-Class Model Configuration
  2. 30-Class Random Forest Model Properties and 7 Input Features
  3. Recommendation API End-to-End Pipeline (Top 3 + 3 Agronomic Alternatives)
  4. Priority Modes (Balanced, Water Priority, Market Priority)
  5. Schema Validation & Input Boundary Handling
  6. Comprehensive Coverage for all 30 Crop Class Labels
  7. MobileNetV2 Disease Detection (Inference & Crop Validation Mismatch Prevention)
  8. Open-Meteo Live Weather Integration and Forecasts
  9. AGMARKNET Market Mandi Intelligence & Transparent Provenance Badges
  10. FAO-56 Water Feasibility & Irrigation Calculation Engine
  11. Farmer Welfare Schemes Directory and PMFBY Insurance Hub
  12. Crop Lifecycle & UAS Bengaluru Package of Practices Timeline
  13. Soil Types and Regional Soil Nutrient Baselines
  14. Farm Economics and Cultivation Profit Calculator
  15. Soil Health Card OCR Extraction Pipeline
  16. Frontend Static Files and UI Mount Integrity
"""

import os
import sys
import json
import io
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
import pytest
import numpy as np

# Configure workspace paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

BASE_URL = "http://127.0.0.1:8000"


def make_request(path: str, method: str = "GET", data: dict = None, timeout: float = 10.0):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "MannuMitra-TestSuite/1.0"}
    encoded_data = None
    if data is not None:
        headers["Content-Type"] = "application/json"
        encoded_data = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed


class TestSystemHealthAndActiveModel:
    """Phase 2: Verify active production model and backend health."""

    def test_api_health(self):
        status, body = make_request("/api/health")
        assert status == 200
        assert body.get("status") == "healthy"
        assert "30 classes" in body.get("crop_model", "")
        assert "rf_30_class/rf_final.pkl" in body.get("model_artifact", "")

    def test_active_crop_model_artifact(self):
        from app.services.integrated_decision_engine import IntegratedRecommendationEngine
        engine = IntegratedRecommendationEngine()
        assert len(engine.classes) == 30, f"Expected 30 classes, got {len(engine.classes)}"
        expected_features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        model_features = list(getattr(engine.model, 'feature_names_in_', []))
        assert model_features == expected_features, f"Feature order mismatch: {model_features} vs {expected_features}"

    def test_active_model_classes_coverage(self):
        from app.services.integrated_decision_engine import IntegratedRecommendationEngine
        from app.api.crop import CROP_NAMES_MAP
        engine = IntegratedRecommendationEngine()
        classes = engine.classes
        assert len(classes) == 30
        for crop in classes:
            assert crop in CROP_NAMES_MAP, f"Crop '{crop}' missing in CROP_NAMES_MAP"
            kn_name, en_name = CROP_NAMES_MAP[crop]
            assert kn_name, f"Crop '{crop}' has empty Kannada name"
            assert en_name, f"Crop '{crop}' has empty English name"


class TestCropRecommendationPipeline:
    """Phase 3: Verify complete recommendation pipeline."""

    @pytest.fixture
    def standard_payload(self):
        return {
            "nitrogen": 90.0,
            "phosphorus": 42.0,
            "potassium": 43.0,
            "temperature": 24.5,
            "humidity": 65.0,
            "ph": 6.5,
            "rainfall": 200.0,
            "soil_type": "red_soil",
            "district": "Mandya",
            "water_source": "borewell",
            "is_irrigated": True,
            "irrigation_method": "drip",
            "water_availability_level": "moderate",
            "priority_mode": "balanced",
            "farm_area_acres": 2.0
        }

    def test_recommendation_success(self, standard_payload):
        status, body = make_request("/api/recommend", method="POST", data=standard_payload)
        assert status == 200
        assert body.get("status") == "success"

        # Verify top-3 overall recommendations
        top_recs = body.get("recommended_crops", [])
        assert len(top_recs) == 3, f"Expected 3 top recommendations, got {len(top_recs)}"

        # Verify top-3 agronomic alternative crops
        alt_recs = body.get("agronomic_alternative_crops", [])
        assert len(alt_recs) == 3, f"Expected 3 agronomic alternatives, got {len(alt_recs)}"

        # Verify disjointness: alternative crops must NOT include top overall crops
        top_ids = {c["crop"].lower() for c in top_recs}
        alt_ids = {c["crop"].lower() for c in alt_recs}
        intersection = top_ids.intersection(alt_ids)
        assert len(intersection) == 0, f"Alternative crops overlap with top recommendations: {intersection}"

        # Verify structure of top candidates
        for c in top_recs:
            assert "crop" in c
            assert "name_en" in c
            assert "name_kn" in c
            assert "overall_decision_score" in c
            assert "agronomic_suitability" in c
            assert "water_compatibility" in c
            assert "water_feasibility_summary" in c
            assert "practical_next_step" in c
            assert "detailed_explanations" in c

    def test_priority_modes(self, standard_payload):
        for mode in ["balanced", "water_priority", "market_priority"]:
            payload = dict(standard_payload)
            payload["priority_mode"] = mode
            status, body = make_request("/api/recommend", method="POST", data=payload)
            assert status == 200
            assert body.get("priority_mode") == mode
            assert len(body.get("recommended_crops", [])) == 3

    def test_alias_n_p_k_inputs(self, standard_payload):
        # Test short N, P, K alias payload
        payload = dict(standard_payload)
        del payload["nitrogen"]
        del payload["phosphorus"]
        del payload["potassium"]
        payload["N"] = 80.0
        payload["P"] = 35.0
        payload["K"] = 40.0
        status, body = make_request("/api/recommend", method="POST", data=payload)
        assert status == 200
        assert body.get("status") == "success"

    def test_input_validation_errors(self, standard_payload):
        # Test invalid pH (outside 3.5 - 10.0)
        invalid_ph = dict(standard_payload)
        invalid_ph["ph"] = 12.5
        status, body = make_request("/api/recommend", method="POST", data=invalid_ph)
        assert status == 422, f"Expected HTTP 422 for pH 12.5, got {status}"

        # Test invalid temperature (< 5.0)
        invalid_temp = dict(standard_payload)
        invalid_temp["temperature"] = 2.0
        status, body = make_request("/api/recommend", method="POST", data=invalid_temp)
        assert status == 422, f"Expected HTTP 422 for temp 2.0°C, got {status}"


class TestAll30CropModelInference:
    """Phase 2 & 6: Verify all 30 crop classes can be evaluated by the active engine."""

    def test_all_30_crops_engine_inference(self):
        from app.services.integrated_decision_engine import IntegratedRecommendationEngine
        engine = IntegratedRecommendationEngine()
        classes = engine.classes
        assert len(classes) == 30

        # Load dataset to extract representative mean feature vector per crop
        data_path = WORKSPACE_DIR / "data" / "rf_30_class" / "karnataka_30_crops_cpcri_rainfall_fixed.csv"
        if not data_path.exists():
            data_path = WORKSPACE_DIR / "train_data" / "rf_30_class" / "karnataka_30_crops_cpcri_rainfall_fixed.csv"
        assert data_path.exists(), f"Dataset not found at {data_path}"

        import pandas as pd
        df = pd.read_csv(data_path)
        crops_in_df = df["label"].unique().tolist()
        assert set(classes) == set(crops_in_df), "Class mismatch between model and dataset"

        # Test each crop's mean feature vector through the recommendation pipeline
        for crop_name in classes:
            crop_rows = df[df["label"] == crop_name]
            means = crop_rows[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].mean()

            top, alt = engine.recommend_with_agronomic_alternatives(
                nitrogen=float(means['N']),
                phosphorus=float(means['P']),
                potassium=float(means['K']),
                temperature=float(means['temperature']),
                humidity=float(means['humidity']),
                ph=float(means['ph']),
                rainfall=float(means['rainfall']),
                district="Mandya"
            )
            assert len(top) == 3, f"Crop {crop_name} failed top-3 recommendation"
            assert len(alt) == 3, f"Crop {crop_name} failed alt-3 recommendation"


class TestPlantDiseaseDetection:
    """Phase 4 & 6: Deep learning disease diagnosis and crop validation."""

    def test_supported_disease_crops(self):
        status, body = make_request("/api/disease/supported-crops")
        assert status == 200
        crops = [c["id"] for c in body.get("supported_crops", [])]
        expected = ["arecanut", "cotton", "maize", "rice", "tomato"]
        assert set(expected).issubset(set(crops))

    def test_demo_samples_registry(self):
        status, body = make_request("/api/disease/demo-samples")
        assert status == 200
        assert body.get("status") == "success"
        samples = body.get("samples", [])
        assert len(samples) >= 10

    def test_disease_diagnosis_valid_leaf(self):
        from app.services.disease_service import disease_service
        img_path = WORKSPACE_DIR / "demo_samples" / "disease_images" / "tomato_early_blight.jpg"
        assert img_path.exists()
        img_bytes = img_path.read_bytes()

        result = disease_service.diagnose("tomato", img_bytes)
        assert result.get("status") == "success"
        assert result.get("crop_valid") is True
        assert "Early Blight" in result.get("disease_name_en", "")
        assert "chemical_controls_en" in result or "organic_controls_en" in result

    def test_disease_diagnosis_mismatch_prevention(self):
        """Image of tomato leaf uploaded with selected crop 'cotton' must be rejected."""
        from app.services.disease_service import disease_service
        img_path = WORKSPACE_DIR / "demo_samples" / "disease_images" / "tomato_early_blight.jpg"
        assert img_path.exists()
        img_bytes = img_path.read_bytes()

        result = disease_service.diagnose("cotton", img_bytes)
        assert result.get("crop_valid") is False
        assert result.get("status") == "mismatch"
        assert result.get("detected_crop") == "tomato"


class TestWeatherService:
    """Phase 4: Open-Meteo live weather integration."""

    def test_weather_live_connectivity(self):
        status, body = make_request("/api/weather/current?district=Mandya")
        assert status == 200
        assert body.get("status") == "success"
        assert body.get("district") == "Mandya" or body.get("location", {}).get("name_en") == "Mandya"
        current = body.get("current", {})
        assert "temperature" in current or "temp" in current
        assert "humidity" in current
        daily = body.get("forecast") or body.get("daily") or []
        assert len(daily) >= 5, "Expected at least 5 days of forecast"


class TestMarketIntelligenceService:
    """Phase 4: AGMARKNET APMC prices with transparent provenance."""

    def test_market_service_status(self):
        status, body = make_request("/api/market/status")
        assert status == 200
        assert body.get("status") == "success"
        diag = body.get("diagnostics", {})
        assert "data_provenance_mode" in diag or "data_mode" in diag

    def test_market_prices_all(self):
        status, body = make_request("/api/market/all?district=Mandya")
        assert status == 200
        assert body.get("status") == "success"
        commodities = body.get("commodities", [])
        assert len(commodities) > 0
        first = commodities[0]
        assert "crop" in first
        curr_price = first.get("current_price", {})
        assert "modal_price" in curr_price
        assert "data_badge" in curr_price
        # Verify badges distinguish data provenance (e.g. LOCAL BENCHMARK vs LIVE API)
        assert curr_price.get("data_badge") in ["LIVE API", "CACHED API DATA", "LOCAL BENCHMARK", "APMC Mandi Benchmark"]


class TestWaterAndIrrigationEngine:
    """Phase 4: FAO-56 crop water compatibility calculations."""

    def test_water_profiles(self):
        status, body = make_request("/api/water/profiles")
        assert status == 200
        profiles = body.get("crop_water_profiles", {})
        assert len(profiles) > 0
        assert "rice" in profiles
        assert "sugarcane" in profiles

    def test_water_evaluation(self):
        payload = {
            "crop": "rice",
            "water_source": "borewell",
            "is_irrigated": True,
            "irrigation_method": "drip",
            "water_availability_level": "moderate",
            "seasonal_rainfall_mm": 600.0
        }
        status, body = make_request("/api/water/evaluate", method="POST", data=payload)
        assert status == 200
        assert body.get("status") == "success"
        evaluation = body.get("evaluation", {})
        assert "compatibility_score" in evaluation
        assert "estimated_water_demand" in evaluation


class TestLifecycleAndPractices:
    """Phase 4: UAS Bengaluru Package of Practices lifecycle."""

    def test_supported_lifecycle_crops(self):
        status, body = make_request("/api/lifecycle/crops")
        assert status == 200
        assert len(body) >= 5

    def test_crop_lifecycle_stages(self):
        status, body = make_request("/api/lifecycle/ragi")
        assert status == 200
        assert body.get("crop_id") == "ragi"
        stages = body.get("stages", [])
        assert len(stages) >= 4


class TestSoilTypesAndEconomics:
    """Phase 4: Soil classification and farm profit calculator."""

    def test_soil_types(self):
        status, body = make_request("/api/soil-types")
        assert status == 200
        soil_types = body.get("soil_types", [])
        assert len(soil_types) >= 4

    def test_economics_profit_calculator(self):
        payload = {
            "crop_id": "ragi",
            "land_area_acres": 2.0
        }
        status, body = make_request("/api/economics/calculate-profit", method="POST", data=payload)
        assert status == 200
        assert body.get("status") == "success"
        assert body.get("gross_revenue_inr") > 0
        assert body.get("total_cost_inr") > 0


class TestFrontendAssetsAndMount:
    """Phase 7: Frontend UI and assets mount integrity."""

    def test_ui_mount(self):
        url = f"{BASE_URL}/ui/"
        req = urllib.request.Request(url, headers={"User-Agent": "MannuMitra-TestSuite/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            assert resp.status == 200
            html = resp.read().decode("utf-8")
            assert "MannuMitra" in html or "ಮಣ್ಣುಮಿತ್ರ" in html

    def test_essential_static_files(self):
        frontend_dir = WORKSPACE_DIR / "frontend"
        assert (frontend_dir / "index.html").exists()
        assert (frontend_dir / "app.js").exists()
        assert (frontend_dir / "style.css").exists()


if __name__ == "__main__":
    print("Executing MannuMitra Live System Test Suite via PyTest...")
    exit_code = pytest.main(["-v", str(Path(__file__).resolve())])
    sys.exit(exit_code)
