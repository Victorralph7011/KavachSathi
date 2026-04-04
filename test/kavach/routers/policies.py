"""
KavachSathi — Policy Enrollment & Platform Health Router
=========================================================

Handles worker enrollment with circuit breaker protection.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends

from models import (
    PolicyEnrollRequest,
    PolicyRecord,
    WorkerPersona,
    BillingCycle,
    PlatformHealth,
)
from ml.premium_engine import calculate_premium
from services.policy_service import (
    emergency_stop_check,
    update_platform_stats,
    get_platform_health,
)
from routers.claims import register_policy_for_claims


# ─────────────────────────────────────────────────────────────────────
# ROUTER SETUP
# ─────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/policies", tags=["Policy Enrollment & Management"])


# ─────────────────────────────────────────────────────────────────────
# IN-MEMORY POLICY STORE
# ─────────────────────────────────────────────────────────────────────

_policies_store: dict = {}


# ─────────────────────────────────────────────────────────────────────
# ENROLLMENT — With Circuit Breaker Guard
# ─────────────────────────────────────────────────────────────────────

@router.post("/enroll", summary="Enroll a gig worker in KavachSathi coverage")
async def enroll_worker(request: PolicyEnrollRequest) -> dict:
    """
    Enroll a food delivery platform worker in parametric income protection.
    
    Pre-checks:
      1. Circuit Breaker — if loss ratio ≥ 85%, enrollment is blocked (HTTP 503)
      2. Persona Lock — only FOOD_DELIVERY workers accepted
      3. Billing Cycle — only WEEKLY accepted
    
    On success:
      - Calculates dynamic premium via actuarial engine
      - Issues policy with ₹20-₹50 weekly premium
      - Registers policy for claims matching (ward-level)
    """
    # ── CIRCUIT BREAKER CHECK ──
    # This is the first gate — if the platform is at risk, stop enrolling
    emergency_stop_check()

    # ── PERSONA LOCK (defense in depth — Pydantic already validates) ──
    if request.persona != WorkerPersona.FOOD_DELIVERY:
        raise HTTPException(
            status_code=400,
            detail="KavachSathi only covers FOOD_DELIVERY platform workers."
        )

    # ── BILLING CYCLE LOCK ──
    if request.billing_cycle != BillingCycle.WEEKLY:
        raise HTTPException(
            status_code=400,
            detail="Only WEEKLY billing cycle is supported."
        )

    # ── CALCULATE PREMIUM ──
    premium_response = calculate_premium(
        persona=request.persona,
        area_category=request.area_category,
        ward_id=request.ward_id,
        city=request.city,
        billing_cycle=request.billing_cycle,
    )

    # ── CREATE POLICY ──
    policy_id = f"POL-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.utcnow()

    policy = PolicyRecord(
        policy_id=policy_id,
        worker_id=request.worker_id,
        worker_name=request.worker_name,
        persona=request.persona,
        billing_cycle=request.billing_cycle,
        area_category=request.area_category,
        ward_id=request.ward_id.upper(),
        city=request.city,
        platform_name=request.platform_name,
        upi_id=request.upi_id,
        weekly_premium=premium_response.weekly_premium,
        is_active=True,
        enrolled_at=now,
        expires_at=now + timedelta(weeks=1),  # Weekly renewal
    )

    _policies_store[policy_id] = policy

    # Register for claims matching
    register_policy_for_claims(
        policy_id=policy_id,
        worker_id=request.worker_id,
        ward_id=request.ward_id.upper(),
        area_category=request.area_category.value,
        upi_id=request.upi_id,
    )

    # Update platform stats
    update_platform_stats(
        premium_collected=premium_response.weekly_premium,
        new_policy=True,
    )

    return {
        "status": "ENROLLED",
        "policy": policy.model_dump(),
        "premium_breakdown": premium_response.model_dump(),
        "message": (
            f"Welcome to KavachSathi, {request.worker_name}! "
            f"Your weekly premium is ₹{premium_response.weekly_premium:.2f}. "
            f"You are now covered for income loss due to rainfall (>60mm) and AQI (>300) "
            f"events in ward {request.ward_id}."
        ),
    }


# ─────────────────────────────────────────────────────────────────────
# POLICY RETRIEVAL
# ─────────────────────────────────────────────────────────────────────

@router.get("/policies/{policy_id}", summary="Get policy details")
async def get_policy(policy_id: str) -> dict:
    """Retrieve full policy details for a worker."""
    if policy_id not in _policies_store:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found.")

    policy: PolicyRecord = _policies_store[policy_id]
    return {"policy": policy.model_dump()}


@router.get("/", summary="List all policies")
async def list_policies() -> dict:
    """List all enrolled policies."""
    policies = [p.model_dump() for p in _policies_store.values()]
    return {
        "total": len(policies),
        "policies": policies,
    }


# ─────────────────────────────────────────────────────────────────────
# PLATFORM HEALTH DASHBOARD
# ─────────────────────────────────────────────────────────────────────

@router.get("/platform/health", summary="Platform solvency dashboard")
async def platform_health_dashboard() -> dict:
    """
    Real-time platform health metrics.
    
    Shows:
      - Loss Ratio (Total Payout ÷ Total Premium)
      - Circuit Breaker status
      - Total enrolled policies
      - Claims processed vs fraud blocked
    """
    health: PlatformHealth = get_platform_health()
    return {
        "platform_health": health.model_dump(),
        "circuit_breaker_status": (
            "🛑 ACTIVE — New enrollments blocked"
            if health.circuit_breaker_active
            else "✅ HEALTHY — Enrollments open"
        ),
    }
