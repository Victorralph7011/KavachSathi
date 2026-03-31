/**
 * KavachSathi AI Risk Engine — v2.0 (Dynamic Pricing)
 * 
 * Formula: R = (0.4E + 0.4P + 0.2M)
 * 
 * E = Environmental Factor  (weather, AQI, traffic density)
 * P = Personal/Platform Factor (platform, worker history, vehicle type)
 * M = Market/Mobility Factor  (regional risk, time-of-day, surge)
 * 
 * NEW: Hyper-local Safe Zone Discounts
 * If GPS resolves to a "Historically Safe Zone" (low water-logging,
 * no flood history), apply ₹2/week discount to the premium.
 */

// ─── State-Level Base Risk Profiles (0-1 scale) ─────────────
const STATE_RISK_MAP = {
  'Maharashtra': 0.82,
  'Delhi': 0.88,
  'Karnataka': 0.65,
  'Tamil Nadu': 0.70,
  'Telangana': 0.68,
  'West Bengal': 0.75,
  'Gujarat': 0.60,
  'Rajasthan': 0.58,
  'Uttar Pradesh': 0.78,
  'Madhya Pradesh': 0.62,
  'Kerala': 0.55,
  'Punjab': 0.64,
  'Haryana': 0.72,
  'Bihar': 0.70,
  'Andhra Pradesh': 0.63,
  'Odisha': 0.60,
  'Jharkhand': 0.65,
  'Assam': 0.58,
  'Chhattisgarh': 0.55,
  'Goa': 0.50,
};

const DEFAULT_STATE_RISK = 0.65;

// ─── Hyper-Local Safe Zones ──────────────────────────────────
// Zones historically safe from water-logging, floods, extreme events
// Bounding boxes: { latMin, latMax, lonMin, lonMax }
const SAFE_ZONES = [
  { name: 'Pune Central', latMin: 18.48, latMax: 18.56, lonMin: 73.82, lonMax: 73.92, type: 'LOW_WATERLOG' },
  { name: 'Bengaluru Whitefield', latMin: 12.94, latMax: 13.00, lonMin: 77.72, lonMax: 77.80, type: 'LOW_WATERLOG' },
  { name: 'Hyderabad HITEC City', latMin: 17.42, latMax: 17.48, lonMin: 78.35, lonMax: 78.42, type: 'LOW_WATERLOG' },
  { name: 'Chennai OMR', latMin: 12.82, latMax: 12.92, lonMin: 80.20, lonMax: 80.26, type: 'LOW_WATERLOG' },
  { name: 'Ahmedabad SG Highway', latMin: 23.01, latMax: 23.08, lonMin: 72.48, lonMax: 72.56, type: 'LOW_WATERLOG' },
  { name: 'Jaipur Malviya Nagar', latMin: 26.82, latMax: 26.88, lonMin: 75.78, lonMax: 75.84, type: 'LOW_WATERLOG' },
  { name: 'Gurgaon Sector 29', latMin: 28.45, latMax: 28.48, lonMin: 77.03, lonMax: 77.07, type: 'LOW_WATERLOG' },
  { name: 'Nagpur Civil Lines', latMin: 21.14, latMax: 21.18, lonMin: 79.06, lonMax: 79.12, type: 'LOW_WATERLOG' },
];

// Safe zone discount: ₹2/week for historically safe zones
const SAFE_ZONE_DISCOUNT = 2;

// ─── Mock Weather Data (simulated oracle) ────────────────────
const MOCK_WEATHER = {
  'Maharashtra': { temp: 32, humidity: 78, rainfall: 12, aqi: 110, condition: 'Partly Cloudy', icon: '⛅' },
  'Delhi': { temp: 38, humidity: 45, rainfall: 0, aqi: 280, condition: 'Hazy', icon: '🌫️' },
  'Karnataka': { temp: 28, humidity: 65, rainfall: 2, aqi: 75, condition: 'Clear', icon: '☀️' },
  'Tamil Nadu': { temp: 35, humidity: 82, rainfall: 5, aqi: 95, condition: 'Humid', icon: '🌤️' },
  'Telangana': { temp: 34, humidity: 60, rainfall: 0, aqi: 88, condition: 'Clear', icon: '☀️' },
  'West Bengal': { temp: 33, humidity: 85, rainfall: 18, aqi: 120, condition: 'Thunderstorm', icon: '⛈️' },
  'Gujarat': { temp: 36, humidity: 40, rainfall: 0, aqi: 70, condition: 'Sunny', icon: '☀️' },
  'Rajasthan': { temp: 42, humidity: 20, rainfall: 0, aqi: 90, condition: 'Hot', icon: '🔥' },
  'Uttar Pradesh': { temp: 37, humidity: 55, rainfall: 3, aqi: 210, condition: 'Hazy', icon: '🌫️' },
  'Kerala': { temp: 30, humidity: 90, rainfall: 25, aqi: 50, condition: 'Rain', icon: '🌧️' },
  'Punjab': { temp: 35, humidity: 50, rainfall: 0, aqi: 150, condition: 'Clear', icon: '☀️' },
  'Haryana': { temp: 36, humidity: 48, rainfall: 0, aqi: 180, condition: 'Hazy', icon: '🌫️' },
  'Bihar': { temp: 34, humidity: 75, rainfall: 8, aqi: 160, condition: 'Cloudy', icon: '☁️' },
};

const DEFAULT_WEATHER = { temp: 32, humidity: 60, rainfall: 5, aqi: 100, condition: 'Moderate', icon: '🌤️' };

/**
 * Get mock weather for a state
 */
export function getWeatherData(stateName) {
  return MOCK_WEATHER[stateName] || DEFAULT_WEATHER;
}

/**
 * Check if coordinates fall within a safe zone
 */
export function checkSafeZone(lat, lon) {
  for (const zone of SAFE_ZONES) {
    if (lat >= zone.latMin && lat <= zone.latMax && lon >= zone.lonMin && lon <= zone.lonMax) {
      return { isSafe: true, zoneName: zone.name, type: zone.type, discount: SAFE_ZONE_DISCOUNT };
    }
  }
  return { isSafe: false, zoneName: null, type: null, discount: 0 };
}

/**
 * Calculate the Environmental factor (E)
 * Incorporates weather data oracle
 */
export function calculateEnvironmental(stateName) {
  const baseRisk = STATE_RISK_MAP[stateName] ?? DEFAULT_STATE_RISK;
  const weather = getWeatherData(stateName);
  const hour = new Date().getHours();
  
  // Time-of-day modifier
  let timeModifier = 1.0;
  if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21)) {
    timeModifier = 1.15; // Rush hour
  } else if (hour >= 22 || hour <= 5) {
    timeModifier = 1.25; // Night driving
  }
  
  // Weather modifier
  let weatherModifier = 1.0;
  if (weather.rainfall > 50) weatherModifier = 1.4;      // Heavy rain
  else if (weather.rainfall > 20) weatherModifier = 1.2;  // Moderate rain
  else if (weather.temp > 42) weatherModifier = 1.15;     // Extreme heat
  if (weather.aqi > 200) weatherModifier *= 1.1;          // Poor AQI
  
  return Math.min(1, baseRisk * timeModifier * weatherModifier);
}

/**
 * Calculate the Personal/Platform factor (P)
 */
export function calculatePersonal(platformRiskModifier = 0.85) {
  return Math.min(1, platformRiskModifier);
}

/**
 * Calculate the Market/Mobility factor (M)
 */
export function calculateMarket() {
  const base = 0.55;
  const variance = (Math.random() * 0.2) - 0.1;
  return Math.min(1, Math.max(0, base + variance));
}

/**
 * Core Risk Calculation — v2.0 with Dynamic Pricing
 * R = (0.4E + 0.4P + 0.2M)
 * 
 * @returns Full risk assessment with dynamic pricing
 */
export function calculateRiskScore(stateName, platformRiskModifier, coords = null) {
  const E = calculateEnvironmental(stateName);
  const P = calculatePersonal(platformRiskModifier);
  const M = calculateMarket();
  const weather = getWeatherData(stateName);
  
  const R = (0.4 * E) + (0.4 * P) + (0.2 * M);
  
  let grade;
  if (R <= 0.55) grade = 'A';
  else if (R <= 0.75) grade = 'B';
  else grade = 'C';

  // Check safe zone discount
  let safeZone = { isSafe: false, zoneName: null, type: null, discount: 0 };
  if (coords) {
    safeZone = checkSafeZone(coords.latitude, coords.longitude);
  }
  
  return {
    score: parseFloat(R.toFixed(4)),
    grade,
    factors: {
      environmental: parseFloat(E.toFixed(4)),
      personal: parseFloat(P.toFixed(4)),
      market: parseFloat(M.toFixed(4)),
    },
    weather,
    safeZone,
    formula: `R = (0.4 × ${E.toFixed(2)}) + (0.4 × ${P.toFixed(2)}) + (0.2 × ${M.toFixed(2)}) = ${R.toFixed(4)}`,
    formulaBreakdown: {
      envContribution: parseFloat((0.4 * E).toFixed(4)),
      perContribution: parseFloat((0.4 * P).toFixed(4)),
      marContribution: parseFloat((0.2 * M).toFixed(4)),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate estimated premium with dynamic pricing
 */
export function calculatePremium(grade, termType = 'weekly', safeZoneDiscount = 0) {
  const BASE_PREMIUMS = {
    A: { weekly: 25, 'per-mile': 0.15 },
    B: { weekly: 40, 'per-mile': 0.25 },
    C: { weekly: 65, 'per-mile': 0.40 },
  };
  
  let premium = BASE_PREMIUMS[grade]?.[termType] ?? BASE_PREMIUMS.B[termType];
  
  // Apply safe zone discount (only for weekly)
  if (termType === 'weekly' && safeZoneDiscount > 0) {
    premium = Math.max(premium - safeZoneDiscount, 10); // minimum ₹10
  }
  
  return premium;
}

/**
 * Generate terminal output lines for the risk calculation
 * This creates the specific typewriter sequence for the TerminalLoader
 */
export function generateTerminalLines(stateName, platformName, coords = null) {
  const weather = getWeatherData(stateName);
  const safeZone = coords ? checkSafeZone(coords.latitude, coords.longitude) : { isSafe: false };
  
  const lines = [
    { text: '> INITIALIZING RISK_ENGINE v2.1...', delay: 0 },
    { text: '> ACQUIRING GPS_COORDINATES...', delay: 400 },
    { text: `> RESOLVED BASE_STATE: ${stateName.toUpperCase()}`, delay: 900 },
    { text: `> WEATHER_ORACLE: ${weather.icon} ${weather.condition} | ${weather.temp}°C | Rain: ${weather.rainfall}mm | AQI: ${weather.aqi}`, delay: 1400 },
    { text: `> LOADING ENVIRONMENTAL_MATRIX [E]...`, delay: 2000 },
    { text: `> QUERYING PLATFORM_RISK [P]: ${platformName?.toUpperCase() || 'UNKNOWN'}...`, delay: 2500 },
    { text: `> CALCULATING MARKET_VOLATILITY [M]...`, delay: 3000 },
    { text: '> APPLYING FORMULA: R = (0.4E + 0.4P + 0.2M)', delay: 3600, isFormula: true },
  ];

  // Safe zone check
  if (safeZone.isSafe) {
    lines.push({
      text: `> SAFE_ZONE DETECTED: "${safeZone.zoneName}" — LOW WATER-LOGGING RISK`,
      delay: 4100,
      isSafeZone: true,
    });
    lines.push({
      text: `> APPLYING HYPER-LOCAL DISCOUNT: -₹${SAFE_ZONE_DISCOUNT}/week`,
      delay: 4500,
      isDiscount: true,
    });
  } else {
    lines.push({
      text: '> SAFE_ZONE CHECK: No hyper-local discounts applicable',
      delay: 4100,
    });
  }

  lines.push({
    text: '> RISK ASSESSMENT COMPLETE.',
    delay: safeZone.isSafe ? 5000 : 4600,
    isResult: true,
  });

  return lines;
}
