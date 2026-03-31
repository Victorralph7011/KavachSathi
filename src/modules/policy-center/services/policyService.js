/**
 * Policy Firestore Service — KavachSathi
 * 
 * Manages the full policy lifecycle in Firestore:
 * DRAFT → QUOTED → BOUND → ISSUED
 * 
 * Collection: policies
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import db from '../../../lib/firebase';

const POLICIES_COLLECTION = 'policies';

/**
 * Generate a policy ID: KS-{timestamp}-{random}
 */
function generatePolicyId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KS-${ts}-${rand}`;
}

/**
 * Step 1: Create Draft Policy
 * Called when user completes the Persona step
 */
export async function createDraftPolicy(personaData, ownerId) {
  const policyId = generatePolicyId();
  
  const policyDoc = {
    policyId,
    ownerId: ownerId || null,
    status: 'DRAFT',
    
    // Persona data
    insuredName: personaData.fullName,
    platform: personaData.platform,
    workerId: personaData.workerId,
    // Aadhaar: store only masked version (UIDAI compliance)
    aadhaarMasked: `XXXX-XXXX-${personaData.aadhaar.slice(-4)}`,
    
    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    draftedAt: serverTimestamp(),
    
    // Lifecycle tracking
    stateHistory: [
      {
        state: 'DRAFT',
        timestamp: new Date().toISOString(),
        note: 'Submission initiated — persona captured',
      },
    ],
    
    // Placeholders for later steps
    location: null,
    baseState: null,
    riskScore: null,
    riskGrade: null,
    riskFactors: null,
    termType: null,
    estimatedPremium: null,
    discounts: [],
    paymentId: null,
    boundAt: null,
    issuedAt: null,
  };

  try {
    await setDoc(doc(db, POLICIES_COLLECTION, policyId), policyDoc);
    console.log(`[KAVACH] Policy ${policyId} created as DRAFT`);
    return { success: true, policyId, data: policyDoc };
  } catch (error) {
    console.error('[KAVACH] Error creating draft:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Step 2: Update to QUOTED with risk data
 * Called when Risk Engine completes scoring
 */
export async function quotePolicyWithRisk(policyId, riskData) {
  const updates = {
    status: 'QUOTED',
    
    // GPS & location
    location: {
      latitude: riskData.latitude,
      longitude: riskData.longitude,
    },
    baseState: riskData.baseState,
    
    // Risk assessment
    riskScore: riskData.riskScore,
    riskGrade: riskData.riskGrade,
    riskFactors: riskData.riskFactors,
    
    // Dynamic pricing
    estimatedPremium: riskData.estimatedPremium,
    discounts: riskData.discounts || [],
    safeZoneDiscount: riskData.safeZoneDiscount || 0,
    
    // Timestamps
    updatedAt: serverTimestamp(),
    quotedAt: serverTimestamp(),
    
    // Append to state history
    stateHistory: riskData.stateHistory || [],
  };

  try {
    await updateDoc(doc(db, POLICIES_COLLECTION, policyId), updates);
    console.log(`[KAVACH] Policy ${policyId} updated to QUOTED`);
    return { success: true };
  } catch (error) {
    console.error('[KAVACH] Error quoting:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Step 3a: Bind Policy
 * Called after DPDP consent + before payment
 */
export async function bindPolicy(policyId, bindData) {
  const updates = {
    status: 'BOUND',
    termType: bindData.termType,
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    boundAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, POLICIES_COLLECTION, policyId), updates);
    console.log(`[KAVACH] Policy ${policyId} BOUND`);
    return { success: true };
  } catch (error) {
    console.error('[KAVACH] Error binding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Step 3b: Issue Policy (post-payment)
 * Called after Razorpay payment success
 */
export async function issuePolicy(policyId, paymentData) {
  const updates = {
    status: 'ISSUED',
    paymentId: paymentData.razorpay_payment_id || paymentData.paymentId,
    paymentOrderId: paymentData.razorpay_order_id || null,
    paymentSignature: paymentData.razorpay_signature || null,
    paymentAmount: paymentData.amount,
    paymentCurrency: 'INR',
    updatedAt: serverTimestamp(),
    issuedAt: serverTimestamp(),
    
    // Coverage details
    coverageStartDate: new Date().toISOString(),
    coverageEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
    
    // Active triggers (Claim Center slots)
    activeTriggers: [
      { type: 'RAIN', threshold: '> 60mm', status: 'ARMED', lastChecked: null },
      { type: 'HEAT', threshold: '> 45°C', status: 'ARMED', lastChecked: null },
      { type: 'AQI', threshold: '> 300', status: 'ARMED', lastChecked: null },
      { type: 'TRAFFIC', threshold: '> 90% density', status: 'ARMED', lastChecked: null },
      { type: 'SURGE', threshold: '> 3x demand', status: 'ARMED', lastChecked: null },
    ],
  };

    try {
      await updateDoc(doc(db, POLICIES_COLLECTION, policyId), updates);
      console.log(`[KAVACH] Policy ${policyId} ISSUED — coverage active`);
      return { success: true };
    } catch (error) {
      console.error('[KAVACH] Error issuing:', error);
      return { success: false, error: error.message };
    }
}

/**
 * Record Payment in subcollection
 */
export async function recordPayment(policyId, paymentData) {
  try {
    const paymentsRef = collection(db, POLICIES_COLLECTION, policyId, 'payments');
    await addDoc(paymentsRef, {
      ...paymentData,
      status: 'SUCCESS',
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error('[KAVACH] Error recording payment:', err);
    return { success: false };
  }
}

/**
 * Seed Mock Triggers in subcollection for the Radar
 */
export async function seedMockTriggers(policyId) {
  try {
    const triggersRef = collection(db, POLICIES_COLLECTION, policyId, 'triggers');
    await addDoc(triggersRef, {
      event: 'SYSTEM_ARMED',
      reason: 'Coverage initiated',
      status: 'MONITORING',
      payoutAmount: 0,
      createdAt: new Date().toISOString()
    });
    // Add one fake resolved trigger to make demo look active
    await addDoc(triggersRef, {
      event: 'RAINFALL_BREACH',
      reason: 'Sensor detected 65mm rain in 1hr threshold',
      status: 'RESOLVED',
      payoutAmount: 250,
      createdAt: new Date().toISOString()
    });
    return { success: true };
  } catch (err) {
    console.error('[KAVACH] Error seeding triggers:', err);
    return { success: false };
  }
}

/**
 * Fetch policy by ID
 */
export async function getPolicy(policyId) {
  try {
    const snap = await getDoc(doc(db, POLICIES_COLLECTION, policyId));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: false, error: 'Policy not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch policies by worker ID
 */
export async function getPoliciesByWorker(workerId) {
  try {
    const q = query(
      collection(db, POLICIES_COLLECTION),
      where('workerId', '==', workerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return { success: true, data: snap.docs.map((d) => d.data()) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Transaction log entry (for terminal display)
 */
export function createTransactionLogEntry(type, details) {
  return {
    type,
    timestamp: new Date().toISOString(),
    timeFormatted: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    ...details,
  };
}
