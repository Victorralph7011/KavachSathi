"""
autonomous_trigger_service.py — Live Parametric Oracle
=======================================================
Compares real-time weather against KavachSathi thresholds and returns
structured oracle events. When a breach is detected the payout is
calculated dynamically using the ML risk multiplier.

Thresholds (KavachSathi parametric spec):
  RAIN  > 50 mm/hr  → RAINFALL_BREACH
  TEMP  > 40 °C     → HEATWAVE_BREACH
  AQI   > 200       → AQI_BREACH

Payout formula (breach only):
  payout = base_daily * risk_multiplier * severity_factor
  base_daily (RURAL ₹400 / URBAN ₹800)
  severity_factor: 0.3 – 1.0 depending on how far above threshold
"""

import uuid
from datetime import datetime, timezone
from services.weather_service import get_current_weather

# ── Thresholds ────────────────────────────────────────────────
RAIN_THRESHOLD = 50.0     # mm/hr
TEMP_THRESHOLD = 40.0     # °C
AQI_THRESHOLD  = 200.0    # US AQI

# ── Payout config ─────────────────────────────────────────────
BASE_DAILY_RURAL  = 400   # ₹
BASE_DAILY_URBAN  = 800   # ₹


def _severity(value: float, threshold: float, maximum: float) -> float:
    """0.0 (at threshold) → 1.0 (at maximum or beyond)."""
    if value <= threshold:
        return 0.0
    return min((value - threshold) / (maximum - threshold), 1.0)


def _payout(area: str, severity: float, risk_multiplier: float) -> int:
    base = BASE_DAILY_RURAL if area.upper() == "RURAL" else BASE_DAILY_URBAN
    # D_exposed: 0.3 (minor breach) → 1.0 (extreme breach)
    d_exposed = 0.3 + severity * 0.7
    raw = base * d_exposed * risk_multiplier
    return max(100, round(raw))          # floor ₹100 to avoid ₹0 events


async def check_oracle(
    area_category: str = "RURAL",
    risk_multiplier: float = 1.0,
    premium: float = 10.0,
) -> dict:
    """
    Fetch live weather and evaluate parametric triggers.

    Returns:
      {
        "monitoring":    bool      — True when no breach
        "breaches":      list[dict] — one entry per triggered condition
        "weather":       dict      — raw weather snapshot
        "checked_at":    str       — ISO timestamp
      }
    """
    weather = await get_current_weather()
    checked_at = datetime.now(timezone.utc).isoformat()

    rain  = weather.get("rain_mm",       0.0)
    temp  = weather.get("temperature_c", 30.0)
    aqi   = weather.get("aqi",          100.0)
    source = weather.get("source", "fallback")

    breaches = []

    # ── Rainfall Breach ──────────────────────────────────────
    if rain >= RAIN_THRESHOLD:
        severity = _severity(rain, RAIN_THRESHOLD, 120.0)
        breaches.append({
            "id":            f"EVT-RAIN-{uuid.uuid4().hex[:8].upper()}",
            "event":         "RAINFALL_BREACH",
            "trigger_type":  "RAINFALL",
            "value":         rain,
            "threshold":     RAIN_THRESHOLD,
            "unit":          "mm/hr",
            "payout_amount": _payout(area_category, severity, risk_multiplier),
            "status":        "DETECTED",
            "state":         "DETECTED",
            "reason":        f"Oracle detected {rain:.1f}mm/hr rainfall — exceeds {RAIN_THRESHOLD}mm parametric threshold.",
            "createdAt":     checked_at,
            "created_at":    checked_at,
            "source":        "oracle",
        })

    # ── Heatwave Breach ──────────────────────────────────────
    if temp >= TEMP_THRESHOLD:
        severity = _severity(temp, TEMP_THRESHOLD, 50.0)
        breaches.append({
            "id":            f"EVT-HEAT-{uuid.uuid4().hex[:8].upper()}",
            "event":         "HEATWAVE_BREACH",
            "trigger_type":  "HEATWAVE",
            "value":         temp,
            "threshold":     TEMP_THRESHOLD,
            "unit":          "°C",
            "payout_amount": _payout(area_category, severity, risk_multiplier),
            "status":        "DETECTED",
            "state":         "DETECTED",
            "reason":        f"Oracle detected {temp:.1f}°C — exceeds {TEMP_THRESHOLD}°C parametric threshold.",
            "createdAt":     checked_at,
            "created_at":    checked_at,
            "source":        "oracle",
        })

    # ── AQI Breach ───────────────────────────────────────────
    if aqi >= AQI_THRESHOLD:
        severity = _severity(aqi, AQI_THRESHOLD, 500.0)
        breaches.append({
            "id":            f"EVT-AQI-{uuid.uuid4().hex[:8].upper()}",
            "event":         "AQI_BREACH",
            "trigger_type":  "AQI",
            "value":         aqi,
            "threshold":     AQI_THRESHOLD,
            "unit":          "US AQI",
            "payout_amount": _payout(area_category, severity, risk_multiplier),
            "status":        "DETECTED",
            "state":         "DETECTED",
            "reason":        f"CPCB Oracle reported AQI {round(aqi)} — exceeds {int(AQI_THRESHOLD)} threshold.",
            "createdAt":     checked_at,
            "created_at":    checked_at,
            "source":        "oracle",
        })

    return {
        "monitoring": len(breaches) == 0,
        "breaches":   breaches,
        "weather":    weather,
        "checked_at": checked_at,
        "data_source": source,
    }
