"""
MannuMitra - Mandi Market Intelligence and Harvest Price Forecasting API Router (Phase 3)
Integrates official Government of India AGMARKNET data (data.gov.in) with transparent
provenance labelling (LIVE API, CACHED API DATA, LOCAL BENCHMARK).
"""
from typing import Optional
from fastapi import APIRouter, Query
from app.services.market_service import (
    MarketDataProvider,
    BASELINE_COMMODITY_PRICES,
    DISCLAIMER_TEXT,
    OGD_API_ENDPOINT,
    OGD_CATALOGUE_URL
)

router = APIRouter(prefix="/api/market", tags=["Market Intelligence"])
market_provider = MarketDataProvider()


@router.get("/status")
def get_market_service_status():
    """
    Returns diagnostic provenance status of the market intelligence service.
    Indicates whether live data.gov.in integration is active, cache status,
    and local benchmark fallback readiness without exposing secrets.
    """
    return {
        "status": "success",
        "service": "MannuMitra Mandi Intelligence & Forecast Service",
        "diagnostics": market_provider.get_market_diagnostics(),
        "disclaimer": DISCLAIMER_TEXT
    }


@router.get("/all")
def get_all_market_prices(district: Optional[str] = Query(None, description="Karnataka district for APMC filtering")):
    """
    Returns current APMC prices, empirical trend analytics, and harvest forecasts
    across all monitored Karnataka commodities with transparent provenance metadata.
    Data is labelled as LIVE API, CACHED API DATA, or LOCAL BENCHMARK.
    """
    results = []
    # Base set of monitored commodities
    crops_to_query = list(BASELINE_COMMODITY_PRICES.keys())
    if market_provider._historical_df is not None:
        hist_crops = market_provider._historical_df["crop_key"].unique().tolist()
        for hc in hist_crops:
            if hc not in crops_to_query:
                crops_to_query.append(hc)

    latest_reporting_date = "Unknown"
    any_live = False

    for crop in crops_to_query:
        curr = market_provider.get_current_mandi_price(crop, district=district)
        if curr.get("is_live"):
            any_live = True
        if latest_reporting_date == "Unknown" and curr.get("observation_date"):
            latest_reporting_date = curr.get("observation_date")
        trend = market_provider.calculate_price_trends(crop)
        forecast = market_provider.forecast_harvest_price(crop)
        results.append({
            "crop": crop,
            "current_price": curr,
            "trend_analysis": trend,
            "harvest_forecast": forecast
        })

    effective_mode = "LIVE_API" if any_live else market_provider.data_mode

    return {
        "status": "success",
        "total_commodities": len(results),
        "data_mode": effective_mode,
        "is_live_connected": market_provider.is_live_connected or any_live,
        "api_provider": market_provider.api_provider,
        "api_endpoint": market_provider.api_endpoint,
        "api_catalogue_url": market_provider.api_catalogue_url,
        "live_api_status": market_provider.live_api_status,
        "latest_reporting_date": latest_reporting_date,
        "last_refreshed_at": market_provider.last_refresh_timestamp,
        "disclaimer": DISCLAIMER_TEXT,
        "commodities": results
    }


@router.post("/refresh")
@router.get("/refresh")
def refresh_market_data():
    """
    Triggers an on-demand market data refresh.
    Clears in-memory cache and, if DATA_GOV_IN_API_KEY is configured in the environment,
    queries the official data.gov.in AGMARKNET daily feed for Karnataka APMC arrivals.
    Otherwise, refreshes from the verified local Karnataka APMC benchmark dataset.
    """
    return market_provider.refresh_market_data()


@router.get("/price/{crop}")
def get_market_price(crop: str, district: Optional[str] = Query(None, description="Karnataka district")):
    """
    Returns the latest APMC price, trends, and harvest forecast for a specific crop.
    Retrieves from live data.gov.in AGMARKNET API if configured, else verified local benchmark.
    """
    price_info = market_provider.get_current_mandi_price(crop, district=district)
    trends = market_provider.calculate_price_trends(crop)
    forecast = market_provider.forecast_harvest_price(crop)
    return {
        "crop": crop,
        "current_price": price_info,
        "trend_analysis": trends,
        "harvest_forecast": forecast,
        "disclaimer": DISCLAIMER_TEXT
    }


@router.get("/forecast/{crop}")
def get_harvest_forecast(
    crop: str,
    sowing_date: Optional[str] = Query(None, description="Planned sowing date (YYYY-MM-DD or YYYY-MM)"),
    duration_days: Optional[int] = Query(None, description="Documented crop duration in days"),
    variety: Optional[str] = Query(None, description="Crop variety name"),
    preferred_mandi: Optional[str] = Query(None, description="Preferred APMC mandi")
):
    """
    Generates a dedicated machine learning harvest-window modal price forecast
    with prediction interval and confidence evaluation metadata.
    """
    forecast = market_provider.forecast_harvest_price(
        crop=crop,
        sowing_date_str=sowing_date,
        duration_days=duration_days,
        variety=variety,
        preferred_mandi=preferred_mandi
    )
    return {
        "status": "success",
        "crop": crop,
        "harvest_forecast": forecast,
        "disclaimer": DISCLAIMER_TEXT
    }


@router.get("/history/{crop}")
def get_market_history(
    crop: str,
    days: int = Query(90, description="Number of recent trading days to retrieve", ge=7, le=365)
):
    """
    Returns dated daily modal, minimum, maximum prices and arrivals for chart visualization.
    """
    series = market_provider.get_historical_series(crop, days=days)
    curr = market_provider.get_current_mandi_price(crop)
    return {
        "status": "success",
        "crop": crop,
        "market": curr.get("primary_market", "APMC"),
        "total_days": len(series),
        "history": series,
        "disclaimer": DISCLAIMER_TEXT
    }
