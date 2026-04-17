/**
 * ============================================================
 * KavachSathi Backend — node_integration.js
 * ============================================================
 * Purpose : Bridge between the existing Node.js/Firebase backend
 *           and the standalone Python ML microservice.
 *
 * What it does
 * ------------
 *  1. Receives a claim object from the backend business logic.
 *  2. Sends claim features to the Flask /detect-fraud endpoint
 *     via HTTP POST (axios).
 *  3. Interprets the ML response.
 *  4. Writes the final decision (ml_fraud_flag, status, ml_action,
 *     processed_at) into Firestore under claims/{userId}.
 *
 * Dependencies
 * ------------
 *   npm install axios firebase-admin
 *
 * Environment variables required
 * --------------------------------
 *   ML_ENGINE_URL          — defaults to http://localhost:5000
 *   GOOGLE_APPLICATION_CREDENTIALS — path to your Firebase service account JSON
 *                                    (or set up Application Default Credentials)
 * ============================================================
 */

"use strict";

const axios        = require("axios");
const admin        = require("firebase-admin");

// ─────────────────────────────────────────────────────────────
// 1. Firebase Admin SDK initialisation (idempotent)
// ─────────────────────────────────────────────────────────────

/**
 * Initialise Firebase Admin only once, even if this module is
 * imported multiple times (common in Express apps).
 *
 * Authentication: set the GOOGLE_APPLICATION_CREDENTIALS env var
 * to the path of your service-account JSON file, OR deploy this
 * on a GCP environment where Application Default Credentials
 * are automatically available.
 */
if (!admin.apps.length) {
  admin.initializeApp({
    // credential: admin.credential.applicationDefault() is used
    // when GOOGLE_APPLICATION_CREDENTIALS env var is set.
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();  // Firestore reference

// ─────────────────────────────────────────────────────────────
// 2. Configuration constants
// ─────────────────────────────────────────────────────────────

/** Base URL of the Python ML microservice. Override via env var. */
const ML_ENGINE_URL  = process.env.ML_ENGINE_URL || "http://localhost:5000";
const FRAUD_ENDPOINT = `${ML_ENGINE_URL}/detect-fraud`;

/** Axios request timeout (ms). Prevents hanging on an unresponsive service. */
const REQUEST_TIMEOUT_MS = 8_000;  // 8 seconds

// ─────────────────────────────────────────────────────────────
// 3. Main exported function — processClaim
// ─────────────────────────────────────────────────────────────

/**
 * processClaim
 * ------------
 * Runs fraud detection on a single insurance claim and persists
 * the ML-enriched decision to Firestore.
 *
 * @param {Object} claimData - Raw claim payload from the frontend/webhook.
 *   @param {number} claimData.time_hrs     - Hours since the policy was activated.
 *   @param {number} claimData.distance_km  - Distance (km) from the user's registered zone.
 *   @param {string} [claimData.claim_id]   - Optional claim identifier for logging.
 *
 * @param {string} userId - The Firebase UID of the policy holder.
 *                          Used as the Firestore document key.
 *
 * @returns {Promise<Object>} The final claim decision object written to Firestore.
 *
 * @throws Will throw if Firestore write fails (HTTP errors from ML service
 *         are handled gracefully with a fallback "pending_manual_review" status).
 */
async function processClaim(claimData, userId) {
  console.log(`\n[processClaim] Processing claim for userId: ${userId}`);
  console.log("[processClaim] Claim data received:", claimData);

  // ── 3a. Validate required inputs ────────────────────────────
  const { time_hrs, distance_km } = claimData;

  if (time_hrs === undefined || distance_km === undefined) {
    throw new Error(
      "claimData must include 'time_hrs' and 'distance_km' fields."
    );
  }

  // ── 3b. Call the Python ML Microservice ─────────────────────
  let mlResponse   = null;   // raw axios response
  let mlPayload    = null;   // parsed ML result
  let mlCallFailed = false;  // flag for graceful fallback

  try {
    console.log(`[processClaim] Calling ML fraud endpoint: POST ${FRAUD_ENDPOINT}`);

    mlResponse = await axios.post(
      FRAUD_ENDPOINT,
      { time_hrs, distance_km },
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { "Content-Type": "application/json" },
        // Allow axios to resolve only on 2xx (default behaviour)
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    mlPayload = mlResponse.data;
    console.log("[processClaim] ML response received:", mlPayload);

  } catch (mlError) {
    // ── Graceful degradation — ML service is unreachable or returned an error ──
    mlCallFailed = true;

    if (mlError.code === "ECONNREFUSED") {
      console.error(
        "[processClaim] ML Engine is not running. " +
        "Start it with: python app.py  |  Falling back to manual review."
      );
    } else if (mlError.code === "ECONNABORTED") {
      console.error(
        `[processClaim] ML Engine timed out after ${REQUEST_TIMEOUT_MS}ms. ` +
        "Falling back to manual review."
      );
    } else {
      console.error("[processClaim] Unexpected ML error:", mlError.message);
    }
  }

  // ── 3c. Derive the final claim decision ────────────────────
  let finalDecision;

  if (mlCallFailed || !mlPayload) {
    // ML service unavailable → queue for a human agent
    finalDecision = {
      userId,
      claim_id       : claimData.claim_id || null,
      time_hrs,
      distance_km,
      ml_fraud_flag  : false,          // unknown — do not auto-reject
      ml_action      : "flag_for_review",
      status         : "pending_manual_review",
      ml_raw_score   : null,
      ml_engine_error: true,           // signals that ML was unavailable
      processed_at   : admin.firestore.FieldValue.serverTimestamp(),
    };
  } else {
    /**
     * mlPayload shape (from app.py):
     * {
     *   status     : "ok",
     *   is_fraud   : bool,
     *   iso_score  : -1 | 1,
     *   action     : "flag_for_review" | "auto_approve"
     * }
     */
    const isFraud = mlPayload.is_fraud === true;

    finalDecision = {
      userId,
      claim_id       : claimData.claim_id || null,
      time_hrs,
      distance_km,
      ml_fraud_flag  : isFraud,
      ml_action      : mlPayload.action,          // "flag_for_review" | "auto_approve"
      status         : isFraud ? "flagged" : "approved",
      ml_raw_score   : mlPayload.iso_score,       // -1 or 1
      ml_engine_error: false,
      processed_at   : admin.firestore.FieldValue.serverTimestamp(),
    };
  }

  console.log("[processClaim] Final decision computed:", finalDecision);

  // ── 3d. Persist to Firestore ────────────────────────────────
  /**
   * Document path: claims/{userId}
   *
   * If you want one document per *claim* (not per user), change to:
   *   db.collection("claims").doc(claimData.claim_id)
   */
  try {
    const claimDocRef = db.collection("claims").doc(userId);

    // merge: true → preserves other user fields (e.g. policy info)
    await claimDocRef.set(finalDecision, { merge: true });

    console.log(
      `[processClaim] ✓ Firestore updated: claims/${userId} → status="${finalDecision.status}"`
    );
  } catch (firestoreError) {
    console.error(
      "[processClaim] ✗ Firestore write failed:",
      firestoreError.message
    );
    // Re-throw — Firestore persistence is critical and must not fail silently
    throw firestoreError;
  }

  return finalDecision;
}

// ─────────────────────────────────────────────────────────────
// 4. Module export & optional self-test
// ─────────────────────────────────────────────────────────────

module.exports = { processClaim };

/**
 * ── Quick smoke-test ──────────────────────────────────────────
 * Run this file directly to verify the end-to-end integration:
 *   node node_integration.js
 *
 * Prerequisites:
 *   1. Python ML server running on localhost:5000
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var set correctly
 */
if (require.main === module) {
  (async () => {
    console.log("=".repeat(60));
    console.log("KavachSathi — Node ↔ ML Integration Self-Test");
    console.log("=".repeat(60));

    // --- Test case 1: normal claim (should auto_approve) ---
    try {
      const result1 = await processClaim(
        { time_hrs: 480, distance_km: 3.5, claim_id: "CLAIM-001" },
        "user_uid_test_normal"
      );
      console.log("\n[Test 1 — Normal Claim] Result:", result1);
    } catch (err) {
      console.error("[Test 1] Error:", err.message);
    }

    // --- Test case 2: suspicious claim (should flag_for_review) ---
    try {
      const result2 = await processClaim(
        { time_hrs: 2, distance_km: 150, claim_id: "CLAIM-002" },
        "user_uid_test_fraud"
      );
      console.log("\n[Test 2 — Suspicious Claim] Result:", result2);
    } catch (err) {
      console.error("[Test 2] Error:", err.message);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Self-test complete.");
  })();
}
