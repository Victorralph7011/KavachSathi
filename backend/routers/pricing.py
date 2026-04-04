"""
KavachSathi — Premium Pricing Router
======================================

Exposes the actuarial pricing engine via REST API.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException

from models import PremiumRequest, PremiumResponse, AreaCategory
from ml.premium_engine import (
    calculate_premium,
    batch_quote,
    PREMIUM_FLOOR,
    PREMIUM_CEILING,
)


# ─────────────────────────────────────────────────────────────────────
# ROUTER SETUP
# ─────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/pricing", tags=["Actuarial Pricing Engine"])


# ─────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

@router.post("/quote", summary="Get a premium quote for a worker", response_model=PremiumResponse)
async def get_quote(request: PremiumRequest) -> PremiumResponse:
    """
    Calculate the weekly premium for a gig worker.
    
    Formula: Premium = P(Trigger) × L_avg × D_exposed × RiskMultiplier
    Bounds: ₹20 – ₹50 per week (hard cap)
    
    The response includes a full formula breakdown for transparency.
    """
    try:
        response = calculate_premium(
            persona=request.persona,
            area_category=request.area_category,
            ward_id=request.ward_id,
            city=request.city,
            billing_cycle=request.billing_cycle,
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bounds", summary="Get premium cap information")
async def get_bounds() -> dict:
    """
    Returns the hard premium bounds enforced by the pricing engine.
    
    These caps ensure affordability for gig workers while maintaining
    actuarial sustainability.
    """
    return {
        "currency": "INR",
        "billing_cycle": "WEEKLY",
        "floor": PREMIUM_FLOOR,
        "ceiling": PREMIUM_CEILING,
        "description": (
            f"Weekly premium is hard-capped between ₹{PREMIUM_FLOOR:.0f} and ₹{PREMIUM_CEILING:.0f}. "
            f"This keeps insurance affordable for food delivery workers earning ₹400-₹800/day."
        ),
        "rationale": (
            "Gig workers earn daily/weekly, not monthly. "
            "Micro-premiums (₹20-₹50) reduce barrier to entry and align with pay cycles."
        ),
    }


@router.post("/batch", summary="Batch premium quotes for multiple wards")
async def batch_pricing(ward_ids: list, area_category: str, city: str = "Delhi") -> dict:
    """
    Calculate premiums for multiple wards at once.
    Useful for fleet-level quoting or zone pricing dashboards.
    """
    try:
        area_cat = AreaCategory(area_category.upper())
        results = batch_quote(ward_ids=ward_ids, area_category=area_cat, city=city)
        return {
            "total_wards": len(results),
            "quotes": [r.model_dump() for r in results],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
