"""
KavachSathi — Actuarial Pricing Engine
=======================================

Dynamic risk-based premium calculation for parametric gig worker insurance.

Formula:  Premium = P(Trigger) × L_avg × D_exposed × RiskMultiplier
Bounds:   Hard-capped between ₹20 and ₹50 per week
Cycle:    WEEKLY only — aligned with gig worker pay cycles

Why weekly?
  - Gig workers earn daily/weekly, not monthly
  - Micro-premiums (₹20-₹50) reduce barrier to entry
  - Weekly renewal allows dynamic re-pricing based on seasonal risk

Actuarial Rationale:
  P(Trigger)   = Historical probability of a parametric event in the ward (0.0 - 1.0)
  L_avg        = Average daily income loss when a trigger event occurs (₹)
  D_exposed    = Expected number of workdays lost per trigger event
  RiskMultiplier = Regional adjustment factor based on ward-level historical data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    WorkerPersona,
    BillingCycle,
    AreaCategory,
    PremiumRequest,
    PremiumResponse,
)


# ─────────────────────────────────────────────────────────────────────
# PRICING CONSTANTS
# ─────────────────────────────────────────────────────────────────────

PREMIUM_FLOOR: float = 20.0   # ₹20 minimum weekly premium
PREMIUM_CEILING: float = 50.0  # ₹50 maximum weekly premium

# Ward-level historical trigger probabilities (mock data for demo)
# In production, this would be sourced from IMD/CPCB historical databases
WARD_TRIGGER_PROBABILITIES: dict = {
    # Delhi wards — high AQI risk zone
    "DELHI_CENTRAL": 0.18,
    "DELHI_SOUTH": 0.15,
    "DELHI_EAST": 0.20,
    "DELHI_NORTH": 0.22,
    "DELHI_WEST": 0.17,
    # Mumbai wards — high rainfall risk zone
    "MUMBAI_WESTERN": 0.25,
    "MUMBAI_EASTERN": 0.22,
    "MUMBAI_CENTRAL": 0.20,
    "MUMBAI_HARBOUR": 0.28,
    # Bangalore wards
    "BANGALORE_CENTRAL": 0.12,
    "BANGALORE_EAST": 0.14,
    "BANGALORE_SOUTH": 0.10,
    # Default for unknown wards
    "DEFAULT": 0.15,
}

# Average daily income by area category (₹)
# These represent what a food delivery worker earns per day
DAILY_INCOME_MAP: dict = {
    AreaCategory.URBAN: 800.0,   # ₹800/day urban (e.g., 20 orders × ₹40)
    AreaCategory.RURAL: 400.0,   # ₹400/day rural (fewer orders, lower ticket size)
}

# Regional risk multipliers — adjusts for metro vs non-metro exposure
RISK_MULTIPLIERS: dict = {
    "DELHI": 1.15,      # High AQI + monsoon double risk
    "MUMBAI": 1.20,     # Extreme monsoon flooding risk
    "BANGALORE": 1.05,  # Moderate rainfall risk
    "CHENNAI": 1.10,    # Cyclone season exposure
    "KOLKATA": 1.12,    # Flooding + AQI
    "DEFAULT": 1.0,
}


# ─────────────────────────────────────────────────────────────────────
# CORE PRICING FUNCTIONS
# ─────────────────────────────────────────────────────────────────────

def enforce_weekly_cycle(billing_cycle: str) -> None:
    """
    Gate: Reject any non-weekly billing cycle at the engine level.
    This is the second line of defense (Pydantic enum is the first).
    
    Raises:
        ValueError: If billing_cycle is not 'WEEKLY'
    """
    if billing_cycle.upper() != "WEEKLY":
        raise ValueError(
            f"REJECTED: Billing cycle '{billing_cycle}' is not supported. "
            f"KavachSathi operates on WEEKLY micro-premium cycles only. "
            f"Monthly/yearly billing contradicts the gig worker income model."
        )


def enforce_persona(persona: str) -> None:
    """
    Gate: Reject any non-food-delivery persona.
    
    Raises:
        ValueError: If persona is not FOOD_DELIVERY
    """
    if persona.upper() != WorkerPersona.FOOD_DELIVERY.value:
        raise ValueError(
            f"REJECTED: Persona '{persona}' is not covered. "
            f"KavachSathi exclusively insures FOOD_DELIVERY platform workers "
            f"(Zomato, Swiggy, Zepto). This is not a generic gig insurance product."
        )


def get_trigger_probability(ward_id: str) -> float:
    """
    Look up historical trigger probability for a ward.
    
    In production, this queries IMD/CPCB historical databases.
    For demo, uses curated ward-level mock data.
    
    Args:
        ward_id: Ward-level geographic identifier (e.g., 'DELHI_CENTRAL')
    
    Returns:
        float: Probability of trigger event (0.0 - 1.0)
    """
    return WARD_TRIGGER_PROBABILITIES.get(
        ward_id.upper(),
        WARD_TRIGGER_PROBABILITIES["DEFAULT"]
    )


def get_risk_multiplier(city: str) -> float:
    """
    Regional risk adjustment factor based on city-level hazard exposure.
    
    Args:
        city: City name for regional risk lookup
    
    Returns:
        float: Risk multiplier (1.0 = baseline)
    """
    return RISK_MULTIPLIERS.get(
        city.upper(),
        RISK_MULTIPLIERS["DEFAULT"]
    )


def calculate_exposed_days(area_category: AreaCategory) -> float:
    """
    Estimate expected workdays lost per trigger event.
    
    Urban workers lose fewer days (better infrastructure, alternative routes).
    Rural workers are more severely impacted (limited infrastructure).
    
    Args:
        area_category: URBAN or RURAL
    
    Returns:
        float: Expected lost workdays per event
    """
    if area_category == AreaCategory.RURAL:
        return 2.5  # Rural: ~2.5 days average disruption
    return 1.5      # Urban: ~1.5 days average disruption


def calculate_average_loss(area_category: AreaCategory) -> float:
    """
    Calculate average daily income loss based on area category.
    
    This is the L_avg component — it represents what the worker loses
    PER DAY when they cannot work due to a trigger event.
    
    Note: This is strictly LOSS OF INCOME. No health, hospital, 
    or vehicle repair costs are factored in.
    
    Args:
        area_category: URBAN or RURAL
    
    Returns:
        float: Average daily income loss in ₹
    """
    return DAILY_INCOME_MAP.get(area_category, 500.0)


def calculate_premium(
    persona: WorkerPersona,
    area_category: AreaCategory,
    ward_id: str,
    city: str = "Delhi",
    billing_cycle: BillingCycle = BillingCycle.WEEKLY,
) -> PremiumResponse:
    """
    CORE ACTUARIAL ENGINE
    
    Calculates the weekly premium using the formula:
      Premium = P(Trigger) × L_avg × D_exposed × RiskMultiplier
    
    Then hard-caps the result between ₹20 and ₹50.
    
    Args:
        persona: Must be FOOD_DELIVERY (enforced)
        area_category: URBAN or RURAL (affects L_avg and D_exposed)
        ward_id: Ward-level location for trigger probability lookup
        city: City for regional risk multiplier
        billing_cycle: Must be WEEKLY (enforced)
    
    Returns:
        PremiumResponse: Full pricing breakdown with formula details
    
    Raises:
        ValueError: If persona is not FOOD_DELIVERY or cycle is not WEEKLY
    """
    # ── Gate checks ──
    enforce_persona(persona.value)
    enforce_weekly_cycle(billing_cycle.value)

    # ── Actuarial components ──
    p_trigger = get_trigger_probability(ward_id)
    l_avg = calculate_average_loss(area_category)
    d_exposed = calculate_exposed_days(area_category)
    risk_mult = get_risk_multiplier(city)

    # ── The Formula ──
    raw_premium = p_trigger * l_avg * d_exposed * risk_mult

    # ── Hard cap between ₹20 and ₹50 ──
    cap_applied = False
    if raw_premium < PREMIUM_FLOOR:
        capped_premium = PREMIUM_FLOOR
        cap_applied = True
    elif raw_premium > PREMIUM_CEILING:
        capped_premium = PREMIUM_CEILING
        cap_applied = True
    else:
        capped_premium = round(raw_premium, 2)

    # ── Build breakdown string for transparency ──
    formula_str = (
        f"P(Trigger)={p_trigger:.3f} × L_avg=₹{l_avg:.0f} × "
        f"D_exposed={d_exposed:.1f} × RiskMult={risk_mult:.2f} = "
        f"₹{raw_premium:.2f} → Capped: ₹{capped_premium:.2f}"
    )

    return PremiumResponse(
        weekly_premium=capped_premium,
        p_trigger=p_trigger,
        l_avg=l_avg,
        d_exposed=d_exposed,
        risk_multiplier=risk_mult,
        formula_breakdown=formula_str,
        cap_applied=cap_applied,
    )


def batch_quote(ward_ids: list, area_category: AreaCategory, city: str = "Delhi") -> list:
    """
    Calculate premiums for multiple wards at once.
    Useful for fleet-level quoting or zone pricing dashboards.
    
    Args:
        ward_ids: List of ward identifiers
        area_category: URBAN or RURAL
        city: City for risk multiplier
    
    Returns:
        list: List of PremiumResponse objects
    """
    results = []
    for ward_id in ward_ids:
        response = calculate_premium(
            persona=WorkerPersona.FOOD_DELIVERY,
            area_category=area_category,
            ward_id=ward_id,
            city=city,
            billing_cycle=BillingCycle.WEEKLY,
        )
        results.append(response)
    return results
