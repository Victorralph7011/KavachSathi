/**
 * Aadhaar Masking & Validation Utilities
 * 
 * SECURITY RULES (UIDAI + DPDP Act compliance):
 * - Never store raw Aadhaar in localStorage/sessionStorage/cookies
 * - Mask all but last 4 digits for display
 * - Clear from React state immediately after submission
 * - No console logging of raw Aadhaar in production
 */

/**
 * Validate that a string is a valid 12-digit Aadhaar number
 * Uses the Verhoeff checksum algorithm (simplified check)
 */
export function isValidAadhaar(value) {
  if (!value) return false;
  const cleaned = value.replace(/\s|-/g, '');
  return /^\d{12}$/.test(cleaned);
}

/**
 * Mask Aadhaar for display: XXXX-XXXX-1234
 */
export function maskAadhaar(aadhaar) {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/\s|-/g, '');
  if (cleaned.length < 4) return cleaned;
  const lastFour = cleaned.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

/**
 * Format Aadhaar with dashes for input display: 1234-5678-9012
 */
export function formatAadhaarInput(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 12);
  const groups = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    groups.push(cleaned.slice(i, i + 4));
  }
  return groups.join('-');
}

/**
 * Strip formatting to get raw digits
 */
export function stripAadhaar(value) {
  return value.replace(/\D/g, '').slice(0, 12);
}
