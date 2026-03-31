/**
 * Indian State Detection from GPS Coordinates
 * 
 * Uses bounding-box approximation for major states.
 * In production, replace with a reverse geocoding API (Google/Mapbox).
 */

const STATE_BOUNDS = [
  { name: 'Maharashtra', latMin: 15.6, latMax: 22.1, lonMin: 72.6, lonMax: 80.9 },
  { name: 'Delhi', latMin: 28.4, latMax: 28.9, lonMin: 76.8, lonMax: 77.4 },
  { name: 'Karnataka', latMin: 11.5, latMax: 18.5, lonMin: 74.0, lonMax: 78.6 },
  { name: 'Tamil Nadu', latMin: 8.0, latMax: 13.6, lonMin: 76.2, lonMax: 80.4 },
  { name: 'Telangana', latMin: 15.8, latMax: 19.9, lonMin: 77.2, lonMax: 81.3 },
  { name: 'West Bengal', latMin: 21.5, latMax: 27.2, lonMin: 86.0, lonMax: 89.9 },
  { name: 'Gujarat', latMin: 20.1, latMax: 24.7, lonMin: 68.1, lonMax: 74.5 },
  { name: 'Rajasthan', latMin: 23.0, latMax: 30.2, lonMin: 69.3, lonMax: 78.2 },
  { name: 'Uttar Pradesh', latMin: 23.8, latMax: 30.4, lonMin: 77.0, lonMax: 84.6 },
  { name: 'Kerala', latMin: 8.2, latMax: 12.8, lonMin: 74.8, lonMax: 77.4 },
  { name: 'Punjab', latMin: 29.5, latMax: 32.5, lonMin: 73.8, lonMax: 76.9 },
  { name: 'Haryana', latMin: 27.6, latMax: 30.9, lonMin: 74.5, lonMax: 77.6 },
  { name: 'Bihar', latMin: 24.2, latMax: 27.5, lonMin: 83.3, lonMax: 88.2 },
  { name: 'Madhya Pradesh', latMin: 21.1, latMax: 26.9, lonMin: 74.0, lonMax: 82.8 },
  { name: 'Andhra Pradesh', latMin: 12.6, latMax: 19.9, lonMin: 76.7, lonMax: 84.7 },
  { name: 'Odisha', latMin: 17.8, latMax: 22.6, lonMin: 81.3, lonMax: 87.5 },
  { name: 'Goa', latMin: 14.9, latMax: 15.8, lonMin: 73.7, lonMax: 74.3 },
  { name: 'Assam', latMin: 24.1, latMax: 28.0, lonMin: 89.7, lonMax: 96.0 },
  { name: 'Jharkhand', latMin: 21.9, latMax: 25.3, lonMin: 83.3, lonMax: 87.9 },
  { name: 'Chhattisgarh', latMin: 17.8, latMax: 24.1, lonMin: 80.2, lonMax: 84.4 },
];

/**
 * Detect Indian state from latitude/longitude using bounding boxes
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} State name or 'Unknown'
 */
export function detectState(lat, lon) {
  for (const state of STATE_BOUNDS) {
    if (
      lat >= state.latMin && lat <= state.latMax &&
      lon >= state.lonMin && lon <= state.lonMax
    ) {
      return state.name;
    }
  }
  return 'Unknown';
}

/**
 * Get a human-readable location string
 */
export function formatCoordinates(lat, lon) {
  return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
}
