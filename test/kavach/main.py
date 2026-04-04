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
    print("  Coverage: FOOD_DELIVERY | Billing: WEEKLY | ₹20-₹50")
    print("  Swagger Docs: http://localhost:8000/docs")
    print("=" * 60)
