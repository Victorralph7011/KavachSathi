"""
KavachSathi — FastAPI Application Entry Point
===============================================

Parametric Income Protection for India's Gig Workers.

Run:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Swagger Docs:
  http://localhost:8000/docs
"""

import sys
import os

# Ensure the kavach package is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import claims, policies, pricing
from services.policy_service import reset_platform_stats
from services.weather_service import get_current_weather


# ─────────────────────────────────────────────────────────────────────
# APP CONFIGURATION
# ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="KavachSathi — Parametric Insurance Engine",
    description=(
        "**Zero-Touch Parametric Income Protection for India's Gig Workers**\n\n"
        "KavachSathi is a parametric insurance platform that automatically protects "
        "food delivery workers (Zomato, Swiggy, Zepto) against income loss during "
        "extreme weather events and poor air quality.\n\n"
        "### How It Works\n"
        "1. **Trigger Fires** — IMD/CPCB oracle detects Rainfall > 60mm or AQI > 300\n"
        "2. **Policy Checked** — System finds all active workers in the trigger zone\n"
        "3. **Fraud Verified** — GPS cross-checked with platform login data (POP Validator)\n"
        "4. **Payout Released** — ₹ transferred to worker's UPI within minutes\n\n"
        "### Key Innovations\n"
        "- **Actuarial Pricing**: `Premium = P(Trigger) × L_avg × D_exposed` (₹20-₹50/week)\n"
        "- **POP Validator**: Haversine-based impossible jump detection (>100 km/h = fraud)\n"
        "- **Circuit Breaker**: Platform halts at 85% loss ratio to protect solvency\n"
        "- **Loss of Income ONLY**: No health, hospital, or vehicle repair coverage\n\n"
        "*Traditional: Worker files claim → waits 15-30 days → maybe paid*\n"
        "*Parametric: Trigger fires → system pays → done within minutes*"
    ),
    version="2.0.0",
    contact={
        "name": "KavachSathi Team",
        "url": "https://kavachsathi.vercel.app",
    },
    license_info={
        "name": "MIT",
    },
)


# ─────────────────────────────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development — restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────────────

app.include_router(claims.router)
app.include_router(policies.router)
app.include_router(pricing.router)


# ─────────────────────────────────────────────────────────────────────
# LIVE WEATHER ENDPOINT
# ─────────────────────────────────────────────────────────────────────

@app.get("/api/weather/current", tags=["Weather"])
async def current_weather():
    """
    Returns live weather data for Kattankulathur (lat=12.8231, lon=80.0442).

    Fetches from Open-Meteo (temperature, humidity, precipitation) and the Open-Meteo
    Air Quality API (US AQI). Falls back to sensible defaults if either
    upstream API is unreachable.

    Response fields:
      - temperature_c: current air temperature in °C
      - humidity:      relative humidity in %
      - aqi:           US AQI index
      - rain_mm:       current precipitation in mm/hr
      - source:        "live" | "fallback"
    """
    return await get_current_weather()


# ─────────────────────────────────────────────────────────────────────
# LIVE ML PREMIUM ENDPOINT
# ─────────────────────────────────────────────────────────────────────

@app.get("/api/predict-premium", tags=["Weather"])
async def predict_premium():
    """
    Returns the ML engine's dynamic premium for current Kattankulathur conditions.

    Internally fetches live weather then calls the ML engine, so the frontend
    only needs a single GET request to get both the price and the risk multiplier.

    Response fields:
      - dynamic_premium:  float  — ML-calculated weekly premium (₹)
      - risk_multiplier:  float  — environmental risk factor applied
      - temperature_c:    float  — weather input used
      - humidity:         float  — relative humidity %
      - aqi:              float  — AQI input used
      - rain_mm:          float  — precipitation in mm/hr
      - source:           str    — "live" | "fallback"
    """
    from services.ml_service import get_dynamic_premium
    weather = await get_current_weather()
    ml_result = await get_dynamic_premium(
        temp=weather["temperature_c"],
        aqi=weather["aqi"],
        rain=weather.get("rain_mm", 0.0),
    )
    return {
        "dynamic_premium":  ml_result.get("dynamic_premium", 10.0),
        "risk_multiplier":  ml_result.get("risk_multiplier", 1.0),
        "temperature_c":    weather["temperature_c"],
        "humidity":         weather["humidity"],
        "aqi":              weather["aqi"],
        "rain_mm":          weather.get("rain_mm", 0.0),
        "source":           weather["source"],
    }


# ─────────────────────────────────────────────────────────────────────
# AUTONOMOUS ORACLE STATUS ENDPOINT
# ─────────────────────────────────────────────────────────────────────

@app.get("/api/oracle/status", tags=["Weather"])
async def oracle_status(
    area_category: str = "RURAL",
    risk_multiplier: float = 1.0,
):
    """
    Runs the Autonomous Parametric Oracle against live Kattankulathur weather.

    Checks live conditions against KavachSathi thresholds:
      - Rainfall  > 50mm/hr  → RAINFALL_BREACH
      - Temperature > 40°C   → HEATWAVE_BREACH
      - AQI > 200            → AQI_BREACH

    Response fields:
      - monitoring:    bool   — True when no breaches active
      - breaches:      list   — structured oracle events ready for state machine
      - weather:       dict   — raw live weather snapshot
      - checked_at:    str    — ISO timestamp of the check
      - data_source:   str    — "live" | "fallback"
    """
    from services.autonomous_trigger_service import check_oracle
    return await check_oracle(
        area_category=area_category,
        risk_multiplier=risk_multiplier,
    )



# ─────────────────────────────────────────────────────────────────────
# ROOT & HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns platform status and API version.
    """
    return {
        "status": "OPERATIONAL",
        "platform": "KavachSathi",
        "version": "2.0.0",
        "engine": "Parametric Insurance — Zero-Touch Pipeline",
        "coverage": "FOOD_DELIVERY workers only",
        "billing": "WEEKLY micro-premiums (₹20-₹50)",
        "triggers": {
            "rainfall": "> 60mm (ward-level)",
            "aqi": "> 300 (ward-level)",
        },
        "safety": {
            "circuit_breaker": "85% Loss Ratio → HTTP 503",
            "fraud_detection": "Haversine POP Validator (>100 km/h = blocked)",
        },
        "docs": "/docs",
    }


# ─────────────────────────────────────────────────────────────────────
# STARTUP EVENT
# ─────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    """Initialize platform state on startup."""
    reset_platform_stats()
    print("=" * 60)
    print("  KavachSathi Engine v2.0.0 — ONLINE")
    print("  Parametric Income Protection for India's Gig Workers")
    print("  Coverage: FOOD_DELIVERY | Billing: WEEKLY | Rs. 20-Rs. 50")
    print("  Swagger Docs: http://localhost:8000/docs")
    print("=" * 60)
