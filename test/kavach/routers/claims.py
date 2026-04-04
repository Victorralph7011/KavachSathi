"""
KavachSathi — Zero-Touch Claims Pipeline Router
=================================================

The heart of parametric insurance: ZERO human intervention.

Flow (from DEVTrails Guidewire):
  1. Trigger fires    → IMD/CPCB API detects event exceeding threshold
  2. Policy checked   → System finds all active workers in trigger zone
  3. Fraud verified   → GPS cross-checked with platform login data
  4. Payout released  → ₹ transferred to worker's UPI within minutes

Traditional: Worker files claim → waits 15-30 days → maybe paid
Parametric:  Trigger fires → system pays → done within minutes

Trigger Thresholds:
  - Rainfall > 60mm (ward-level from IMD oracle)
  - AQI > 300 (ward-level from CPCB oracle)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from models import (
    TriggerEvent,
    TriggerType,
    ClaimRecord,
    ClaimState,
    GPSPing,
    PlatformSignal,
    FraudVerdict,
    AreaCategory,
)
from services.claim_service import full_pop_validation
from services.policy_service import (
    calculate_payout_amount,
    update_platform_stats,
)
from services.settlement_service import initiate_payout


# ─────────────────────────────────────────────────────────────────────
# ROUTER SETUP
# ─────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/claims", tags=["Zero-Touch Claims Pipeline"])


# ─────────────────────────────────────────────────────────────────────
# IN-MEMORY STORES (Production: Firestore / PostgreSQL)
# ─────────────────────────────────────────────────────────────────────

# Active policies indexed by ward_id for fast trigger matching
_policies_by_ward: dict = {}

# Claims store indexed by claim_id
_claims_store: dict = {}


def register_policy_for_claims(policy_id: str, worker_id: str, ward_id: str,
                                area_category: str, upi_id: Optional[str] = None) -> None:
    """Register a policy so the claims pipeline can find affected workers."""
    if ward_id not in _policies_by_ward:
        _policies_by_ward[ward_id] = []
    _policies_by_ward[ward_id].append({
        "policy_id": policy_id,
        "worker_id": worker_id,
        "ward_id": ward_id,
        "area_category": area_category,
        "upi_id": upi_id,
    })


# ─────────────────────────────────────────────────────────────────────
# TRIGGER INGESTION — The System "Wakes Up"
# ─────────────────────────────────────────────────────────────────────

@router.post("/triggers/ingest", summary="Ingest a parametric trigger event from oracle")
async def ingest_trigger(trigger: TriggerEvent) -> dict:
    """
    Receive a weather/AQI trigger event from an external oracle.
    
    If the event exceeds thresholds (Rain > 60mm OR AQI > 300),
    automatically create claims for all active policies in the affected ward.
    
    This is the first step of the zero-touch pipeline.
    No worker action required.
    """
    # ── Threshold Gate ──
    if not trigger.exceeds_threshold():
        return {
            "status": "BELOW_THRESHOLD",
            "message": (
                f"Trigger value {trigger.value} does not exceed threshold. "
                f"Rainfall must be > 60mm, AQI must be > 300."
            ),
            "trigger_type": trigger.trigger_type.value,
            "value": trigger.value,
            "ward_id": trigger.ward_id,
            "claims_created": 0,
        }

    # ── Find affected policies in the ward ──
    affected_policies = _policies_by_ward.get(trigger.ward_id.upper(), [])

    if not affected_policies:
        return {
            "status": "NO_ACTIVE_POLICIES",
            "message": f"No active policies in ward {trigger.ward_id}.",
            "trigger_type": trigger.trigger_type.value,
            "value": trigger.value,
            "ward_id": trigger.ward_id,
            "claims_created": 0,
        }

    # ── Auto-create claims for each affected worker ──
    created_claims = []
    for policy in affected_policies:
        claim_id = f"CLM-{uuid.uuid4().hex[:12].upper()}"

        claim = ClaimRecord(
            claim_id=claim_id,
            policy_id=policy["policy_id"],
            worker_id=policy["worker_id"],
            trigger_event=trigger,
            state=ClaimState.DETECTED,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            state_history=[f"CREATED at {datetime.utcnow().isoformat()} | Trigger: {trigger.trigger_type.value}={trigger.value}"],
        )

        _claims_store[claim_id] = {
            "claim": claim,
            "area_category": policy["area_category"],
            "upi_id": policy.get("upi_id"),
        }
        created_claims.append(claim_id)

    return {
        "status": "CLAIMS_CREATED",
        "message": f"Trigger confirmed. {len(created_claims)} claims auto-created.",
        "trigger_type": trigger.trigger_type.value,
        "value": trigger.value,
        "severity_tier": trigger.severity_tier(),
        "ward_id": trigger.ward_id,
        "claims_created": len(created_claims),
        "claim_ids": created_claims,
    }


# ─────────────────────────────────────────────────────────────────────
# CLAIM PROCESSING — Zero-Touch State Machine
# ─────────────────────────────────────────────────────────────────────

class ClaimProcessInput(TriggerEvent):
    """Extended input for claim processing with GPS and platform data."""
    pass


@router.post("/claims/{claim_id}/process", summary="Advance claim through zero-touch pipeline")
async def process_claim(
    claim_id: str,
    gps_trail: Optional[List[GPSPing]] = None,
    platform_signal: Optional[PlatformSignal] = None,
) -> dict:
    """
    Advance a claim through the zero-touch state machine:
      DETECTED → VALIDATING → APPROVED → PAID
    
    No human approval at any stage, per the parametric insurance model.
    
    The state machine enforces valid transitions only:
      - DETECTED → VALIDATING (starts POP validation)
      - VALIDATING → APPROVED (if POP passes) or FRAUD_BLOCKED (if fraud detected)
      - APPROVED → PAID (triggers Razorpay settlement)
      - PAID → terminal (no further transitions)
      - FRAUD_BLOCKED → terminal (no further transitions)
    """
    if claim_id not in _claims_store:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found.")

    entry = _claims_store[claim_id]
    claim: ClaimRecord = entry["claim"]
    area_cat_str: str = entry["area_category"]
    upi_id: Optional[str] = entry.get("upi_id")

    current_state = claim.state

    # ── DETECTED → VALIDATING ──
    if current_state == ClaimState.DETECTED:
        claim.advance_state(ClaimState.VALIDATING, "Auto-advancing to POP validation")

        # If GPS trail provided, run POP validation immediately
        if gps_trail and len(gps_trail) >= 3:
            claim.gps_trail = gps_trail
            if platform_signal:
                claim.platform_signal = platform_signal

            # Run full POP validation
            verdict: FraudVerdict = full_pop_validation(
                gps_trail=gps_trail,
                platform_signal=platform_signal,
                trigger_event=claim.trigger_event,
            )
            claim.fraud_verdict = verdict

            if verdict.is_fraudulent:
                # ── FRAUD DETECTED → BLOCKED ──
                claim.advance_state(
                    ClaimState.FRAUD_BLOCKED,
                    f"Fraud detected: {verdict.fraud_type} (confidence: {verdict.confidence_score})"
                )
                update_platform_stats(fraud_blocked=True)

                return {
                    "claim_id": claim_id,
                    "state": claim.state.value,
                    "message": "FRAUD DETECTED AND BLOCKED",
                    "fraud_verdict": verdict.model_dump(),
                    "state_history": claim.state_history,
                }
            else:
                # ── POP PASSED → APPROVED ──
                claim.advance_state(ClaimState.APPROVED, "POP validation passed — auto-approved")

                # Calculate payout
                area_category = AreaCategory(area_cat_str.upper())
                payout_amount = calculate_payout_amount(
                    area_category=area_category,
                    trigger_event=claim.trigger_event,
                )
                claim.payout_amount = payout_amount

                # ── APPROVED → PAID (instant settlement) ──
                payout_result = initiate_payout(
                    worker_id=claim.worker_id,
                    claim_id=claim.claim_id,
                    amount=payout_amount,
                    upi_id=upi_id,
                )
                claim.payout_transaction_id = payout_result.transaction_id
                claim.advance_state(ClaimState.PAID, f"Settled via {payout_result.channel.value}: {payout_result.transaction_id}")

                update_platform_stats(payout_disbursed=payout_amount, claim_processed=True)

                return {
                    "claim_id": claim_id,
                    "state": claim.state.value,
                    "message": "ZERO-TOUCH PIPELINE COMPLETE: Trigger → Validated → Approved → Paid",
                    "payout_amount": payout_amount,
                    "payout_transaction": payout_result.model_dump(),
                    "fraud_verdict": verdict.model_dump(),
                    "state_history": claim.state_history,
                }

        return {
            "claim_id": claim_id,
            "state": claim.state.value,
            "message": "Moved to VALIDATING. Provide GPS trail + platform signal to continue.",
            "requires": ["gps_trail (min 3 pings)", "platform_signal (optional but recommended)"],
            "state_history": claim.state_history,
        }

    # ── VALIDATING → APPROVED/BLOCKED (if GPS provided later) ──
    elif current_state == ClaimState.VALIDATING:
        if not gps_trail or len(gps_trail) < 3:
            raise HTTPException(
                status_code=400,
                detail="GPS trail with at least 3 pings required for POP validation."
            )

        claim.gps_trail = gps_trail
        if platform_signal:
            claim.platform_signal = platform_signal

        verdict = full_pop_validation(
            gps_trail=gps_trail,
            platform_signal=platform_signal,
            trigger_event=claim.trigger_event,
        )
        claim.fraud_verdict = verdict

        if verdict.is_fraudulent:
            claim.advance_state(
                ClaimState.FRAUD_BLOCKED,
                f"Fraud: {verdict.fraud_type} ({verdict.confidence_score})"
            )
            update_platform_stats(fraud_blocked=True)
            return {
                "claim_id": claim_id,
                "state": claim.state.value,
                "message": "FRAUD DETECTED AND BLOCKED",
                "fraud_verdict": verdict.model_dump(),
                "state_history": claim.state_history,
            }

        # Approved → calculate payout → settle
        claim.advance_state(ClaimState.APPROVED, "POP passed")
        area_category = AreaCategory(area_cat_str.upper())
        payout_amount = calculate_payout_amount(
            area_category=area_category,
            trigger_event=claim.trigger_event,
        )
        claim.payout_amount = payout_amount

        payout_result = initiate_payout(
            worker_id=claim.worker_id,
            claim_id=claim.claim_id,
            amount=payout_amount,
            upi_id=upi_id,
        )
        claim.payout_transaction_id = payout_result.transaction_id
        claim.advance_state(ClaimState.PAID, f"Settled: {payout_result.transaction_id}")
        update_platform_stats(payout_disbursed=payout_amount, claim_processed=True)

        return {
            "claim_id": claim_id,
            "state": claim.state.value,
            "message": "PIPELINE COMPLETE: Validated → Approved → Paid",
            "payout_amount": payout_amount,
            "payout_transaction": payout_result.model_dump(),
            "state_history": claim.state_history,
        }

    # ── Terminal states ──
    elif current_state in (ClaimState.PAID, ClaimState.FRAUD_BLOCKED):
        return {
            "claim_id": claim_id,
            "state": claim.state.value,
            "message": f"Claim is in terminal state: {claim.state.value}. No further transitions.",
            "state_history": claim.state_history,
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unexpected state: {current_state.value}")


# ─────────────────────────────────────────────────────────────────────
# CLAIM RETRIEVAL
# ─────────────────────────────────────────────────────────────────────

@router.get("/claims/{claim_id}", summary="Get claim status with audit trail")
async def get_claim(claim_id: str) -> dict:
    """Retrieve full claim details including state history and fraud verdict."""
    if claim_id not in _claims_store:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found.")

    claim: ClaimRecord = _claims_store[claim_id]["claim"]
    return {
        "claim_id": claim.claim_id,
        "policy_id": claim.policy_id,
        "worker_id": claim.worker_id,
        "state": claim.state.value,
        "trigger": {
            "type": claim.trigger_event.trigger_type.value,
            "value": claim.trigger_event.value,
            "ward_id": claim.trigger_event.ward_id,
            "severity_tier": claim.trigger_event.severity_tier(),
        },
        "payout_amount": claim.payout_amount,
        "payout_transaction_id": claim.payout_transaction_id,
        "fraud_verdict": claim.fraud_verdict.model_dump() if claim.fraud_verdict else None,
        "state_history": claim.state_history,
        "created_at": claim.created_at.isoformat(),
        "updated_at": claim.updated_at.isoformat(),
    }


@router.get("/", summary="List all claims with optional state filter")
async def list_claims(state: Optional[str] = Query(None, description="Filter by claim state")) -> dict:
    """List all claims, optionally filtered by state."""
    claims = []
    for cid, entry in _claims_store.items():
        claim: ClaimRecord = entry["claim"]
        if state and claim.state.value != state.upper():
            continue
        claims.append({
            "claim_id": claim.claim_id,
            "worker_id": claim.worker_id,
            "state": claim.state.value,
            "trigger_type": claim.trigger_event.trigger_type.value,
            "payout_amount": claim.payout_amount,
            "created_at": claim.created_at.isoformat(),
        })

    return {
        "total": len(claims),
        "claims": claims,
    }
