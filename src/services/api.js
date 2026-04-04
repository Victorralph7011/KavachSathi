/**
 * KavachSathi — Centralized FastAPI Client
 * ==========================================
 * 
 * All backend communication flows through this module.
 * Endpoint base URL is configured via VITE_API_BASE_URL env var.
 * 
 * Endpoints:
 *   POST /pricing/quote        → Actuarial premium calculation
 *   GET  /pricing/bounds       → Premium cap info
 *   POST /policies/enroll      → Worker enrollment
 *   GET  /policies/platform/health → Platform solvency dashboard
 *   GET  /claims/              → List all claims
 *   GET  /claims/claims/{id}   → Single claim detail
 *   POST /claims/triggers/ingest → Ingest parametric trigger
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ─── Internals ───────────────────────────────────────────────

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) {
      console.error(`[KAVACH API] ${method} ${path} → ${res.status}`, data);
      return { success: false, status: res.status, error: data.detail || data, data: null };
    }
    return { success: true, status: res.status, error: null, data };
  } catch (err) {
    console.error(`[KAVACH API] Network error: ${method} ${path}`, err);
    return { success: false, status: 0, error: err.message, data: null };
  }
}

// ─── Pricing Engine ──────────────────────────────────────────

/**
 * Fetch a live premium quote from the actuarial engine.
 * Formula: Premium = P(Trigger) × L_avg × D_exposed × RiskMultiplier
 * 
 * @param {string} areaCategory - 'URBAN' or 'RURAL'
 * @param {string} wardId - Ward-level ID (e.g. 'MUMBAI_WESTERN')
 * @param {string} city - City name (e.g. 'Mumbai')
 * @returns {Promise<{success, data: {weekly_premium, p_trigger, l_avg, d_exposed, risk_multiplier, formula_breakdown, cap_applied}}>}
 */
export async function fetchPremiumQuote(areaCategory, wardId, city = 'Delhi') {
  return request('POST', '/pricing/quote', {
    persona: 'FOOD_DELIVERY',
    billing_cycle: 'WEEKLY',
    area_category: areaCategory,
    ward_id: wardId,
    city,
  });
}

/**
 * Get premium bounds (₹20-₹50 caps).
 */
export async function fetchPremiumBounds() {
  return request('GET', '/pricing/bounds');
}

// ─── Policy Enrollment ────────────────────────────────────────

/**
 * Enroll a gig worker in KavachSathi coverage.
 * Includes circuit breaker check + actuarial pricing.
 * 
 * @param {Object} policyData
 * @param {string} policyData.worker_id
 * @param {string} policyData.worker_name
 * @param {string} policyData.area_category - 'URBAN' or 'RURAL'
 * @param {string} policyData.ward_id
 * @param {string} policyData.city
 * @param {string} policyData.platform_name - 'ZOMATO' / 'SWIGGY' / 'ZEPTO'
 * @param {string|null} policyData.upi_id
 */
export async function enrollPolicy(policyData) {
  return request('POST', '/policies/enroll', {
    persona: 'FOOD_DELIVERY',
    billing_cycle: 'WEEKLY',
    ...policyData,
  });
}

/**
 * Get platform health/solvency dashboard.
 * Returns loss ratio, circuit breaker status, active policies count.
 */
export async function fetchPlatformHealth() {
  return request('GET', '/policies/platform/health');
}

/**
 * List all enrolled policies.
 */
export async function fetchPolicies() {
  return request('GET', '/policies/');
}

// ─── Claims Pipeline ──────────────────────────────────────────

/**
 * List all claims, optionally filtered by state.
 * @param {string|null} stateFilter - e.g. 'DETECTED', 'PAID', 'FRAUD_BLOCKED'
 */
export async function fetchClaims(stateFilter = null) {
  const path = stateFilter ? `/claims/?state=${stateFilter}` : '/claims/';
  return request('GET', path);
}

/**
 * Get a single claim with full audit trail.
 * @param {string} claimId
 */
export async function fetchClaimById(claimId) {
  return request('GET', `/claims/claims/${claimId}`);
}

/**
 * Ingest a parametric trigger event from the oracle.
 * If it exceeds thresholds (Rain > 60mm / AQI > 300),
 * claims are auto-created for all active policies in the ward.
 * 
 * @param {Object} triggerData
 * @param {string} triggerData.trigger_type - 'RAINFALL' or 'AQI'
 * @param {number} triggerData.value - measured value
 * @param {string} triggerData.ward_id
 * @param {string} triggerData.city
 * @param {string} triggerData.timestamp - ISO timestamp
 */
export async function ingestTrigger(triggerData) {
  return request('POST', '/claims/triggers/ingest', {
    source: 'IMD_ORACLE',
    ...triggerData,
  });
}

/**
 * Process/advance a claim through the zero-touch pipeline.
 * @param {string} claimId
 */
export async function processClaim(claimId) {
  return request('POST', `/claims/claims/${claimId}/process`);
}
