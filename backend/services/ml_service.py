import os
import httpx
import firebase_admin
from firebase_admin import firestore
from services.weather_service import get_current_weather

ML_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:5000")

async def get_dynamic_premium(temp: float = None, aqi: float = None, rain: float = None, traffic: float = 5.0):
    """
    Fetches live weather data for Kattankulathur and sends it to the ML engine
    to compute a dynamic premium and risk multiplier.

    If temp/aqi are explicitly provided (e.g. from a test), those values are used.
    Otherwise, live data is fetched from the weather service.
    """
    try:
        # ── Fetch live weather if not overridden ──────────────────────
        if temp is None or aqi is None:
            weather = await get_current_weather()
            temp = temp if temp is not None else weather["temperature_c"]
            aqi  = aqi  if aqi  is not None else weather["aqi"]
            rain = rain if rain is not None else weather.get("rain_mm", 0.0)
            print(f"[ML] Live weather → temp={temp}°C, aqi={aqi}, rain={rain}mm, source={weather['source']}")

        payload = {
            "temperature_c": float(temp),
            "aqi_level":     float(aqi),
            "traffic_index": float(traffic),
            "rain_mm":       float(rain if rain is not None else 0.0),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ML_URL}/predict-premium",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5.0
            )

            if response.status_code == 200:
                return response.json()
            else:
                print(f"[ML] Engine rejected request: {response.status_code} — {response.text}")

    except Exception as e:
        print(f"[ML] Premium connection error: {e}")

    return {"dynamic_premium": 10.0, "risk_multiplier": 1.0}

async def process_claim_with_ai(claim_id: str, time_hrs: float, distance_km: float):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ML_URL}/detect-fraud",
                json={"time_since_policy_start_hrs": time_hrs, "distance_from_registered_zone_km": distance_km},
                timeout=5.0
            )
            if response.status_code == 200:
                result = response.json()
                db = firestore.client()
                db.collection('claims').document(claim_id).update({
                    "ml_fraud_flag": result.get("is_fraud", 0),
                    "status": result.get("action", "flag_for_review")
                })
                print(f"✅ AI Processed Claim {claim_id}: {result.get('action')}")
    except Exception as e:
        print(f"ML Fraud Error: {e}")