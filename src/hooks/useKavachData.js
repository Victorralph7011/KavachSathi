/**
 * useKavachData — Shared Live Data Hook
 * =======================================
 * Fetches live weather (temperature, humidity, AQI) and the ML-calculated
 * dynamic premium from the KavachSathi backend.
 *
 * Returns a single stable object so any component can subscribe to the
 * same live feed without duplicating fetch logic.
 *
 * Refresh interval: every 5 minutes (weather doesn't change faster).
 *
 * Usage:
 *   const { weather, premium, multiplier, loading, error } = useKavachData();
 */

import { useState, useEffect, useCallback } from 'react';

const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Default shapes so consumers can safely destructure before data arrives
const DEFAULT_WEATHER = { temperature_c: null, humidity: null, aqi: null, rain_mm: null, source: 'loading' };
const DEFAULT_PREMIUM = { dynamic_premium: null, risk_multiplier: null };

/**
 * Fetch live weather for Kattankulathur from the backend proxy.
 * @returns {Promise<{temperature_c, humidity, aqi, source}>}
 */
async function fetchWeather() {
  const res = await fetch(`${BACKEND}/api/weather/current`);
  if (!res.ok) throw new Error(`Weather API: HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch a dynamic premium from the ML engine via the backend.
 * The backend will use the latest live weather internally.
 * @returns {Promise<{dynamic_premium, risk_multiplier}>}
 */
async function fetchDynamicPremium() {
  const res = await fetch(`${BACKEND}/api/predict-premium`);
  if (!res.ok) throw new Error(`Premium API: HTTP ${res.status}`);
  return res.json();
}

/**
 * Shared hook. Call once at a high level (e.g. Dashboard, CommandCenterView)
 * or directly in any component that needs live data.
 *
 * @param {number} [refreshMs=300000]  Auto-refresh interval in ms (default 5 min)
 */
export function useKavachData(refreshMs = 5 * 60 * 1000) {
  const [weather, setWeather] = useState(DEFAULT_WEATHER);
  const [premium, setPremium] = useState(DEFAULT_PREMIUM.dynamic_premium);
  const [multiplier, setMultiplier] = useState(DEFAULT_PREMIUM.risk_multiplier);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both in parallel
      const [weatherData, premiumData] = await Promise.allSettled([
        fetchWeather(),
        fetchDynamicPremium(),
      ]);

      if (weatherData.status === 'fulfilled') {
        setWeather(weatherData.value);
      } else {
        console.warn('[useKavachData] Weather fetch failed:', weatherData.reason?.message);
        setError(weatherData.reason?.message || 'Weather unavailable');
      }

      if (premiumData.status === 'fulfilled') {
        setPremium(premiumData.value.dynamic_premium ?? null);
        setMultiplier(premiumData.value.risk_multiplier ?? null);
      } else {
        console.warn('[useKavachData] Premium fetch failed:', premiumData.reason?.message);
        // Don't overwrite error with a premium failure — weather is more critical
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) await refresh();
    };

    run();
    const interval = setInterval(() => { if (!cancelled) refresh(); }, refreshMs);
    return () => { cancelled = true; clearInterval(interval); };
  }, [refresh, refreshMs]);

  return {
    weather,        // { temperature_c, humidity, aqi, rain_mm, source }
    premium,        // number | null  — dynamic_premium from ML engine
    multiplier,     // number | null  — risk_multiplier from ML engine
    loading,
    error,
    refresh,        // call manually to force a refresh
  };
}
