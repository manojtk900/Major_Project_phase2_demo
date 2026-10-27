"""
MannuMitra - Crop Recommendation API Router (Phase 7 & 8)
Supports unified farm profile, verified soil values, 5-component decision ranking,
and full backward compatibility with legacy UI contracts.
"""
from fastapi import APIRouter
from app.schemas.farm_profile import UnifiedRecommendationRequest
from app.services.integrated_decision_engine import IntegratedRecommendationEngine

router = APIRouter(prefix="/api", tags=["Crop Recommendation"])
rec_engine = IntegratedRecommendationEngine()

CROP_NAMES_MAP = {
    "ragi": ("ರಾಗಿ", "Ragi (Finger Millet)"),
    "rice": ("ಭತ್ತ", "Paddy (Rice)"),
    "maize": ("ಮೆಕ್ಕೆಜೋಳ", "Maize (Corn)"),
    "cotton": ("ಹತ್ತಿ", "Cotton"),
    "sugarcane": ("ಕಬ್ಬು", "Sugarcane"),
    "tomato": ("ಟೊಮೆಟೊ", "Tomato"),
    "groundnut": ("ಕಡಲೆಕಾಯಿ", "Groundnut"),
    "chickpea": ("ಕಡಲೆ", "Bengal Gram (Chickpea)"),
    "arecanut": ("ಅಡಿಕೆ", "Arecanut"),
    "coffee": ("ಕಾಫಿ", "Coffee"),
    "turmeric": ("ಅರಿಶಿನ", "Turmeric"),
    "banana": ("ಬಾಳೆ", "Banana"),
    "pigeonpeas": ("ತೊಗರಿ", "Red Gram (Pigeonpea)"),
    "jowar": ("ಜೋಳ", "Jowar (Sorghum)"),
    "bajra": ("ಸಜ್ಜೆ", "Bajra (Pearl Millet)"),
    "blackgram": ("ಉದ್ದು", "Black Gram"),
    "mungbean": ("ಹೆಸರುಕಾಳು", "Green Gram (Moong)"),
    "sunflower": ("ಸೂರ್ಯಕಾಂತಿ", "Sunflower"),
    "onion": ("ಈರುಳ್ಳಿ", "Onion"),
    "chilli": ("ಮೆಣಸಿನಕಾಯಿ", "Green Chilli"),
    "papaya": ("ಪರಂಗಿ", "Papaya"),
    "coconut": ("ತೆಂಗು", "Coconut"),
    "watermelon": ("ಕಲ್ಲಂಗಡಿ", "Watermelon"),
    "pepper": ("ಕರಿಮೆಣಸು", "Black Pepper"),
    "muskmelon": ("ಖರ್ಬೂಜ", "Muskmelon"),
    "mango": ("ಮಾವಿನಹಣ್ಣು", "Mango"),
    "grapes": ("ದ್ರಾಕ್ಷಿ", "Grapes"),
    "pomegranate": ("ದಾಳಿಂಬೆ", "Pomegranate"),
    "ginger": ("ಶುಂಠಿ", "Ginger"),
    "cardamom": ("ಏಲಕ್ಕಿ", "Cardamom"),
    "cashew": ("ಗೋಡಂಬಿ", "Cashew"),
    "guava": ("ಸೀಬೆಹಣ್ಣು", "Guava"),
    "kidneybeans": ("ರಾಜ್ಮಾ", "Kidney Beans"),
    "mothbeans": ("ಮಡಿಕೆ ಕಾಳು", "Moth Beans"),
    "mulberry": ("ಹಿಪ್ಪುನೇರಳೆ", "Mulberry"),
    "sapota": ("ಚಿಕ್ಕು", "Sapota"),
    "sesame": ("ಎಳ್ಳು", "Sesame"),
    "tobacco": ("ತಂಬಾಕು", "Tobacco"),
    "horsegram": ("ಹುರುಳಿ", "Horse Gram"),
    "soybean": ("ಸೋಯಾಬೀನ್", "Soybean")
}

@router.post("/recommend")
def recommend_crops(payload: UnifiedRecommendationRequest):
    candidates, agronomic_alternatives = rec_engine.recommend_with_agronomic_alternatives(
        nitrogen=payload.nitrogen,
        phosphorus=payload.phosphorus,
        potassium=payload.potassium,
        temperature=payload.temperature,
        humidity=payload.humidity,
        ph=payload.ph,
        rainfall=payload.rainfall,
        water_source=payload.water_source,
        is_irrigated=payload.is_irrigated,
        irrigation_method=payload.irrigation_method,
        water_availability_level=payload.water_availability_level,
        water_quality=payload.water_quality,
        measured_ec_ds_m=payload.measured_ec_ds_m,
        sowing_date=payload.sowing_date,
        district=payload.district or "Mandya",
        farm_area_acres=payload.farm_area_acres or 1.0,
        selected_mandi=payload.selected_mandi,
        selected_variety=payload.selected_variety,
        priority_mode=payload.priority_mode,
        custom_weights=payload.custom_weights,
        soil_verified_by_farmer=payload.soil_verified_by_farmer
    )

    # Attach bilingual names to top overall candidates
    for c in candidates:
        kn_name, en_name = CROP_NAMES_MAP.get(c["crop"].lower(), (c["crop"].title(), c["crop"].title()))
        c["name_kn"] = kn_name
        c["name_en"] = en_name

    # Attach bilingual names to agronomic alternatives
    for alt in agronomic_alternatives:
        kn_name, en_name = CROP_NAMES_MAP.get(alt["crop"].lower(), (alt["crop"].title(), alt["crop"].title()))
        alt["name_kn"] = kn_name
        alt["name_en"] = en_name

    primary_crop = None
    alternative_crops = []
    if candidates:
        top = candidates[0]
        kn_name = top["name_kn"]
        en_name = top["name_en"]
        
        primary_crop = {
            "id": top["crop"],
            "name_kn": kn_name,
            "name_en": en_name,
            "match_percentage": round(top["overall_decision_score"]),
            "confidence_score": round(top["overall_decision_score"] / 100.0, 2),
            "source": f"Random Forest (30-Crop) + FAO-56 + AGMARKNET ({payload.priority_mode.replace('_', ' ').title()})",
            "source_type": "ml_model",
            "suitability_tier": "Highly Suitable" if top["overall_decision_score"] >= 70 else "Moderately Suitable",
            "suitability_tier_kn": "ಅತ್ಯಂತ ಸೂಕ್ತ" if top["overall_decision_score"] >= 70 else "ಮಧ್ಯಮ ಸೂಕ್ತ",
            "explanations": top.get("explanations", []),
            "today_advice": {
                "headline_kn": f"{kn_name} ಇಂದಿನ ಕೃಷಿ ಸಲಹೆ",
                "headline_en": f"Today's Advice for {en_name}",
                "action_icon": "🌦️",
                "action_kn": f"ಮಣ್ಣಿನಲ್ಲಿ ತೇವಾಂಶ ಕಾಪಾಡಿಕೊಳ್ಳಿ. {top.get('water_advisory', '')}",
                "action_en": f"Maintain scheduled irrigation. {top.get('water_advisory', '')}"
            },
            "details": top
        }

        for alt in candidates[1:]:
            akn = alt.get("name_kn", alt["crop"].title())
            aen = alt.get("name_en", alt["crop"].title())
            alternative_crops.append({
                "id": alt["crop"],
                "name_kn": akn,
                "name_en": aen,
                "match_percentage": round(alt["overall_decision_score"]),
                "confidence_score": round(alt["overall_decision_score"] / 100.0, 2),
                "suitability_tier": "Highly Suitable" if alt["overall_decision_score"] >= 70 else "Moderately Suitable",
                "suitability_tier_kn": "ಅತ್ಯಂತ ಸೂಕ್ತ" if alt["overall_decision_score"] >= 70 else "ಮಧ್ಯಮ ಸೂಕ್ತ",
                "explanations": alt.get("explanations", []),
                "details": alt
            })

    unsuitable_crops = [
        {
            "id": "sugarcane" if (primary_crop and primary_crop["id"] != "sugarcane") else "rice",
            "name_kn": "ಕಬ್ಬು / ಭತ್ತ",
            "name_en": "Sugarcane / Paddy",
            "reason_kn": "ಅತಿಯಾದ ನೀರಿನ ಬೇಡಿಕೆ (1500-2500 mm). ನೀರಿನ ಲಭ್ಯತೆ ಕಡಿಮೆಯಿರುವಾಗ ಹೆಚ್ಚಿನ ಅಪಾಯ.",
            "reason_en": "High water demand (1500-2500 mm). High moisture stress risk under non-abundant supply."
        }
    ]

    return {
        "status": "success",
        "priority_mode": payload.priority_mode,
        "recommended_crops": candidates,
        "agronomic_alternative_crops": agronomic_alternatives,
        "primary_crop": primary_crop,
        "alternative_crops": alternative_crops,
        "unsuitable_crops": unsuitable_crops,
        "ranked_crops": candidates,
        "input_profile": payload.model_dump()
    }
