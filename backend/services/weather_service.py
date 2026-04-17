"""
weather_service.py — Live Weather Fetcher for Kattankulathur
=============================================================
Pulls real-time temperature & humidity from Open-Meteo (forecast API)
and US AQI from the Open-Meteo Air Quality API.

Both APIs are fully free and require no API key.

Location: Kattankulathur, Tamil Nadu, India
  Latitude:  12.8231
  Longitude: 80.0442
"""

import httpx

# ── Coordinates (Kattankulathur) ──────────────────────────────────────
LAT = 12.8231
LON = 80.0442

# ── Open-Meteo Endpoints ──────────────────────────────────────────────
FORECAST_URL = (
    f"https://api.open-meteo.com/v1/forecast"
    f"?latitude={LAT}&longitude={LON}"
    f"&current=temperature_2m,relative_humidity_2m,precipitation"
)

AIR_QUALITY_URL = (
    f"https://air-quality-api.open-meteo.com/v1/air-quality"
    f"?latitude={LAT}&longitude={LON}"
    f"&current=us_aqi"
)

# ── Sensible fallback if either API is unreachable ────────────────────
FALLBACK = {
    "temperature_c": 30.0,
    "humidity":      65.0,
    "aqi":           100.0,
    "rain_mm":       0.0,
}


async def get_current_weather() -> dict:
    """
    Fetch live weather & air quality for Kattankulathur.

    Returns:
        {
            "temperature_c": float,   # °C
            "humidity":      float,   # % relative humidity
            "aqi":           float,   # US AQI index
            "source":        str      # "live" | "fallback"
        }
    """
    temperature_c = FALLBACK["temperature_c"]
    humidity      = FALLBACK["humidity"]
    aqi           = FALLBACK["aqi"]
    rain_mm       = FALLBACK["rain_mm"]
    source        = "fallback"

    async with httpx.AsyncClient(timeout=5.0) as client:
        # ── Fetch temperature + humidity ──────────────────────────────
        try:
            resp = await client.get(FORECAST_URL)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                temperature_c = float(current.get("temperature_2m",  FALLBACK["temperature_c"]))
                humidity      = float(current.get("relative_humidity_2m", FALLBACK["humidity"]))
                rain_mm       = float(current.get("precipitation", 0.0))
                source = "live"
            else:
                print(f"[WeatherService] Forecast API error: {resp.status_code}")
        except Exception as e:
            print(f"[WeatherService] Forecast fetch failed: {e}")

        # ── Fetch US AQI ──────────────────────────────────────────────
        try:
            resp = await client.get(AIR_QUALITY_URL)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                raw_aqi = current.get("us_aqi")
                if raw_aqi is not None:
                    aqi = float(raw_aqi)
            else:
                print(f"[WeatherService] AQI API error: {resp.status_code}")
        except Exception as e:
            print(f"[WeatherService] AQI fetch failed: {e}")

    return {
        "temperature_c": temperature_c,
        "humidity":      humidity,
        "aqi":           aqi,
        "rain_mm":       rain_mm,
        "source":        source,
    }
