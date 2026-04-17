"""
KavachSathi — Pydantic Models & Domain Enums
=============================================

All data validation schemas for the parametric insurance engine.
Strictly enforces:
  - FOOD_DELIVERY persona lock
  - WEEKLY billing cycle only
  - Loss-of-income-only compliance (no health/vehicle/accident coverage)
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ─────────────────────────────────────────────────────────────────────
# DOMAIN ENUMS
# ─────────────────────────────────────────────────────────────────────

class WorkerPersona(str, Enum):
    """
    Persona Lock: KavachSathi exclusively covers food delivery platform workers.
    No generic 'OTHER' or ride-hailing personas allowed.
    """
    FOOD_DELIVERY = "FOOD_DELIVERY"


class BillingCycle(str, Enum):
    """
    Billing is STRICTLY weekly. Monthly/yearly cycles are rejected at the schema level.
    This keeps premiums micro (₹20-₹50) and aligned with gig worker pay cycles.
    """
    WEEKLY = "WEEKLY"


class AreaCategory(str, Enum):
    """
    Geographical fairness indexing.
    Urban and Rural have different income baselines → different payout tiers.
    """
    URBAN = "URBAN"
    RURAL = "RURAL"


class TriggerType(str, Enum):
    """
    Parametric trigger types sourced from weather/environmental oracles.
    Only objective, measurable events qualify — no subjective claims.
    """
    RAINFALL = "RAINFALL"   # Threshold: > 60mm
    AQI = "AQI"             # Threshold: > 300


class ClaimState(str, Enum):
    """
    Zero-touch state machine for claims.
    Progression: DETECTED → VALIDATING → APPROVED → PAID
    No human approval gates. Fraud → FRAUD_BLOCKED terminal state.
    """
    DETECTED = "DETECTED"
    VALIDATING = "VALIDATING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    FRAUD_BLOCKED = "FRAUD_BLOCKED"


class PayoutChannel(str, Enum):
    """Supported payout channels for settlement."""
    UPI = "UPI"
    IMPS = "IMPS"
    RAZORPAY_SANDBOX = "RAZORPAY_SANDBOX"


# ─────────────────────────────────────────────────────────────────────
# GPS & FRAUD DETECTION MODELS
# ─────────────────────────────────────────────────────────────────────

class GPSPing(BaseModel):
    """
    A single GPS coordinate ping from the worker's device.
    Used by the POP Validator for impossible-jump detection.
    """
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    timestamp: datetime = Field(..., description="UTC timestamp of the GPS reading")


class PlatformSignal(BaseModel):
    """
    Cross-check data from the delivery platform (Zomato/Swiggy/Zepto).
    Used to verify the worker was genuinely active during the disruption.
    """
    login_timestamp: datetime = Field(..., description="When the worker logged into the platform")
    logout_timestamp: Optional[datetime] = Field(None, description="When the worker logged out")
    active_orders_during_disruption: int = Field(0, ge=0, description="Orders accepted during event window")
    deliveries_completed: int = Field(0, ge=0, description="Deliveries completed in the period")
    platform_name: str = Field(..., description="Platform identifier (e.g., 'ZOMATO', 'SWIGGY', 'ZEPTO')")


class FraudVerdict(BaseModel):
    """
    Output of the POP Validator — detailed fraud assessment with evidence.
    """
    is_fraudulent: bool = Field(..., description="True if any fraud signal was detected")
    fraud_type: Optional[str] = Field(None, description="Type of fraud detected (e.g., 'IMPOSSIBLE_JUMP', 'SIGNAL_MISMATCH')")
    confidence_score: float = Field(0.0, ge=0.0, le=1.0, description="Fraud confidence (0 = clean, 1 = definite fraud)")
    evidence: List[str] = Field(default_factory=list, description="Human-readable evidence chain for audit")
    max_velocity_kmh: Optional[float] = Field(None, description="Highest velocity detected between pings")
    flagged_ping_indices: List[int] = Field(default_factory=list, description="Indices of suspicious GPS pings")


# ─────────────────────────────────────────────────────────────────────
# TRIGGER & CLAIM MODELS
# ─────────────────────────────────────────────────────────────────────

class TriggerEvent(BaseModel):
    """
    Parametric trigger from an external oracle (IMD weather API / CPCB AQI API).
    The system only 'wakes up' if thresholds are crossed.
    """
    trigger_type: TriggerType
    value: float = Field(..., description="Measured value (mm rainfall or AQI index)")
    ward_id: str = Field(..., description="Ward-level geographic identifier")
    city: str = Field(..., description="City name for context")
    timestamp: datetime = Field(..., description="When the event was recorded")
    source: str = Field(default="IMD_ORACLE", description="Data source identifier")

    @field_validator("value")
    @classmethod
    def validate_threshold(cls, v, info):
        """Ensure trigger value actually exceeds activation thresholds."""
        # Validation happens at ingestion — we log sub-threshold events but don't process them
        if v <= 0:
            raise ValueError("Trigger value must be positive")
        return v

    def exceeds_threshold(self) -> bool:
        """Check if this event crosses the parametric trigger threshold."""
        if self.trigger_type == TriggerType.RAINFALL:
            return self.value > 60.0   # > 60mm rainfall
        elif self.trigger_type == TriggerType.AQI:
            return self.value > 300    # > 300 AQI
        return False

    def severity_tier(self) -> int:
        """
        Calculate severity tier (1-3) for graduated payouts.
        Tier 1: Just above threshold (~30% payout)
        Tier 2: Moderate (~60% payout)
        Tier 3: Severe (~100% payout)
        """
        if self.trigger_type == TriggerType.RAINFALL:
            if self.value > 120.0:
                return 3
            elif self.value > 90.0:
                return 2
            return 1
        elif self.trigger_type == TriggerType.AQI:
            if self.value > 450:
                return 3
            elif self.value > 375:
                return 2
            return 1
        return 1


class ClaimRecord(BaseModel):
    """
    Full lifecycle model for a parametric insurance claim.
    Tracks state machine progression from DETECTED → PAID.
    """
    claim_id: str = Field(..., description="Unique claim identifier")
    policy_id: str = Field(..., description="Associated policy ID")
    worker_id: str = Field(..., description="Worker who is covered")
    trigger_event: TriggerEvent
    state: ClaimState = Field(default=ClaimState.DETECTED)
    gps_trail: List[GPSPing] = Field(default_factory=list)
    platform_signal: Optional[PlatformSignal] = None
    fraud_verdict: Optional[FraudVerdict] = None
    payout_amount: Optional[float] = Field(None, ge=0, description="Calculated payout in ₹")
    payout_transaction_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    state_history: List[str] = Field(default_factory=list, description="Audit trail of state transitions")

    def advance_state(self, new_state: ClaimState, reason: str = "") -> None:
        """Advance the claim through the zero-touch state machine."""
        valid_transitions = {
            ClaimState.DETECTED: [ClaimState.VALIDATING],
            ClaimState.VALIDATING: [ClaimState.APPROVED, ClaimState.FRAUD_BLOCKED],
            ClaimState.APPROVED: [ClaimState.PAID],
            ClaimState.PAID: [],           # Terminal
            ClaimState.FRAUD_BLOCKED: [],  # Terminal
        }

        if new_state not in valid_transitions.get(self.state, []):
            raise ValueError(
                f"Invalid state transition: {self.state.value} → {new_state.value}. "
                f"Allowed: {[s.value for s in valid_transitions.get(self.state, [])]}"
            )

        entry = f"{self.state.value} → {new_state.value} at {datetime.utcnow().isoformat()}"
        if reason:
            entry += f" | {reason}"
        self.state_history.append(entry)
        self.state = new_state
        self.updated_at = datetime.utcnow()


# ─────────────────────────────────────────────────────────────────────
# POLICY & ENROLLMENT MODELS
# ─────────────────────────────────────────────────────────────────────

class PolicyEnrollRequest(BaseModel):
    """Request to enroll a gig worker in KavachSathi coverage."""
    worker_id: str = Field(..., description="Unique worker identifier")
    worker_name: str = Field(..., description="Worker's full name")
    persona: WorkerPersona = Field(default=WorkerPersona.FOOD_DELIVERY)
    billing_cycle: BillingCycle = Field(default=BillingCycle.WEEKLY)
    area_category: AreaCategory
    ward_id: str = Field(..., description="Ward-level location for trigger matching")
    city: str = Field(..., description="City of operation")
    platform_name: str = Field(..., description="Delivery platform (ZOMATO/SWIGGY/ZEPTO)")
    upi_id: Optional[str] = Field(None, description="UPI ID for instant payouts")


class PolicyRecord(BaseModel):
    """Active insurance policy for a gig worker."""
    policy_id: str
    worker_id: str
    worker_name: str
    persona: WorkerPersona = WorkerPersona.FOOD_DELIVERY
    billing_cycle: BillingCycle = BillingCycle.WEEKLY
    area_category: AreaCategory
    ward_id: str
    city: str
    platform_name: str
    upi_id: Optional[str] = None
    weekly_premium: float = Field(..., ge=20.0, le=50.0, description="Weekly premium in ₹ (capped ₹20-₹50)")
    is_active: bool = True
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────
# PRICING MODELS
# ─────────────────────────────────────────────────────────────────────

class PremiumRequest(BaseModel):
    """Input for the actuarial pricing engine."""
    persona: WorkerPersona = Field(default=WorkerPersona.FOOD_DELIVERY)
    billing_cycle: BillingCycle = Field(default=BillingCycle.WEEKLY)
    area_category: AreaCategory
    ward_id: str = Field(..., description="Ward for regional risk lookup")
    city: str = Field(default="Delhi")
    temp: Optional[float] = Field(default=30.0, description="Local temperature in Celsius")
    aqi: Optional[float] = Field(default=100.0, description="Local Air Quality Index")
    traffic: Optional[float] = Field(default=5.0, description="Traffic congestion index")

    @field_validator("persona")
    @classmethod
    def lock_persona(cls, v):
        if v != WorkerPersona.FOOD_DELIVERY:
            raise ValueError("KavachSathi only covers FOOD_DELIVERY workers.")
        return v

    @field_validator("billing_cycle")
    @classmethod
    def lock_weekly(cls, v):
        if v != BillingCycle.WEEKLY:
            raise ValueError("Only WEEKLY billing cycle is supported.")
        return v


class PremiumResponse(BaseModel):
    """Output from the actuarial pricing engine."""
    weekly_premium: float = Field(..., ge=20.0, le=50.0)
    p_trigger: float = Field(..., description="Probability of trigger event in the ward")
    l_avg: float = Field(..., description="Average income loss per event (₹)")
    d_exposed: float = Field(..., description="Expected exposed days per event")
    risk_multiplier: float = Field(default=1.0, description="Regional risk adjustment")
    formula_breakdown: str = Field(..., description="Human-readable premium calculation")
    cap_applied: bool = Field(default=False, description="True if premium was capped to bounds")


# ─────────────────────────────────────────────────────────────────────
# SETTLEMENT / PAYOUT MODELS
# ─────────────────────────────────────────────────────────────────────

class PayoutResult(BaseModel):
    """Result of a mock Razorpay sandbox settlement."""
    transaction_id: str = Field(..., description="Mock Razorpay transaction reference")
    amount: float = Field(..., ge=0, description="Payout amount in ₹")
    currency: str = Field(default="INR")
    channel: PayoutChannel = Field(default=PayoutChannel.UPI)
    upi_reference: Optional[str] = None
    status: str = Field(default="PROCESSED", description="Settlement status")
    settled_at: datetime = Field(default_factory=datetime.utcnow)
    worker_id: str
    claim_id: str
    rollback_eligible: bool = Field(default=True, description="Can this payout be reversed?")


# ─────────────────────────────────────────────────────────────────────
# PLATFORM HEALTH MODELS
# ─────────────────────────────────────────────────────────────────────

class PlatformHealth(BaseModel):
    """Dashboard model for platform solvency monitoring."""
    total_premium_collected: float = Field(default=0.0, ge=0)
    total_payout_disbursed: float = Field(default=0.0, ge=0)
    loss_ratio: float = Field(default=0.0, ge=0, description="Total Payout ÷ Total Premium")
    circuit_breaker_active: bool = Field(default=False, description="True if loss ratio ≥ 85%")
    total_policies_active: int = Field(default=0, ge=0)
    total_claims_processed: int = Field(default=0, ge=0)
    total_fraud_blocked: int = Field(default=0, ge=0)
