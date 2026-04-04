"""
KavachSathi — Comprehensive Stress Test Suite
===============================================

7-part verification suite proving every safety rail and actuarial 
component works under adversarial conditions.

Run:
  cd test/kavach
  python -m pytest tests/test_stress.py -v

Tests:
  1. Premium Bounds       — ₹20-₹50 cap with 1000 random inputs
  2. Fraud Detection      — Teleporting GPS pings at 500 km/h
  3. Circuit Breaker      — Push loss ratio past 85% → verify 503
  4. Weekly Enforcement   — Attempt monthly/yearly billing
  5. Persona Lock         — Attempt non-food-delivery enrollment
  6. Zero-Touch Pipeline  — Full trigger → payout flow
  7. Geographical Fairness — Urban vs Rural payout verification
"""

import sys
import os
import random
import uuid

# Ensure imports work from test directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from datetime import datetime, timedelta
from fastapi import HTTPException

from models import (
    WorkerPersona,
    BillingCycle,
    AreaCategory,
    TriggerType,
    ClaimState,
    GPSPing,
    PlatformSignal,
    TriggerEvent,
    PremiumRequest,
)
from ml.premium_engine import (
    calculate_premium,
    enforce_weekly_cycle,
    enforce_persona,
    PREMIUM_FLOOR,
    PREMIUM_CEILING,
    get_trigger_probability,
    batch_quote,
)
from services.claim_service import (
    is_impossible_jump,
    validate_gps_trail,
    full_pop_validation,
    check_signal_consistency,
)
from services.policy_service import (
    emergency_stop_check,
    get_payout_criteria,
    calculate_payout_amount,
    update_platform_stats,
    get_platform_health,
    reset_platform_stats,
    platform_stats,
    CIRCUIT_BREAKER_THRESHOLD,
)
from services.settlement_service import initiate_payout, rollback_payout


# ═══════════════════════════════════════════════════════════════════════
# TEST 1: PREMIUM BOUNDS — ₹20-₹50 Cap Enforcement
# ═══════════════════════════════════════════════════════════════════════

class TestPremiumBounds:
    """Verify that no matter what inputs are provided, premium stays ₹20-₹50."""

    def test_premium_always_within_bounds_random(self):
        """Fuzz test: 1000 random ward/city combinations must stay in bounds."""
        wards = [
            "DELHI_CENTRAL", "DELHI_SOUTH", "DELHI_EAST", "DELHI_NORTH",
            "MUMBAI_WESTERN", "MUMBAI_EASTERN", "MUMBAI_HARBOUR",
            "BANGALORE_CENTRAL", "UNKNOWN_WARD_XYZ", "RURAL_NOWHERE",
        ]
        cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "UnknownCity"]
        areas = [AreaCategory.URBAN, AreaCategory.RURAL]

        for _ in range(1000):
            ward = random.choice(wards)
            city = random.choice(cities)
            area = random.choice(areas)

            result = calculate_premium(
                persona=WorkerPersona.FOOD_DELIVERY,
                area_category=area,
                ward_id=ward,
                city=city,
                billing_cycle=BillingCycle.WEEKLY,
            )

            assert result.weekly_premium >= PREMIUM_FLOOR, (
                f"Premium ₹{result.weekly_premium} is below floor ₹{PREMIUM_FLOOR}"
            )
            assert result.weekly_premium <= PREMIUM_CEILING, (
                f"Premium ₹{result.weekly_premium} exceeds ceiling ₹{PREMIUM_CEILING}"
            )

    def test_premium_urban_delhi(self):
        """Specific test for Delhi urban pricing."""
        result = calculate_premium(
            persona=WorkerPersona.FOOD_DELIVERY,
            area_category=AreaCategory.URBAN,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
        )
        assert PREMIUM_FLOOR <= result.weekly_premium <= PREMIUM_CEILING
        assert result.p_trigger > 0
        assert result.l_avg > 0
        assert result.d_exposed > 0
        assert "₹" in result.formula_breakdown

    def test_premium_rural_mumbai(self):
        """Rural premium should also be within bounds."""
        result = calculate_premium(
            persona=WorkerPersona.FOOD_DELIVERY,
            area_category=AreaCategory.RURAL,
            ward_id="MUMBAI_HARBOUR",
            city="Mumbai",
        )
        assert PREMIUM_FLOOR <= result.weekly_premium <= PREMIUM_CEILING

    def test_batch_quote(self):
        """Batch pricing should return valid results for all wards."""
        wards = ["DELHI_CENTRAL", "MUMBAI_WESTERN", "BANGALORE_EAST"]
        results = batch_quote(wards, AreaCategory.URBAN, "Delhi")
        assert len(results) == 3
        for r in results:
            assert PREMIUM_FLOOR <= r.weekly_premium <= PREMIUM_CEILING


# ═══════════════════════════════════════════════════════════════════════
# TEST 2: FRAUD DETECTION — Impossible Jump Detection
# ═══════════════════════════════════════════════════════════════════════

class TestFraudDetection:
    """Test the POP Validator's Haversine-based impossible jump detection."""

    def test_teleportation_detected(self):
        """GPS pings 500km apart in 10 minutes = FRAUD (~3000 km/h)."""
        result = is_impossible_jump(
            last_lat=28.6139,    # Delhi
            last_lon=77.2090,
            last_timestamp=datetime(2026, 4, 1, 10, 0, 0),
            current_lat=19.0760,  # Mumbai
            current_lon=72.8777,
            current_timestamp=datetime(2026, 4, 1, 10, 10, 0),  # 10 min later
        )
        assert result is True, "Teleportation from Delhi to Mumbai in 10 min should be flagged as fraud"

    def test_normal_movement_accepted(self):
        """GPS pings 2km apart in 30 minutes = normal scooter speed (~4 km/h)."""
        result = is_impossible_jump(
            last_lat=28.6139,
            last_lon=77.2090,
            last_timestamp=datetime(2026, 4, 1, 10, 0, 0),
            current_lat=28.6200,
            current_lon=77.2150,
            current_timestamp=datetime(2026, 4, 1, 10, 30, 0),
        )
        assert result is False, "Normal scooter movement should pass"

    def test_time_travel_blocked(self):
        """Timestamps going backwards = tampering."""
        result = is_impossible_jump(
            last_lat=28.6139,
            last_lon=77.2090,
            last_timestamp=datetime(2026, 4, 1, 10, 30, 0),
            current_lat=28.6200,
            current_lon=77.2150,
            current_timestamp=datetime(2026, 4, 1, 10, 0, 0),  # BEFORE the last ping
        )
        assert result is True, "Backwards timestamps should be flagged"

    def test_gps_trail_with_impossible_jump(self):
        """Full trail validation with one impossible jump buried in the middle."""
        trail = [
            GPSPing(latitude=28.6139, longitude=77.2090, timestamp=datetime(2026, 4, 1, 10, 0)),
            GPSPing(latitude=28.6145, longitude=77.2095, timestamp=datetime(2026, 4, 1, 10, 5)),
            GPSPing(latitude=28.6150, longitude=77.2100, timestamp=datetime(2026, 4, 1, 10, 10)),
            # Impossible jump — teleport to Mumbai
            GPSPing(latitude=19.0760, longitude=72.8777, timestamp=datetime(2026, 4, 1, 10, 15)),
            GPSPing(latitude=19.0765, longitude=72.8780, timestamp=datetime(2026, 4, 1, 10, 20)),
        ]
        is_valid, flagged, max_v = validate_gps_trail(trail)
        assert is_valid is False, "Trail with teleportation should fail validation"
        assert len(flagged) > 0, "Flagged indices should be non-empty"
        assert max_v > 100.0, "Max velocity should exceed 100 km/h"

    def test_clean_gps_trail(self):
        """Legitimate delivery route should pass."""
        trail = [
            GPSPing(latitude=28.6139, longitude=77.2090, timestamp=datetime(2026, 4, 1, 10, 0)),
            GPSPing(latitude=28.6142, longitude=77.2093, timestamp=datetime(2026, 4, 1, 10, 5)),
            GPSPing(latitude=28.6145, longitude=77.2095, timestamp=datetime(2026, 4, 1, 10, 10)),
            GPSPing(latitude=28.6148, longitude=77.2098, timestamp=datetime(2026, 4, 1, 10, 15)),
        ]
        is_valid, flagged, max_v = validate_gps_trail(trail)
        assert is_valid is True, "Clean trail should pass"
        assert len(flagged) == 0
        assert max_v < 100.0

    def test_full_pop_validation_fraud(self):
        """Full POP validation should catch fraud and produce evidence."""
        trail = [
            GPSPing(latitude=28.6139, longitude=77.2090, timestamp=datetime(2026, 4, 1, 10, 0)),
            GPSPing(latitude=28.6145, longitude=77.2095, timestamp=datetime(2026, 4, 1, 10, 5)),
            GPSPing(latitude=28.6150, longitude=77.2100, timestamp=datetime(2026, 4, 1, 10, 10)),
            GPSPing(latitude=19.0760, longitude=72.8777, timestamp=datetime(2026, 4, 1, 10, 15)),  # Teleport
        ]
        trigger = TriggerEvent(
            trigger_type=TriggerType.RAINFALL,
            value=80.0,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime(2026, 4, 1, 10, 0),
        )
        verdict = full_pop_validation(trail, None, trigger)
        assert verdict.is_fraudulent is True
        assert verdict.fraud_type == "IMPOSSIBLE_JUMP"
        assert verdict.confidence_score >= 0.9
        assert len(verdict.evidence) > 0

    def test_full_pop_validation_clean(self):
        """Clean GPS + consistent platform signal should pass."""
        trail = [
            GPSPing(latitude=28.6139, longitude=77.2090, timestamp=datetime(2026, 4, 1, 10, 0)),
            GPSPing(latitude=28.6142, longitude=77.2093, timestamp=datetime(2026, 4, 1, 10, 5)),
            GPSPing(latitude=28.6145, longitude=77.2095, timestamp=datetime(2026, 4, 1, 10, 10)),
            GPSPing(latitude=28.6148, longitude=77.2098, timestamp=datetime(2026, 4, 1, 10, 15)),
        ]
        signal = PlatformSignal(
            login_timestamp=datetime(2026, 4, 1, 9, 55),
            active_orders_during_disruption=3,
            deliveries_completed=2,
            platform_name="ZOMATO",
        )
        trigger = TriggerEvent(
            trigger_type=TriggerType.AQI,
            value=380.0,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime(2026, 4, 1, 10, 5),
        )
        verdict = full_pop_validation(trail, signal, trigger)
        assert verdict.is_fraudulent is False
        assert verdict.confidence_score == 0.0
        assert "GPS_TRAIL_CLEAN" in str(verdict.evidence)


# ═══════════════════════════════════════════════════════════════════════
# TEST 3: CIRCUIT BREAKER — 85% Loss Ratio Emergency Stop
# ═══════════════════════════════════════════════════════════════════════

class TestCircuitBreaker:
    """Verify the Emergency Stop triggers at 85% loss ratio."""

    def setup_method(self):
        """Reset stats before each test."""
        reset_platform_stats()

    def test_circuit_breaker_triggers_at_85_percent(self):
        """When loss ratio hits 85%, enrollment should throw HTTP 503."""
        # Simulate: ₹1000 premium collected, ₹850 paid out = 85% loss ratio
        update_platform_stats(premium_collected=1000.0)
        update_platform_stats(payout_disbursed=850.0)

        with pytest.raises(HTTPException) as exc_info:
            emergency_stop_check()
        assert exc_info.value.status_code == 503

    def test_circuit_breaker_above_85(self):
        """90% loss ratio should also trigger."""
        update_platform_stats(premium_collected=1000.0)
        update_platform_stats(payout_disbursed=900.0)

        with pytest.raises(HTTPException) as exc_info:
            emergency_stop_check()
        assert exc_info.value.status_code == 503

    def test_circuit_breaker_below_85(self):
        """80% loss ratio should NOT trigger."""
        update_platform_stats(premium_collected=1000.0)
        update_platform_stats(payout_disbursed=800.0)

        # Should not raise
        emergency_stop_check()

    def test_circuit_breaker_no_premiums(self):
        """With zero premiums, should not trigger (allow initial enrollment)."""
        emergency_stop_check()  # Should not raise

    def test_platform_health_reflects_breaker(self):
        """Health dashboard should show circuit breaker status."""
        update_platform_stats(premium_collected=1000.0)
        update_platform_stats(payout_disbursed=900.0)

        health = get_platform_health()
        assert health.circuit_breaker_active is True
        assert health.loss_ratio >= 0.85


# ═══════════════════════════════════════════════════════════════════════
# TEST 4: WEEKLY-ONLY ENFORCEMENT
# ═══════════════════════════════════════════════════════════════════════

class TestWeeklyEnforcement:
    """Verify that monthly and yearly billing cycles are rejected."""

    def test_monthly_rejected(self):
        """Monthly billing must be rejected."""
        with pytest.raises(ValueError, match="WEEKLY"):
            enforce_weekly_cycle("MONTHLY")

    def test_yearly_rejected(self):
        """Yearly billing must be rejected."""
        with pytest.raises(ValueError, match="WEEKLY"):
            enforce_weekly_cycle("YEARLY")

    def test_daily_rejected(self):
        """Daily billing must be rejected."""
        with pytest.raises(ValueError, match="WEEKLY"):
            enforce_weekly_cycle("DAILY")

    def test_weekly_accepted(self):
        """Weekly billing should pass."""
        enforce_weekly_cycle("WEEKLY")  # Should not raise

    def test_weekly_case_insensitive(self):
        """Case shouldn't matter for weekly."""
        enforce_weekly_cycle("weekly")   # Lower case
        enforce_weekly_cycle("Weekly")   # Mixed case


# ═══════════════════════════════════════════════════════════════════════
# TEST 5: PERSONA LOCK — FOOD_DELIVERY Only
# ═══════════════════════════════════════════════════════════════════════

class TestPersonaLock:
    """Verify that non-food-delivery personas are rejected."""

    def test_ride_hailing_rejected(self):
        """Uber/Ola drivers should be rejected."""
        with pytest.raises(ValueError, match="FOOD_DELIVERY"):
            enforce_persona("RIDE_HAILING")

    def test_generic_rejected(self):
        """Generic gig workers should be rejected."""
        with pytest.raises(ValueError, match="FOOD_DELIVERY"):
            enforce_persona("GENERIC")

    def test_other_rejected(self):
        """'OTHER' persona must not exist."""
        with pytest.raises(ValueError, match="FOOD_DELIVERY"):
            enforce_persona("OTHER")

    def test_food_delivery_accepted(self):
        """FOOD_DELIVERY should pass cleanly."""
        enforce_persona("FOOD_DELIVERY")  # Should not raise

    def test_enum_has_only_food_delivery(self):
        """The enum itself should only contain FOOD_DELIVERY."""
        members = list(WorkerPersona)
        assert len(members) == 1
        assert members[0] == WorkerPersona.FOOD_DELIVERY


# ═══════════════════════════════════════════════════════════════════════
# TEST 6: ZERO-TOUCH PIPELINE — End-to-End Flow
# ═══════════════════════════════════════════════════════════════════════

class TestZeroTouchPipeline:
    """Test the full trigger → validate → approve → pay pipeline."""

    def setup_method(self):
        reset_platform_stats()

    def test_trigger_threshold_rainfall(self):
        """Rainfall > 60mm should exceed threshold."""
        trigger = TriggerEvent(
            trigger_type=TriggerType.RAINFALL,
            value=75.0,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime.utcnow(),
        )
        assert trigger.exceeds_threshold() is True

    def test_trigger_below_threshold(self):
        """Rainfall ≤ 60mm should NOT trigger."""
        trigger = TriggerEvent(
            trigger_type=TriggerType.RAINFALL,
            value=45.0,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime.utcnow(),
        )
        assert trigger.exceeds_threshold() is False

    def test_trigger_threshold_aqi(self):
        """AQI > 300 should exceed threshold."""
        trigger = TriggerEvent(
            trigger_type=TriggerType.AQI,
            value=380.0,
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime.utcnow(),
        )
        assert trigger.exceeds_threshold() is True

    def test_severity_tiers(self):
        """Verify severity tier calculation."""
        # Rainfall tiers
        t1 = TriggerEvent(trigger_type=TriggerType.RAINFALL, value=65.0,
                          ward_id="X", city="Y", timestamp=datetime.utcnow())
        t2 = TriggerEvent(trigger_type=TriggerType.RAINFALL, value=100.0,
                          ward_id="X", city="Y", timestamp=datetime.utcnow())
        t3 = TriggerEvent(trigger_type=TriggerType.RAINFALL, value=150.0,
                          ward_id="X", city="Y", timestamp=datetime.utcnow())

        assert t1.severity_tier() == 1  # Just above threshold
        assert t2.severity_tier() == 2  # Moderate
        assert t3.severity_tier() == 3  # Severe

    def test_settlement_produces_transaction(self):
        """Mock Razorpay should produce a valid transaction ID."""
        result = initiate_payout(
            worker_id="W001",
            claim_id="CLM001",
            amount=500.0,
            upi_id="worker@upi",
        )
        assert result.transaction_id.startswith("pay_KS")
        assert result.amount == 500.0
        assert result.status == "PROCESSED"
        assert result.currency == "INR"

    def test_rollback_produces_reference(self):
        """Rollback should produce a valid reference."""
        result = rollback_payout("pay_KS12345", "Test rollback")
        assert result["status"] == "ROLLED_BACK"
        assert result["rollback_id"].startswith("rb_")


# ═══════════════════════════════════════════════════════════════════════
# TEST 7: GEOGRAPHICAL FAIRNESS — Urban vs Rural Payouts
# ═══════════════════════════════════════════════════════════════════════

class TestGeographicalFairness:
    """Verify differentiated payout tiers for Urban vs Rural."""

    def test_urban_payout_criteria(self):
        """Urban payout: income drops from ₹8000 to ₹5000."""
        criteria = get_payout_criteria("urban")
        assert criteria["max_income"] == 8000.0
        assert criteria["disrupted_income"] == 5000.0
        assert criteria["max_payout"] == 3000.0  # 8000 - 5000

    def test_rural_payout_criteria(self):
        """Rural payout: income drops from ₹4000 to ₹1000."""
        criteria = get_payout_criteria("rural")
        assert criteria["max_income"] == 4000.0
        assert criteria["disrupted_income"] == 1000.0
        assert criteria["max_payout"] == 3000.0  # 4000 - 1000

    def test_invalid_area_rejected(self):
        """Unknown area categories should be rejected."""
        with pytest.raises(ValueError, match="Invalid area category"):
            get_payout_criteria("suburban")

    def test_payout_calculation_urban_tier1(self):
        """Urban Tier 1 (30%): ₹3000 × 0.30 × day_factor."""
        trigger = TriggerEvent(
            trigger_type=TriggerType.RAINFALL,
            value=65.0,  # Just above threshold → Tier 1
            ward_id="DELHI_CENTRAL",
            city="Delhi",
            timestamp=datetime.utcnow(),
        )
        payout = calculate_payout_amount(AreaCategory.URBAN, trigger, exposed_days=2.0)
        assert payout >= 500.0   # At least min_payout for urban
        assert payout <= 3000.0  # At most max_payout

    def test_payout_calculation_rural_tier3(self):
        """Rural Tier 3 (100%): severe event should yield max payout."""
        trigger = TriggerEvent(
            trigger_type=TriggerType.RAINFALL,
            value=150.0,  # Way above threshold → Tier 3
            ward_id="MUMBAI_HARBOUR",
            city="Mumbai",
            timestamp=datetime.utcnow(),
        )
        payout = calculate_payout_amount(AreaCategory.RURAL, trigger, exposed_days=5.0)
        assert payout == 3000.0  # Max payout for rural at full severity

    def test_no_health_coverage(self):
        """Ensure payout criteria has NO health/hospital/vehicle fields."""
        for area in ["urban", "rural"]:
            criteria = get_payout_criteria(area)
            # Should ONLY have income-related keys
            assert "hospital" not in str(criteria).lower()
            assert "health" not in str(criteria).lower()
            assert "vehicle" not in str(criteria).lower()
            assert "repair" not in str(criteria).lower()
            assert "accident" not in str(criteria).lower()


# ═══════════════════════════════════════════════════════════════════════
# SUMMARY RUNNER
# ═══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  KavachSathi — Stress Test Suite")
    print("  7 Test Categories | Adversarial Verification")
    print("=" * 70 + "\n")
    pytest.main([__file__, "-v", "--tb=short"])
