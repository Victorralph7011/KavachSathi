/**
 * reverseGeocode — Urban/Rural Classification Engine
 * ====================================================
 * 
 * Uses OpenStreetMap Nominatim (free, no API key) to resolve
 * GPS coordinates into a location, then classifies URBAN vs RURAL
 * based on India's Tier-1/Tier-2 city taxonomy.
 * 
 * Returns: { displayName, city, state, areaCategory, lAvg }
 */

const URBAN_CITIES = new Set([
  // Tier 1
  'mumbai', 'delhi', 'new delhi', 'bengaluru', 'bangalore', 'hyderabad',
  'ahmedabad', 'chennai', 'kolkata', 'pune', 'surat', 'jaipur',
  // Tier 2
  'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal',
  'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana',
  'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi',
  'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai',
  'allahabad', 'prayagraj', 'howrah', 'ranchi', 'gwalior', 'jodhpur',
  'coimbatore', 'vijayawada', 'chandigarh', 'mysore', 'mysuru',
  'noida', 'greater noida', 'gurugram', 'gurgaon', 'kochi', 'cochin',
  'thiruvananthapuram', 'trivandrum', 'dehradun', 'mangalore',
]);

// L_avg (Weekly Average Income Lost) by area category
// Urban: ₹8000/week → ₹5000 income drop → L_avg ₹800/day
// Rural: ₹4000/week → ₹1000 income drop → L_avg ₹400/day
const L_AVG = { URBAN: 800, RURAL: 400 };

let _cache = {};

export async function reverseGeocode(latitude, longitude) {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  if (_cache[cacheKey]) return _cache[cacheKey];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=12`,
      {
        headers: {
          'User-Agent': 'KavachSathi/1.0 (parametric-insurance-demo)',
          'Accept-Language': 'en',
        },
      }
    );

    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();

    const addr = data.address || {};
    const city = addr.city || addr.town || addr.county || addr.state_district || '';
    const state = addr.state || '';
    const displayName = city ? `${city}, ${state}` : (data.display_name || '').split(',').slice(0, 2).join(',');
    
    // Classify urban vs rural
    const cityLower = city.toLowerCase().trim();
    const isUrban = URBAN_CITIES.has(cityLower) || 
                    [...URBAN_CITIES].some(uc => cityLower.includes(uc));
    
    const areaCategory = isUrban ? 'URBAN' : 'RURAL';

    const result = {
      displayName,
      city: city || 'Unknown',
      state: state || 'India',
      areaCategory,
      lAvg: L_AVG[areaCategory],
    };

    _cache[cacheKey] = result;
    return result;
  } catch (err) {
    console.warn('[KAVACH GEO] Reverse geocode failed:', err.message);
    return {
      displayName: 'Delhi, India',
      city: 'Delhi',
      state: 'India',
      areaCategory: 'URBAN',
      lAvg: L_AVG.URBAN,
    };
  }
}
