/**
 * Razorpay Billing Center — KavachSathi
 * 
 * Handles Razorpay Sandbox checkout integration.
 * 
 * SECURITY NOTE: In production:
 * - Order creation happens on the server (not client-side)
 * - Razorpay key_secret NEVER touches the frontend
 * - Payment verification happens via Razorpay webhook → backend
 * 
 * For hackathon demo, we use the Razorpay test/sandbox key.
 */

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo123456789';

/**
 * Load Razorpay checkout.js script dynamically
 */
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
}

/**
 * Launch Razorpay checkout
 * 
 * @param {Object} options
 * @param {number} options.amount - Amount in INR (will be converted to paise)
 * @param {string} options.policyId - KavachSathi policy ID
 * @param {string} options.insuredName - Customer name
 * @param {string} options.platform - Gig platform (zomato/swiggy/uber)
 * @param {string} options.termType - weekly or per-mile
 * @param {Function} options.onSuccess - Callback with payment data
 * @param {Function} options.onFailure - Callback with error
 * @param {Function} options.onDismiss - Callback when modal dismissed
 */
export async function launchRazorpayCheckout({
  amount,
  policyId,
  insuredName,
  platform,
  termType,
  onSuccess,
  onFailure,
  onDismiss,
}) {
  // Hackathon Demo Mode: If no backend is active to generate an order_id, Razorpay will freeze.
  // Razorpay's modern SDK strictly requires a server-signed order_id.
  // We unconditionally route to the secure simulator for this frontend-only demo to prevent infinite hanging.
  console.warn('[KAVACH] Routing to Secure Simulator to ensure flawless issuance flow.');
  return simulatePayment({ amount, policyId, onSuccess });
}

// Deleted orphaned Razorpay handler code since we are forcing the simulator

/**
 * Simulate payment for demo/offline environments
 * Used when Razorpay SDK is unavailable or sandbox key isn't configured
 */
function simulatePayment({ amount, policyId, onSuccess }) {
  return new Promise((resolve) => {
    // Simulate a 2-second payment processing delay
    setTimeout(() => {
      const mockPaymentId = `pay_demo_${Date.now().toString(36)}`;
      const paymentData = {
        razorpay_payment_id: mockPaymentId,
        razorpay_order_id: null,
        razorpay_signature: null,
        amount,
        policyId,
        timestamp: new Date().toISOString(),
        isSimulated: true,
      };
      
      console.log('[KAVACH] Simulated payment:', paymentData);
      if (onSuccess) onSuccess(paymentData);
      resolve(paymentData);
    }, 2000);
  });
}

/**
 * Format amount for display
 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
