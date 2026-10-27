"""
MannuMitra - Farm Economics and Profit Calculator API
"""
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.core.config import DATA_DIR, BASE_DIR

router = APIRouter(prefix="/api/economics", tags=["Farm Economics"])
_LOCAL_ECON = DATA_DIR / "references" / "crop_economics_defaults.json"
_FALLBACK_ECON = BASE_DIR / "data" / "references" / "crop_economics_defaults.json"
ECON_FILE = _LOCAL_ECON if _LOCAL_ECON.exists() else _FALLBACK_ECON

def _load_data():
    if ECON_FILE.exists():
        return json.loads(ECON_FILE.read_text(encoding="utf-8")).get("crops", {})
    return {}

class ProfitCalcRequest(BaseModel):
    crop_id: str
    land_area_acres: float = Field(default=1.0, gt=0)
    expected_yield_per_acre: Optional[float] = None
    expected_market_price: Optional[float] = None
    itemized_costs: Optional[Dict[str, float]] = None

@router.get("/crops")
def get_supported_crops():
    crops = _load_data()
    return [{"crop_id": k, "name_en": v.get("name_en", k), "name_kn": v.get("name_kn", k)} for k, v in crops.items()]

@router.get("/defaults/{crop_id}")
def get_crop_defaults(crop_id: str):
    crops = _load_data()
    cid = crop_id.lower().strip()
    if cid not in crops:
        raise HTTPException(status_code=404, detail=f"Economic defaults not found for crop '{crop_id}'")
    return crops[cid]

@router.post("/calculate-profit")
def calculate_profit(req: ProfitCalcRequest):
    crops = _load_data()
    cid = req.crop_id.lower().strip()
    cdata = crops.get(cid, {})
    
    yield_val = req.expected_yield_per_acre or cdata.get("expected_yield_quintal_per_acre", 20.0)
    price_val = req.expected_market_price or cdata.get("baseline_market_price_per_quintal", 2500.0)
    
    total_yield = yield_val * req.land_area_acres
    gross_revenue = total_yield * price_val
    
    base_cost_per_acre = cdata.get("cost_of_cultivation_per_acre", 25000.0)
    total_cost = base_cost_per_acre * req.land_area_acres
    
    if req.itemized_costs:
        total_cost = sum(req.itemized_costs.values())
        
    net_profit = gross_revenue - total_cost
    roi_pct = (net_profit / total_cost * 100.0) if total_cost > 0 else 0.0
    
    return {
        "status": "success",
        "crop_id": cid,
        "land_area_acres": req.land_area_acres,
        "total_yield_quintals": round(total_yield, 2),
        "gross_revenue_inr": round(gross_revenue, 2),
        "total_cost_inr": round(total_cost, 2),
        "net_profit_inr": round(net_profit, 2),
        "roi_percent": round(roi_pct, 2)
    }
