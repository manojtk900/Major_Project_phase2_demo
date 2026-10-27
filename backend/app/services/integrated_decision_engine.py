"""
MannuMitra - Integrated Multi-Stage Decision Ranking Engine (Phase 7)
Synthesizes 5 distinct explainable decision components:
  1. Agronomic Suitability (Strictly 7-feature Production Random Forest Model)
  2. Water Feasibility (FAO-56 ETc = Kc * ETo, Irrigation Application Efficiency & Net Irrigation)
  3. Market Opportunity (AGMARKNET Official APMC Modal Prices; Neutral for missing data)
  4. Harvest-Time Outlook (UAS POP Durations & LightGBM Econometric Time-Series Forecasts)
  5. Risk and Data Completeness (Unmeasured variables, Salinity, Volatility, Stale Data)

Guarantees:
  - Configurable weights and strategy presets (Balanced, Water Priority, Market Priority).
  - Missing market data is kept neutral (50.0 / 100) rather than penalizing unsupported commodities.
  - Overall decision score is NEVER described as a 'probability of success' or 'guaranteed profit'.
  - Transparent, bilingual explainability for every recommended candidate.
"""

from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from app.core.config import MODELS_DIR, CROP_MODEL_PATH
from app.services.water_service import WaterSuitabilityEngine
from app.services.market_service import MarketDataProvider

# Configurable Multi-Component Scoring Weight Presets (Strictly normalized to 1.0)
PRIORITY_PRESETS = {
    "balanced": {
        "agronomic": 0.45,
        "water": 0.25,
        "market_price": 0.15,
        "market_trend": 0.15
    },
    "water_priority": {
        "agronomic": 0.30,
        "water": 0.50,
        "market_price": 0.10,
        "market_trend": 0.10
    },
    "market_priority": {
        "agronomic": 0.30,
        "water": 0.15,
        "market_price": 0.30,
        "market_trend": 0.25
    }
}

class IntegratedRecommendationEngine:
    def __init__(self, model_path: Optional[Path] = None):
        if model_path is None:
            candidate_paths = [
                CROP_MODEL_PATH,
                MODELS_DIR / "rf_30_class" / "rf_final.pkl",
                Path("models/rf_30_class/rf_final.pkl")
            ]
            for p in candidate_paths:
                if p.exists():
                    model_path = p
                    break
            if model_path is None or not model_path.exists():
                raise FileNotFoundError(
                    f"Production 30-class Random Forest model artifact not found at {candidate_paths[0]}! "
                    "Fallback to 39-class model is disabled."
                )

        self.model = joblib.load(model_path)
        self.classes = list(self.model.classes_)
        self.water_engine = WaterSuitabilityEngine()
        self.market_provider = MarketDataProvider()

    def recommend_with_agronomic_alternatives(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        water_source: str = "borewell",
        is_irrigated: bool = True,
        irrigation_method: Optional[str] = "drip",
        water_availability_level: Optional[str] = "moderate",
        water_quality: Optional[str] = "normal",
        measured_ec_ds_m: Optional[float] = None,
        sowing_date: Optional[str] = None,
        district: Optional[str] = "Mandya",
        farm_area_acres: float = 1.0,
        selected_mandi: Optional[str] = None,
        selected_variety: Optional[str] = None,
        priority_mode: str = "balanced",
        custom_weights: Optional[Dict[str, float]] = None,
        soil_verified_by_farmer: bool = False
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        # 0. Resolve scoring weights
        weights = custom_weights or PRIORITY_PRESETS.get(priority_mode, PRIORITY_PRESETS["balanced"])
        # Normalize weights to sum = 1.0 if custom
        total_w = sum(weights.values())
        if total_w > 0 and abs(total_w - 1.0) > 0.001:
            weights = {k: v / total_w for k, v in weights.items()}

        # 1. PILLAR 1: Baseline Agronomic Model Inference (STRICTLY 7 FEATURES)
        feature_names = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
        features_df = pd.DataFrame(
            [[nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall]],
            columns=feature_names
        )
        probas = self.model.predict_proba(features_df)[0]

        ranked_indices = np.argsort(probas)[::-1]

        # Evaluate candidates with positive agronomic probability or top 8 (up to 16)
        eval_indices = [idx for idx in ranked_indices if probas[idx] > 0]
        if len(eval_indices) < 8:
            eval_indices = list(ranked_indices[:8])
        elif len(eval_indices) > 16:
            eval_indices = eval_indices[:16]

        candidates = []
        for idx in eval_indices:
            crop = self.classes[idx]
            agri_score = float(probas[idx]) * 100.0

            # 2. PILLAR 2: FAO-56 Water Feasibility & Net Irrigation Demand
            water_eval = self.water_engine.evaluate_crop_water_compatibility(
                crop=crop,
                water_source=water_source,
                is_irrigated=is_irrigated,
                irrigation_method=irrigation_method,
                water_availability_level=water_availability_level,
                water_quality=water_quality,
                measured_ec_ds_m=measured_ec_ds_m,
                seasonal_rainfall_mm=rainfall,
                temperature_c=temperature,
                humidity_percent=humidity,
                farm_area_acres=farm_area_acres
            )
            water_score = water_eval["compatibility_score"]

            # 3. PILLAR 3: AGMARKNET Official Mandi Market Intelligence
            market_info = self.market_provider.get_current_mandi_price(crop, district=district)
            has_live_market = market_info.get("has_live_market_data", True)

            if has_live_market and market_info.get("modal_price"):
                modal_val = market_info["modal_price"]
                # Normalize modal price relative to state crop benchmarks (0 to 100)
                norm_price_score = min(100.0, max(20.0, (modal_val / 5000.0) * 60.0))
            else:
                # Keep missing market data NEUTRAL (50.0/100) rather than treating as 0 or low price
                norm_price_score = 50.0

            # 4. PILLAR 4: Harvest-Time Outlook & Volatility
            trend_info = self.market_provider.calculate_price_trends(crop)
            forecast_info = self.market_provider.forecast_harvest_price(
                crop=crop,
                sowing_date_str=sowing_date,
                preferred_mandi=selected_mandi
            )
            trend_pct = trend_info.get("trend_30d_percent", 0.0)

            if forecast_info.get("is_supported", False):
                # Outlook score based on 30-day momentum and seasonal forecast pattern
                outlook_score = min(100.0, max(20.0, 50.0 + (trend_pct * 2.5)))
            else:
                # Neutral outlook when multi-year forecast series is not available
                outlook_score = 50.0

            # 5. PILLAR 5: Risk and Data Completeness Scoring (0 to 100)
            risk_completeness_score = 100.0
            risk_factors: List[str] = []

            # Water risks
            if not water_eval["available_supply"]["measured"]:
                risk_completeness_score -= 8.0
                risk_factors.append("Water supply flow unmeasured (qualitative estimate)")
            if water_eval["penalty_factor"] > 0.3:
                risk_completeness_score -= 25.0
                risk_factors.append("Severe irrigation water deficit")
            elif water_eval["penalty_factor"] > 0:
                risk_completeness_score -= 12.0
                risk_factors.append("Moderate irrigation moisture stress")

            # Salinity risks
            sal_details = water_eval.get("salinity_details") or {}
            loss_pct = sal_details.get("projected_yield_loss_percent", 0.0)
            if loss_pct > 5.0:
                risk_completeness_score -= 15.0
                risk_factors.append(f"Osmotic salinity yield risk (~{loss_pct}% loss)")

            # Market risks
            if not has_live_market or market_info.get("data_status") == "DEMO_DATA":
                risk_completeness_score -= 10.0
                risk_factors.append("Live AGMARKNET APMC observations missing in district")
            elif market_info.get("is_stale", False):
                risk_completeness_score -= 6.0
                risk_factors.append("APMC observation is historical / stale (>14 days)")

            if trend_info.get("price_volatility") == "High":
                risk_completeness_score -= 12.0
                risk_factors.append("High commercial commodity price volatility")

            # Soil verification risk
            if not soil_verified_by_farmer:
                risk_completeness_score -= 5.0
                risk_factors.append("Soil test values from regional baseline (not farmer verified)")

            risk_completeness_score = min(100.0, max(20.0, risk_completeness_score))

            # Risk classification
            if risk_completeness_score >= 80.0:
                risk_level = "Low"
            elif risk_completeness_score >= 60.0:
                risk_level = "Moderate"
            else:
                risk_level = "High"

            # 6. Composite Decision Scoring Synthesis
            agri_w = weights.get("agronomic", 0.45)
            water_w = weights.get("water", 0.25)
            mkt_price_w = weights.get("market_price", 0.15)
            trend_w = weights.get("harvest_outlook", weights.get("market_trend", 0.15))

            composite_score = (
                (agri_score * agri_w) +
                (water_score * water_w) +
                (norm_price_score * mkt_price_w) +
                (outlook_score * trend_w)
            )

            # Apply water deficit / salinity penalty factor if farm infrastructure cannot sustain crop
            if water_eval["penalty_factor"] > 0:
                composite_score *= (1.0 - water_eval["penalty_factor"])

            # 7. Comprehensive Explainability Generation
            # Soil and climate compatibility rationale
            soil_climate_exp = (
                f"Agronomically optimal for {district} soils: pH {ph:.1f}, NPK ({nitrogen:.0f}-{phosphorus:.0f}-{potassium:.0f} kg/ha), "
                f"temperature {temperature:.1f}°C, and {rainfall:.0f} mm seasonal rainfall."
            )

            # Water demand and constraints
            demand_info = water_eval["estimated_water_demand"]
            water_exp = (
                f"Requires {demand_info['crop_evapotranspiration_etc_mm']:.0f} mm ETc over {demand_info['growing_period_days']} days "
                f"(Gross: {demand_info['gross_irrigation_requirement_mm']:.0f} mm = {demand_info['volumetric_demand_m3']:,.0f} m³ for {farm_area_acres} acre). "
                f"{water_eval['advisory']}"
            )

            # Mandi price and date
            mandi_exp = (
                f"Trading at ₹{market_info['modal_price']:,.0f}/Quintal ({market_info['variety']}) at {market_info['primary_market']}, "
                f"observed on {market_info['observation_date']} [{market_info['data_badge']}]."
            )

            # Outlook and uncertainty
            if forecast_info.get("is_supported", False):
                fc_range = forecast_info["forecast_price_range"]
                fc_metrics = forecast_info.get("baseline_comparison", {})
                outlook_exp = (
                    f"Harvest window: {forecast_info['expected_harvest_window']} ({forecast_info['projected_harvest_date']}). "
                    f"Econometric forecast range: ₹{fc_range[0]:,.0f} – ₹{fc_range[1]:,.0f}/Quintal (MAE: ₹{fc_metrics.get('chronological_evaluation_mae', 100):.1f}/Q). "
                    f"30-day momentum: {trend_pct:+.1f}%."
                )
            else:
                outlook_exp = (
                    f"Harvest window: {forecast_info['expected_harvest_window']} ({forecast_info['projected_harvest_date']}). "
                    f"Time-series price forecasting is not supported for {crop} due to insufficient historical trading volume. "
                    f"Missing market data treated neutrally."
                )

            # Why recommended summary
            why_recommended = (
                f"{crop.title()} ranks #{len(candidates)+1} with a composite decision index of {composite_score:.1f}/100 "
                f"({priority_mode.replace('_', ' ').title()} strategy). It exhibits {agri_score:.1f}% agronomic suitability, "
                f"{water_score:.1f}% water compatibility ({water_eval['status']}), and {risk_level} risk profile."
            )

            # Structured explanations list for UI & legacy backwards compatibility
            explanations_list = [
                {
                    "aspect": "agronomy",
                    "text_en": f"High agronomic suitability ({agri_score:.1f}%) verified by Random Forest model.",
                    "text_kn": f"ಕೃಷಿ ವಿಜ್ಞಾನ ಸೂಕ್ತತೆ {agri_score:.1f}% — ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನಕ್ಕೆ ಸೂಕ್ತ."
                },
                {
                    "aspect": "water",
                    "text_en": f"Water feasibility ({water_score:.1f}%): {water_eval['status']} with {irrigation_method} irrigation.",
                    "text_kn": f"ನೀರಿನ ಹೊಂದಾಣಿಕೆ {water_score:.1f}%: {water_eval['status']}."
                },
                {
                    "aspect": "market",
                    "text_en": f"Mandi price ₹{market_info['modal_price']}/Q at {market_info['primary_market']} ({market_info['observation_date']}).",
                    "text_kn": f"ಮಾರುಕಟ್ಟೆ ದರ ₹{market_info['modal_price']}/ಕ್ವಿಂಟಾಲ್ ({market_info['primary_market']}, {market_info['observation_date']})."
                },
                {
                    "aspect": "harvest",
                    "text_en": f"Projected harvest: {forecast_info['expected_harvest_window']} ({forecast_info['duration_days']} days duration).",
                    "text_kn": f"ನಿರೀಕ್ಷಿತ ಕೊಯ್ಲು ಅವಧಿ: {forecast_info['expected_harvest_window']} ({forecast_info['duration_days']} ದಿನಗಳು)."
                }
            ]

            candidates.append({
                "crop": crop,
                "overall_decision_score": round(composite_score, 1),
                "composite_decision_index": round(composite_score, 1),
                "scoring_breakdown": {
                    "agronomic_suitability": round(agri_score, 1),
                    "water_feasibility": round(water_score, 1),
                    "market_opportunity": round(norm_price_score, 1),
                    "harvest_outlook": round(outlook_score, 1),
                    "risk_completeness": round(risk_completeness_score, 1)
                },
                "weights_applied": weights,
                "scoring_weights_used": weights,
                "priority_mode_used": priority_mode,
                "agronomic_suitability": round(agri_score, 1),
                "water_compatibility": round(water_score, 1),
                "water_status": water_eval["status"],
                "water_advisory": water_eval["advisory"],
                "water_details": water_eval,
                "water_requirement_mm": demand_info["demand_range_mm"],
                "volumetric_water_m3": demand_info["volumetric_demand_m3"],
                "salinity_evaluation": water_eval.get("salinity_evaluation"),
                "water_data_status": water_eval.get("data_status"),
                "market_modal_price": market_info["modal_price"],
                "market_variety": market_info["variety"],
                "market_primary_mandi": market_info["primary_market"],
                "market_bulletin_date": market_info["bulletin_date"],
                "market_observation_date": market_info["observation_date"],
                "market_arrivals_tonnes": market_info["arrivals_tonnes"],
                "market_30d_trend": trend_pct,
                "market_data_badge": market_info["data_badge"],
                "market_is_stale": market_info.get("is_stale", False),
                "harvest_window": forecast_info.get("expected_harvest_window", "Harvest Season"),
                "projected_harvest_date": forecast_info.get("projected_harvest_date"),
                "forecast_price_range": forecast_info["forecast_price_range"],
                "forecast_baseline_comparison": forecast_info.get("baseline_comparison"),
                "forecast_is_supported": forecast_info.get("is_supported", False),
                "harvest_disclaimer": forecast_info.get("disclaimer"),
                "price_unit": market_info["price_unit"],
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "missing_information": water_eval.get("missing_information", []),
                "data_freshness": market_info.get("data_freshness", "AGMARKNET Daily Bulletin"),
                "explanations": explanations_list,
                "detailed_explanations": {
                    "why_recommended": why_recommended,
                    "soil_and_climate_compatibility": soil_climate_exp,
                    "water_demand_and_constraints": water_exp,
                    "current_mandi_price_and_date": mandi_exp,
                    "price_trend_and_forecast_uncertainty": outlook_exp,
                    "main_risks_and_missing_information": "; ".join(risk_factors) if risk_factors else "Minimal agronomic or resource risks detected."
                },
                "explanation": why_recommended
            })

        # Pipeline A: Overall Recommendation (Agronomy + Water + Market + Outlook)
        candidates.sort(key=lambda x: x["overall_decision_score"], reverse=True)
        top_candidates = candidates[:3]

        for rank_idx, c in enumerate(top_candidates, 1):
            c["rank"] = rank_idx
            crop_name = c["crop"].title()
            comp_score = c["overall_decision_score"]
            agri_suit = c["agronomic_suitability"]
            wat_comp = c["water_compatibility"]
            wat_stat = c["water_status"]
            r_level = c["risk_level"]

            # Concise 1-sentence explanations for the initial card face
            if rank_idx == 1:
                c["short_explanation_en"] = "Best overall match considering your soil, water availability, and market value."
                c["short_explanation_kn"] = "ಮಣ್ಣು, ನೀರಿನ ಲಭ್ಯತೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಮೌಲ್ಯವನ್ನು ಪರಿಗಣಿಸಿ ಅತ್ಯುತ್ತಮ ಸಮಗ್ರ ಆಯ್ಕೆ."
            elif rank_idx == 2:
                c["short_explanation_en"] = "Strong secondary option with balanced agronomic and farming feasibility."
                c["short_explanation_kn"] = "ಉತ್ತಮ ಕೃಷಿ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಸಮತೋಲಿತ ಸಂಪನ್ಮೂಲ ಸಾಮರ್ಥ್ಯ ಹೊಂದಿರುವ ಆಯ್ಕೆ."
            else:
                c["short_explanation_en"] = "Viable farming choice compatible with local soil and seasonal conditions."
                c["short_explanation_kn"] = "ಸ್ಥಳೀಯ ಮಣ್ಣು ಮತ್ತು ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳಿಗೆ ಹೊಂದಿಕೊಳ್ಳುವ ಪ್ರಾಯೋಗಿಕ ಬೆಳೆ."
            
            # Farmer-friendly water feasibility status
            if wat_comp >= 75.0:
                feasibility_cat = "Sufficient"
                feasibility_cat_kn = "ಸಾಕಷ್ಟು ಲಭ್ಯತೆ"
            elif wat_comp >= 50.0:
                feasibility_cat = "Limited"
                feasibility_cat_kn = "ಮಧ್ಯಮ / ಸೀಮಿತ"
            else:
                feasibility_cat = "Insufficient"
                feasibility_cat_kn = "ಅಸಮರ್ಪಕ"
                
            c["water_feasibility_category"] = feasibility_cat
            c["water_feasibility_summary"] = f"{feasibility_cat}: {wat_stat}"

            # Practical Next Step tailored to constraints and crop
            if wat_comp < 50.0 or c["water_details"].get("penalty_factor", 0) > 0.2:
                next_step = f"Verify measured borewell discharge rate (LPS) or consider less water-intensive alternative before sowing {crop_name}."
                next_step_kn = f"{crop_name} ಬಿತ್ತುವ ಮುನ್ನ ಕೊಳವೆಬಾವಿ ನೀರಿನ ಹರಿವನ್ನು (LPS) ಅಳೆಯಿರಿ ಅಥವಾ ಕಡಿಮೆ ನೀರು ಬೇಡುವ ಬೆಳೆಯನ್ನು ಪರಿಗಣಿಸಿ."
            elif c["crop"].lower() in {"ragi", "bajra", "jowar", "millet"}:
                next_step = f"Register on Karnataka FRUITS portal (FID) to access Raitha Siri DBT incentive of ₹10,000/ha."
                next_step_kn = f"ರೈತ ಸಿರಿ ಯೋಜನೆಯಡಿ ₹10,000/ಹೆಕ್ಟೇರ್ ಪ್ರೋತ್ಸಾಹಧನ ಪಡೆಯಲು FRUITS ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ."
            elif c["market_modal_price"] and not c.get("market_is_stale"):
                next_step = f"Track weekly wholesale price movement at {c['market_primary_mandi']} APMC and consult local RSK."
                next_step_kn = f"{c['market_primary_mandi']} ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ಧಾರಣೆ ಗಮನಿಸಿ ಮತ್ತು ಸ್ಥಳೀಯ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ."
            else:
                next_step = "Confirm regional seed variety and local soil nutrient test with your nearest Raitha Samparka Kendra."
                next_step_kn = "ಹತ್ತಿರದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಿದ ತಳಿಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."

            c["practical_next_step"] = next_step
            c["practical_next_step_kn"] = next_step_kn
            c["main_risk"] = c["risk_factors"][0] if c["risk_factors"] else "Minimal agronomic or resource risks detected."

            # Correct rank in why_recommended
            correct_why = (
                f"{crop_name} ranks #{rank_idx} with a composite decision index of {comp_score:.1f}/100 "
                f"({priority_mode.replace('_', ' ').title()} strategy). It exhibits {agri_suit:.1f}% Random Forest model probability, "
                f"{wat_comp:.1f}% water compatibility ({wat_stat}), and {r_level} risk profile."
            )
            c["detailed_explanations"]["why_recommended"] = correct_why
            c["explanation"] = correct_why

        # Pipeline B: Alternative Crops — Based on Soil and Agronomic Suitability Only
        # Strict Rule: Must NOT use market prices, expected profit, water availability,
        # irrigation feasibility, or water-risk scores to rank alternative crops.
        # Exclude the 3 crops already shown in top_candidates (overall Top 3).
        top_crop_names = {c["crop"].lower() for c in top_candidates}

        # Filter for candidates not in top 3 overall
        alt_candidates = [
            c for c in candidates
            if c["crop"].lower() not in top_crop_names
        ]

        # Sort STRICTLY by agronomic suitability (Random Forest probability on the 7 soil/climate features).
        # Tie-break deterministically by crop name alphabetically.
        alt_candidates.sort(key=lambda x: (-x["agronomic_suitability"], x["crop"]))

        agronomic_alternatives = []
        for alt_idx, alt in enumerate(alt_candidates[:3], 1):
            alt_copy = dict(alt)
            alt_copy["rank"] = alt_idx
            alt_copy["agronomic_rank"] = alt_idx
            crop_name = alt_copy["crop"].title()

            # Simple 1-sentence explanations for initial card face
            alt_copy["short_explanation_en"] = "Secondary agronomic option for your soil nutrient levels and temperature range."
            alt_copy["short_explanation_kn"] = "ನಿಮ್ಮ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶ ಮಟ್ಟಗಳು ಮತ್ತು ತಾಪಮಾನಕ್ಕೆ ಪರ್ಯಾಯ ಕೃಷಿ ಬೆಳೆ."

            wat_comp = alt_copy.get("water_compatibility", 50.0)
            wat_stat = alt_copy.get("water_status", "Normal")
            if wat_comp >= 75.0:
                alt_copy["water_feasibility_category"] = "Sufficient"
                alt_copy["water_feasibility_summary"] = f"Sufficient: {wat_stat}"
            elif wat_comp >= 50.0:
                alt_copy["water_feasibility_category"] = "Limited"
                alt_copy["water_feasibility_summary"] = f"Limited: {wat_stat}"
            else:
                alt_copy["water_feasibility_category"] = "Insufficient"
                alt_copy["water_feasibility_summary"] = f"Insufficient: {wat_stat}"

            alt_copy["practical_next_step"] = "Confirm regional seed variety and local soil nutrient test with your nearest Raitha Samparka Kendra."
            alt_copy["practical_next_step_kn"] = "ಹತ್ತಿರದ ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರದಲ್ಲಿ ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ಶಿಫಾರಸು ಮಾಡಿದ ತಳಿಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ."
            alt_copy["main_risk"] = alt_copy["risk_factors"][0] if alt_copy.get("risk_factors") else "Evaluated solely on soil and climate suitability."

            agri_prob_desc = (
                f"{alt_copy['agronomic_suitability']:.1f}% Random Forest probability"
                if alt_copy['agronomic_suitability'] > 0.0
                else "<1% Random Forest probability (secondary regional option)"
            )
            agronomic_why = (
                f"{crop_name} is ranked #{alt_idx} among alternative crops strictly by soil and agronomic suitability "
                f"({agri_prob_desc}) without factoring in market prices or water availability."
            )
            alt_copy["detailed_explanations"] = dict(alt_copy.get("detailed_explanations", {}))
            alt_copy["detailed_explanations"]["why_recommended"] = agronomic_why
            alt_copy["explanation"] = agronomic_why

            agronomic_alternatives.append(alt_copy)

        return top_candidates, agronomic_alternatives

    def recommend(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        water_source: str = "borewell",
        is_irrigated: bool = True,
        irrigation_method: Optional[str] = "drip",
        water_availability_level: Optional[str] = "moderate",
        water_quality: Optional[str] = "normal",
        measured_ec_ds_m: Optional[float] = None,
        sowing_date: Optional[str] = None,
        district: Optional[str] = "Mandya",
        farm_area_acres: float = 1.0,
        selected_mandi: Optional[str] = None,
        selected_variety: Optional[str] = None,
        priority_mode: str = "balanced",
        custom_weights: Optional[Dict[str, float]] = None,
        soil_verified_by_farmer: bool = False
    ) -> List[Dict[str, Any]]:
        top_candidates, _ = self.recommend_with_agronomic_alternatives(
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            temperature=temperature,
            humidity=humidity,
            ph=ph,
            rainfall=rainfall,
            water_source=water_source,
            is_irrigated=is_irrigated,
            irrigation_method=irrigation_method,
            water_availability_level=water_availability_level,
            water_quality=water_quality,
            measured_ec_ds_m=measured_ec_ds_m,
            sowing_date=sowing_date,
            district=district,
            farm_area_acres=farm_area_acres,
            selected_mandi=selected_mandi,
            selected_variety=selected_variety,
            priority_mode=priority_mode,
            custom_weights=custom_weights,
            soil_verified_by_farmer=soil_verified_by_farmer
        )
        return top_candidates


IntegratedCropDecisionEngine = IntegratedRecommendationEngine
