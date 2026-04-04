import { useState, useCallback } from 'react';
import { detectState, formatCoordinates } from '../utils/stateMapping';

/**
 * useGeolocation — Browser GPS hook with Nominatim reverse geocoding
 * 
 * Uses navigator.geolocation API for real coordinates.
 * Reverse geocodes via Nominatim (OpenStreetMap) to get city/state.
 * Falls back to bounding-box detection if Nominatim fails.
 */

const FALLBACK_COORDS = {
  latitude: 19.076,
  longitude: 72.8777,
  label: 'Mumbai, Maharashtra (Demo Fallback)',
};

// Cities classified as URBAN for geo-fairness
const URBAN_CITIES = new Set([
  'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad',
  'chennai', 'kolkata', 'pune', 'ahmedabad', 'surat', 'jaipur', 'lucknow',
  'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam',
  'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik',
  'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad',
  'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'ranchi', 'howrah',
  'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai',
  'noida', 'gurgaon', 'gurugram',
]);

/**
 * Reverse geocode coordinates using Nominatim (OpenStreetMap)
 * Returns { city, state, areaCategory } or null on failure
 */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`,
      { headers: { 'User-Agent': 'KavachSathi/2.0 (hackathon demo)' } }
    );
    if (!res.ok) return null;
    
    const data = await res.json();
    const addr = data.address || {};
    
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
    const state = addr.state || '';
    const district = addr.state_district || addr.district || '';
    
    // Determine URBAN vs RURAL
    const cityLower = city.toLowerCase();
    const isUrban = URBAN_CITIES.has(cityLower) || 
                    (addr.city && !addr.village) || 
                    (data.type === 'city' || data.type === 'town');
    
    return {
      city,
      state,
      district,
      areaCategory: isUrban ? 'URBAN' : 'RURAL',
      displayName: data.display_name || `${city}, ${state}`,
      raw: addr,
    };
  } catch (e) {
    console.warn('[KAVACH] Nominatim reverse geocode failed:', e.message);
    return null;
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [baseState, setBaseState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [geoData, setGeoData] = useState(null); // Nominatim data

  const applyCoords = useCallback(async (lat, lon, isFallback = false) => {
    // First, try reverse geocoding via Nominatim
    const geo = await reverseGeocode(lat, lon);
    
    let state;
    if (geo && geo.state) {
      state = geo.state;
      setGeoData(geo);
    } else {
      // Fallback to bounding box detection
      state = detectState(lat, lon);
      setGeoData({
        city: state,
        state: state,
        areaCategory: 'URBAN',
        displayName: `${state}, India`,
      });
    }

    setCoords({
      latitude: lat,
      longitude: lon,
      formatted: formatCoordinates(lat, lon),
    });
    setBaseState(state);
    setUsedFallback(isFallback);
    setLoading(false);
    
    return {
      latitude: lat,
      longitude: lon,
      state,
      city: geo?.city || state,
      areaCategory: geo?.areaCategory || 'URBAN',
      geoData: geo,
    };
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
        async (position) => {
          const result = await applyCoords(position.coords.latitude, position.coords.longitude);
          resolve(result);
        },
        async (err) => {
          setError(`GPS denied — using demo location (${err.message})`);
          const result = await applyCoords(FALLBACK_COORDS.latitude, FALLBACK_COORDS.longitude, true);
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
    geoData,
    requestLocation,
  };
}
