"""
KavachSathi — Policy Service & Safety Rails
=============================================

Platform solvency protection and geographical fairness engine.

Safety Rails:
  1. Emergency Stop (Circuit Breaker) — HTTP 503 when Loss Ratio ≥ 85%
  2. Geographical Fairness — Urban vs Rural payout differentiation
  3. Income-Only Compliance — Zero health/vehicle/accident coverage

Why 85% Loss Ratio?
  Insurance solvency requires reserves for unexpected clustering of events.
  At 85% loss ratio, the platform retains only 15% for operations + reserves.
  Beyond this point, continued enrollment risks platform insolvency.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import threading
from datetime import datetime
from typing import Dict, Optional
from fastapi import HTTPException

from models import (
    AreaCategory,
    TriggerEvent,
    PolicyRecord,
    PlatformHealth,
)


# ─────────────────────────────────────────────────────────────────────
# PLATFORM STATE (Thread-Safe)
# ─────────────────────────────────────────────────────────────────────

_stats_lock = threading.Lock()

platform_stats: Dict[str, float] = {
    "total_payout": 0.0,
    "total_premium": 0.0,
    "total_policies": 0,
    "total_claims_processed": 0,
    "total_fraud_blocked": 0,
}

CIRCUIT_BREAKER_THRESHOLD: float = 0.85  # 85% Loss Ratio


# ─────────────────────────────────────────────────────────────────────
# PAYOUT TABLES — LOSS OF INCOME ONLY
# ─────────────────────────────────────────────────────────────────────

# These represent income drop ranges, NOT health or vehicle costs.
# Urban workers: ₹8000/week income → drops to ₹5000 during disruption
# Rural workers: ₹4000/week income → drops to ₹1000 during disruption
PAYOUT_CRITERIA: Dict[str, Dict[str, float]] = {
    "urban": {
        "max_income": 8000.0,       # Normal weekly income
        "disrupted_income": 5000.0,  # Income during event
        "max_payout": 3000.0,        # Max loss coverage (8000 - 5000)
        "min_payout": 500.0,         # Minimum payout per event
    },
    "rural": {
        "max_income": 4000.0,
        "disrupted_income": 1000.0,
        "max_payout": 3000.0,        # Max loss coverage (4000 - 1000)
        "min_payout": 300.0,
    },
}

# Severity tier payout percentages
SEVERITY_PAYOUT_PCT: Dict[int, float] = {
    1: 0.30,   # Tier 1: 30% of max payout (just above threshold)
    2: 0.60,   # Tier 2: 60% of max payout (moderate)
    3: 1.00,   # Tier 3: 100% of max payout (severe)
}


# ─────────────────────────────────────────────────────────────────────
# CIRCUIT BREAKER — EMERGENCY STOP
# ─────────────────────────────────────────────────────────────────────

def emergency_stop_check() -> None:
    """
    The Emergency Stop: Circuit Breaker for Platform Solvency.
    
    If Loss Ratio (Total Payout ÷ Total Premium) reaches 85%, 
    halt all new enrollments with HTTP 503.
    
    This protects the pool from catastrophic drainage during
    correlated events (e.g., city-wide monsoon hitting all wards).
    
    Raises:
        HTTPException: 503 if loss ratio ≥ 85%
    """
    with _stats_lock:
        if platform_stats["total_premium"] == 0:
            return  # No premiums collected yet — allow enrollment

        loss_ratio = platform_stats["total_payout"] / platform_stats["total_premium"]

        if loss_ratio >= CIRCUIT_BREAKER_THRESHOLD:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "CIRCUIT_BREAKER_TRIGGERED",
                    "message": (
                        "Service Unavailable: Platform solvency circuit breaker activated. "
                        f"Loss Ratio: {loss_ratio:.2%} (threshold: {CIRCUIT_BREAKER_THRESHOLD:.0%}). "
                        "New enrollments are temporarily suspended to protect existing policyholders."
                    ),
                    "loss_ratio": round(loss_ratio, 4),
                    "threshold": CIRCUIT_BREAKER_THRESHOLD,
                    "total_payout": platform_stats["total_payout"],
                    "total_premium": platform_stats["total_premium"],
                },
            )


def is_circuit_breaker_active() -> bool:
    """Check if the circuit breaker would trigger (without raising)."""
    with _stats_lock:
        if platform_stats["total_premium"] == 0:
            return False
        loss_ratio = platform_stats["total_payout"] / platform_stats["total_premium"]
        return loss_ratio >= CIRCUIT_BREAKER_THRESHOLD


# ─────────────────────────────────────────────────────────────────────
# GEOGRAPHICAL FAIRNESS — PAYOUT CALCULATION
# ─────────────────────────────────────────────────────────────────────

def get_payout_criteria(area_category: str) -> Dict[str, float]:
    """
    Get the income drop and payout bounds for an area category.
    
    This is strictly LOSS OF INCOME differentiation:
      - Urban: Income drops from ₹8000 → ₹5000 (higher baseline, smaller relative drop)
      - Rural: Income drops from ₹4000 → ₹1000 (lower baseline, larger relative impact)
    
    NO health, hospital, or vehicle repair costs. Ever.
    
    Args:
        area_category: 'urban' or 'rural'
    
    Returns:
        Dict with max_income, disrupted_income, max_payout, min_payout
    
    Raises:
        ValueError: If area_category is not 'urban' or 'rural'
    """
    key = area_category.lower()
    if key not in PAYOUT_CRITERIA:
        raise ValueError(
            f"Invalid area category: '{area_category}'. "
            f"Must be 'urban' or 'rural'. No intermediate or custom zones."
        )
    return PAYOUT_CRITERIA[key]


def calculate_payout_amount(
    area_category: AreaCategory,
    trigger_event: TriggerEvent,
    exposed_days: float = 1.0,
) -> float:
    """
    Calculate the exact ₹ payout for a valid claim.
    
    Formula: payout = max_payout × severity_pct × (exposed_days / base_days)
    
    Where:
      - max_payout comes from the area-specific income drop table
      - severity_pct is tiered (30% / 60% / 100%) based on trigger severity
      - exposed_days adjusts for actual disruption duration
    
    Args:
        area_category: URBAN or RURAL
        trigger_event: The trigger that activated the claim
        exposed_days: Number of workdays lost (1-7 for weekly)
    
    Returns:
        float: Payout amount in ₹, bounded by min/max for the area
    """
    criteria = get_payout_criteria(area_category.value)
    severity_tier = trigger_event.severity_tier()
    severity_pct = SEVERITY_PAYOUT_PCT.get(severity_tier, 0.30)

    # Base calculation
    base_payout = criteria["max_payout"] * severity_pct

    # Adjust for exposed days (normalized to 1 week = ~5 workdays)
    BASE_WORKDAYS = 5.0
    day_factor = min(exposed_days / BASE_WORKDAYS, 1.0)  # Cap at 100%
    adjusted_payout = base_payout * day_factor

    # Enforce area-specific bounds
    final_payout = max(criteria["min_payout"], min(criteria["max_payout"], adjusted_payout))

    return round(final_payout, 2)


# ─────────────────────────────────────────────────────────────────────
# PLATFORM STATS MANAGEMENT
# ─────────────────────────────────────────────────────────────────────

def update_platform_stats(
    premium_collected: float = 0.0,
    payout_disbursed: float = 0.0,
    new_policy: bool = False,
    claim_processed: bool = False,
    fraud_blocked: bool = False,
) -> None:
    """
    Thread-safe update to platform-level statistics.
    
    Args:
        premium_collected: Premium amount to add (₹)
        payout_disbursed: Payout amount to add (₹)
        new_policy: True if a new policy was enrolled
        claim_processed: True if a claim completed the pipeline
        fraud_blocked: True if a claim was blocked for fraud
    """
    with _stats_lock:
        platform_stats["total_premium"] += premium_collected
        platform_stats["total_payout"] += payout_disbursed
        if new_policy:
            platform_stats["total_policies"] += 1
        if claim_processed:
            platform_stats["total_claims_processed"] += 1
        if fraud_blocked:
            platform_stats["total_fraud_blocked"] += 1


def get_platform_health() -> PlatformHealth:
    """
    Get current platform health metrics for the dashboard.
    
    Returns:
        PlatformHealth: Current solvency status, loss ratio, and counters
    """
    with _stats_lock:
        total_prem = platform_stats["total_premium"]
        total_pay = platform_stats["total_payout"]

        loss_ratio = 0.0
        if total_prem > 0:
            loss_ratio = total_pay / total_prem

        return PlatformHealth(
            total_premium_collected=total_prem,
            total_payout_disbursed=total_pay,
            loss_ratio=round(loss_ratio, 4),
            circuit_breaker_active=(loss_ratio >= CIRCUIT_BREAKER_THRESHOLD),
            total_policies_active=int(platform_stats["total_policies"]),
            total_claims_processed=int(platform_stats["total_claims_processed"]),
            total_fraud_blocked=int(platform_stats["total_fraud_blocked"]),
        )


def reset_platform_stats() -> None:
    """Reset all platform stats. Used for testing."""
    with _stats_lock:
        platform_stats["total_payout"] = 0.0
        platform_stats["total_premium"] = 0.0
        platform_stats["total_policies"] = 0
        platform_stats["total_claims_processed"] = 0
        platform_stats["total_fraud_blocked"] = 0
