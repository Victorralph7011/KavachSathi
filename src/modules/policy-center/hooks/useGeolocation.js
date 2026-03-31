import { useState, useCallback } from 'react';
import { detectState, formatCoordinates } from '../utils/stateMapping';

/**
 * useGeolocation — Browser GPS hook with fallback
 * 
 * Uses navigator.geolocation API.
 * Falls back to a simulated Mumbai location for demo/testing.
 */

const FALLBACK_COORDS = {
  latitude: 19.076,
  longitude: 72.8777,
  label: 'Mumbai, Maharashtra (Demo Fallback)',
};

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [baseState, setBaseState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const applyCoords = useCallback((lat, lon, isFallback = false) => {
    const state = detectState(lat, lon);
    setCoords({ latitude: lat, longitude: lon, formatted: formatCoordinates(lat, lon) });
    setBaseState(state);
    setUsedFallback(isFallback);
    setLoading(false);
    return { latitude: lat, longitude: lon, state };
  }, []);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported — using demo location');
      return applyCoords(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, true);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = applyCoords(position.coords.latitude, position.coords.longitude);
          resolve(result);
        },
        (err) => {
          setError(`GPS denied — using demo location (${err.message})`);
          const result = applyCoords(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, true);
          resolve(result);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  }, [applyCoords]);

  return {
    coords,
    baseState,
    loading,
    error,
    usedFallback,
    requestLocation,
  };
}
