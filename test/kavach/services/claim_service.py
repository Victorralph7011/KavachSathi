"""
KavachSathi — POP Validator & Fraud Detection Service
======================================================

Proof-of-Presence (POP) validation using adversarial GPS analysis.

Defense Layers:
  1. Impossible Jump Detection — Haversine velocity check (>100 km/h = FRAUD)
  2. GPS Trail Continuity     — Validates entire trail, not just two points
  3. Signal Cross-Check       — Login ↔ GPS ↔ Active Orders consistency
  4. Disruption Window Match  — Worker must be active DURING the trigger event

Why this matters:
  Traditional insurance relies on human claims adjusters.
  Parametric insurance has NO human review — so fraud detection
  must be automated, rigorous, and adversarial-proof.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from haversine import haversine, Unit
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from models import (
    GPSPing,
    PlatformSignal,
    FraudVerdict,
    ClaimRecord,
    ClaimState,
    TriggerEvent,
)


# ─────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────

MAX_VELOCITY_KMH: float = 100.0          # Impossible jump threshold
MAX_LOGIN_GPS_DRIFT_MINUTES: float = 120.0  # Max time between login and GPS activity
MIN_GPS_PINGS_REQUIRED: int = 3           # Minimum pings for a valid trail
DISRUPTION_WINDOW_HOURS: float = 6.0      # Event must overlap with worker activity


# ─────────────────────────────────────────────────────────────────────
# LAYER 1: IMPOSSIBLE JUMP DETECTION (Haversine)
# ─────────────────────────────────────────────────────────────────────

def calculate_velocity(
    ping_a: GPSPing,
    ping_b: GPSPing,
) -> float:
    """
    Calculate velocity between two GPS pings using the Haversine formula.
    
    The Haversine formula computes great-circle distance between two points
    on a sphere given their latitudes and longitudes. This gives us the
    shortest distance over the earth's surface — ignoring terrain.
    
    Args:
        ping_a: First GPS reading (earlier timestamp)
        ping_b: Second GPS reading (later timestamp)
    
    Returns:
        float: Velocity in km/h. Returns float('inf') if time delta is zero.
    """
    distance_km = haversine(
        (ping_a.latitude, ping_a.longitude),
        (ping_b.latitude, ping_b.longitude),
        unit=Unit.KILOMETERS,
    )

    time_diff_seconds = (ping_b.timestamp - ping_a.timestamp).total_seconds()

    if time_diff_seconds <= 0:
        # Same timestamp or backwards = suspicious
        return float("inf") if distance_km > 0 else 0.0

    time_diff_hours = time_diff_seconds / 3600.0
    return distance_km / time_diff_hours


def is_impossible_jump(
    last_lat: float,
    last_lon: float,
    last_timestamp: datetime,
    current_lat: float,
    current_lon: float,
    current_timestamp: datetime,
) -> bool:
    """
    Legacy API: Check if movement between two points implies impossible velocity.
    
    A food delivery worker on a bicycle/scooter cannot exceed 100 km/h.
    If the GPS data implies they did, it's either:
      (a) GPS spoofing — fraud
      (b) Device handoff — different person using the account
    
    Returns:
        bool: True if velocity > 100 km/h (FRAUD), False if plausible
    """
    if last_timestamp >= current_timestamp:
        return True  # Time going backwards = tampering

    ping_a = GPSPing(latitude=last_lat, longitude=last_lon, timestamp=last_timestamp)
    ping_b = GPSPing(latitude=current_lat, longitude=current_lon, timestamp=current_timestamp)

    velocity = calculate_velocity(ping_a, ping_b)
    return velocity > MAX_VELOCITY_KMH


# ─────────────────────────────────────────────────────────────────────
# LAYER 2: GPS TRAIL VALIDATION
# ─────────────────────────────────────────────────────────────────────

def validate_gps_trail(
    gps_trail: List[GPSPing],
) -> Tuple[bool, List[int], float]:
    """
    Validate an entire GPS trail for impossible jumps.
    
    Unlike checking just two points, this examines every consecutive pair
    in the trail. A single impossible jump flags the entire trail.
    
    Args:
        gps_trail: Chronologically ordered list of GPS pings
    
    Returns:
        Tuple of:
          - is_valid (bool): True if trail is clean
          - flagged_indices (list): Indices of suspicious ping pairs
          - max_velocity (float): Highest velocity detected
    """
    if len(gps_trail) < MIN_GPS_PINGS_REQUIRED:
        # Not enough data points for reliable validation
        return False, [], 0.0

    # Sort by timestamp to ensure chronological order
    sorted_trail = sorted(gps_trail, key=lambda p: p.timestamp)

    flagged_indices: List[int] = []
    max_velocity: float = 0.0

    for i in range(len(sorted_trail) - 1):
        velocity = calculate_velocity(sorted_trail[i], sorted_trail[i + 1])

        if velocity > max_velocity:
            max_velocity = velocity

        if velocity > MAX_VELOCITY_KMH:
            flagged_indices.append(i)
            flagged_indices.append(i + 1)

    # Deduplicate flagged indices
    flagged_indices = sorted(set(flagged_indices))

    is_valid = len(flagged_indices) == 0
    return is_valid, flagged_indices, max_velocity


# ─────────────────────────────────────────────────────────────────────
# LAYER 3: PLATFORM SIGNAL CROSS-CHECK
# ─────────────────────────────────────────────────────────────────────

def check_signal_consistency(
    login_timestamp: datetime,
    gps_start_timestamp: datetime,
) -> bool:
    """
    Legacy API: Basic login ↔ GPS timestamp consistency check.
    
    Returns:
        bool: True if timestamps are within acceptable drift window
    """
    diff_minutes = abs((gps_start_timestamp - login_timestamp).total_seconds()) / 60.0
    return diff_minutes <= MAX_LOGIN_GPS_DRIFT_MINUTES


def cross_check_platform_signals(
    platform_signal: PlatformSignal,
    gps_trail: List[GPSPing],
    trigger_event: TriggerEvent,
) -> Tuple[bool, List[str]]:
    """
    Enhanced signal cross-check: validates that the worker was genuinely
    active on the delivery platform during the disruption period.
    
    Checks:
      1. Login timestamp vs GPS trail start — must be within drift window
      2. Active orders — worker must have had orders during disruption
      3. Disruption window overlap — trigger event must overlap worker's active period
    
    Args:
        platform_signal: Data from delivery platform API
        gps_trail: Worker's GPS trail during the period
        trigger_event: The parametric trigger that fired
    
    Returns:
        Tuple of:
          - is_consistent (bool): True if all checks pass
          - issues (list): Human-readable description of any inconsistencies
    """
    issues: List[str] = []

    if not gps_trail:
        issues.append("NO_GPS_DATA: No GPS trail provided for cross-check.")
        return False, issues

    # Sort GPS trail chronologically
    sorted_trail = sorted(gps_trail, key=lambda p: p.timestamp)
    gps_start = sorted_trail[0].timestamp
    gps_end = sorted_trail[-1].timestamp

    # Check 1: Login ↔ GPS drift
    login_drift_minutes = abs(
        (gps_start - platform_signal.login_timestamp).total_seconds()
    ) / 60.0

    if login_drift_minutes > MAX_LOGIN_GPS_DRIFT_MINUTES:
        issues.append(
            f"LOGIN_GPS_DRIFT: {login_drift_minutes:.0f}min gap between "
            f"platform login and first GPS ping (max: {MAX_LOGIN_GPS_DRIFT_MINUTES}min)."
        )

    # Check 2: Active orders during disruption
    if platform_signal.active_orders_during_disruption == 0:
        issues.append(
            "NO_ACTIVE_ORDERS: Worker had zero active orders during "
            "the disruption window. Cannot confirm income loss."
        )

    # Check 3: Disruption window overlap
    # The trigger event timestamp should fall within the worker's active GPS window
    disruption_start = trigger_event.timestamp - timedelta(hours=DISRUPTION_WINDOW_HOURS / 2)
    disruption_end = trigger_event.timestamp + timedelta(hours=DISRUPTION_WINDOW_HOURS / 2)

    worker_was_active_during_event = (
        gps_start <= disruption_end and gps_end >= disruption_start
    )

    if not worker_was_active_during_event:
        issues.append(
            f"NO_OVERLAP: Worker GPS activity ({gps_start.isoformat()} - {gps_end.isoformat()}) "
            f"does not overlap with disruption window "
            f"({disruption_start.isoformat()} - {disruption_end.isoformat()})."
        )

    is_consistent = len(issues) == 0
    return is_consistent, issues


# ─────────────────────────────────────────────────────────────────────
# ORCHESTRATOR: FULL POP VALIDATION
# ─────────────────────────────────────────────────────────────────────

def full_pop_validation(
    gps_trail: List[GPSPing],
    platform_signal: Optional[PlatformSignal],
    trigger_event: TriggerEvent,
) -> FraudVerdict:
    """
    Master fraud detection orchestrator.
    
    Runs all validation layers in sequence and produces a consolidated
    FraudVerdict with evidence chain for audit purposes.
    
    Pipeline:
      1. GPS Trail completeness check
      2. Impossible Jump detection (Haversine)
      3. Platform Signal cross-check (if signal available)
      4. Consolidated scoring
    
    Args:
        gps_trail: Worker's GPS pings during the period
        platform_signal: Delivery platform activity data (optional)
        trigger_event: The parametric trigger that fired
    
    Returns:
        FraudVerdict: Complete fraud assessment with evidence
    """
    evidence: List[str] = []
    is_fraudulent = False
    fraud_type = None
    confidence = 0.0
    max_velocity = 0.0
    flagged_indices: List[int] = []

    # ── Layer 1: GPS Trail Validation ──
    if len(gps_trail) < MIN_GPS_PINGS_REQUIRED:
        evidence.append(
            f"INSUFFICIENT_DATA: Only {len(gps_trail)} GPS pings provided "
            f"(minimum: {MIN_GPS_PINGS_REQUIRED}). Cannot validate presence."
        )
        # Not automatically fraud, but suspicious
        confidence += 0.3
    else:
        trail_valid, trail_flags, trail_max_v = validate_gps_trail(gps_trail)
        max_velocity = trail_max_v
        flagged_indices = trail_flags

        if not trail_valid:
            is_fraudulent = True
            fraud_type = "IMPOSSIBLE_JUMP"
            confidence = max(confidence, 0.95)
            evidence.append(
                f"IMPOSSIBLE_JUMP: Max velocity {trail_max_v:.1f} km/h detected "
                f"(threshold: {MAX_VELOCITY_KMH} km/h). "
                f"Flagged ping pairs: {trail_flags}. "
                f"This indicates GPS spoofing or device handoff."
            )
        else:
            evidence.append(
                f"GPS_TRAIL_CLEAN: {len(gps_trail)} pings validated. "
                f"Max velocity: {trail_max_v:.1f} km/h (within limits)."
            )

    # ── Layer 2: Platform Signal Cross-Check ──
    if platform_signal is not None:
        signal_ok, signal_issues = cross_check_platform_signals(
            platform_signal, gps_trail, trigger_event
        )

        if not signal_ok:
            if not is_fraudulent:
                fraud_type = "SIGNAL_MISMATCH"
            is_fraudulent = True
            confidence = max(confidence, 0.80)
            for issue in signal_issues:
                evidence.append(issue)
        else:
            evidence.append(
                f"SIGNAL_CONSISTENT: Platform login, GPS trail, and disruption "
                f"window are consistent for {platform_signal.platform_name}."
            )
    else:
        evidence.append(
            "NO_PLATFORM_SIGNAL: Platform verification data not provided. "
            "Relying on GPS-only validation."
        )
        confidence = max(confidence, 0.2)  # Slight uncertainty without platform data

    # ── Final verdict ──
    if not is_fraudulent:
        confidence = max(0.0, 1.0 - confidence)  # Invert — high = more fraudulent
        confidence = 0.0  # Clean

    return FraudVerdict(
        is_fraudulent=is_fraudulent,
        fraud_type=fraud_type,
        confidence_score=round(confidence, 2),
        evidence=evidence,
        max_velocity_kmh=round(max_velocity, 2),
        flagged_ping_indices=flagged_indices,
    )
