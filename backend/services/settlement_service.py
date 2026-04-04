"""
KavachSathi — Mock Razorpay Settlement Service
================================================

Simulates the final mile of the zero-touch pipeline:
  Trigger Confirmed → Eligibility Checked → Payout Calculated → Transfer Initiated → Record Updated

Settlement Channels (in priority order):
  1. UPI Transfer — Instant, preferred (worker already has UPI)
  2. IMPS to Bank — Fallback if UPI not linked
  3. Razorpay Sandbox — For demo/hackathon simulation

Key Points (from DEVTrails Guidewire):
  - Zero-touch: worker does nothing to receive payout
  - Defined settlement time: minutes, not hours
  - Rollback logic: handles mid-transfer failures
  - Fraud check BEFORE payment, not after
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
import random
from datetime import datetime
from typing import Optional

from models import PayoutResult, PayoutChannel


# ─────────────────────────────────────────────────────────────────────
# MOCK RAZORPAY SANDBOX
# ─────────────────────────────────────────────────────────────────────

# In production, these would be actual Razorpay API calls via httpx
RAZORPAY_SANDBOX_BASE = "https://api.razorpay.com/v1"
MOCK_API_KEY = "rzp_test_kavachsathi_demo"


def _generate_transaction_id() -> str:
    """Generate a mock Razorpay-style transaction ID."""
    return f"pay_KS{uuid.uuid4().hex[:16].upper()}"


def _generate_upi_reference() -> str:
    """Generate a mock UPI transaction reference."""
    return f"UPI{random.randint(100000000000, 999999999999)}"


def initiate_payout(
    worker_id: str,
    claim_id: str,
    amount: float,
    upi_id: Optional[str] = None,
    channel: PayoutChannel = PayoutChannel.UPI,
) -> PayoutResult:
    """
    Initiate a payout through the mock Razorpay sandbox.
    
    In production, this would:
      1. Call Razorpay POST /v1/payouts with fund_account_id
      2. Wait for webhook confirmation
      3. Update claim record on success
      4. Trigger rollback on failure
    
    For hackathon demo, simulates the full flow with realistic
    transaction IDs and settlement timestamps.
    
    Args:
        worker_id: Worker receiving the payout
        claim_id: Associated claim ID
        amount: Payout amount in ₹
        upi_id: Worker's UPI ID (optional, for UPI channel)
        channel: Payment channel to use
    
    Returns:
        PayoutResult: Settlement confirmation with transaction details
    
    Raises:
        ValueError: If amount is non-positive
    """
    if amount <= 0:
        raise ValueError(f"Payout amount must be positive. Got: ₹{amount}")

    # Select channel based on availability
    if channel == PayoutChannel.UPI and not upi_id:
        # Fallback to IMPS if UPI ID not available
        channel = PayoutChannel.IMPS

    transaction_id = _generate_transaction_id()
    upi_ref = _generate_upi_reference() if channel == PayoutChannel.UPI else None

    # Mock the settlement — in production this would be async with webhook
    # Settlement time: targeting < 2 minutes for UPI
    result = PayoutResult(
        transaction_id=transaction_id,
        amount=round(amount, 2),
        currency="INR",
        channel=channel,
        upi_reference=upi_ref,
        status="PROCESSED",
        settled_at=datetime.utcnow(),
        worker_id=worker_id,
        claim_id=claim_id,
        rollback_eligible=True,
    )

    # Log the settlement (would be persisted to DB in production)
    _log_settlement(result)

    return result


def rollback_payout(transaction_id: str, reason: str) -> dict:
    """
    Rollback a payout that failed mid-transfer.
    
    In production, this would:
      1. Call Razorpay refund/reversal API
      2. Update the claim to APPROVED (re-queue for retry)
      3. Notify operations team
    
    Args:
        transaction_id: The transaction to reverse
        reason: Reason for rollback
    
    Returns:
        dict: Rollback confirmation
    """
    return {
        "rollback_id": f"rb_{uuid.uuid4().hex[:12]}",
        "original_transaction": transaction_id,
        "status": "ROLLED_BACK",
        "reason": reason,
        "timestamp": datetime.utcnow().isoformat(),
        "note": "In production, funds would be returned to the pool and claim re-queued.",
    }


def _log_settlement(result: PayoutResult) -> None:
    """
    Log settlement for audit trail.
    In production: writes to PolicyCenter ledger + BillingCenter reconciliation.
    """
    # Console log for demo visibility
    print(
        f"[SETTLEMENT] ₹{result.amount:.2f} → Worker {result.worker_id} | "
        f"Claim {result.claim_id} | Txn {result.transaction_id} | "
        f"Channel {result.channel.value} | Status {result.status}"
    )
