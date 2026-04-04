import { useState, useEffect } from 'react';

/**
 * useGeolocation — Browser GPS Acquisition Hook
 * ==============================================
 * 
 * Returns the user's real-time GPS coordinates using the 
 * browser Geolocation API with high-accuracy mode.
 * 
 * Falls back to Delhi center (28.6139, 77.2090) if:
 *  - User denies permission
 *  - Geolocation is unavailable
 *  - Timeout exceeded
 */

const DELHI_FALLBACK = { latitude: 28.6139, longitude: 77.2090 };

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setPosition(DELHI_FALLBACK);
      setIsLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 min cache
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsLoading(false);
      },
      (err) => {
        console.warn('[KAVACH GPS] Geolocation error:', err.message);
        setError(err.message);
        setPosition(DELHI_FALLBACK);
        setIsLoading(false);
      },
      options
    );
  }, []);

  return {
    latitude: position?.latitude || DELHI_FALLBACK.latitude,
    longitude: position?.longitude || DELHI_FALLBACK.longitude,
    accuracy: position?.accuracy || null,
    error,
    isLoading,
    isReal: !error && position !== null && position !== DELHI_FALLBACK,
  };
}
