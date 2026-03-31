import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Clock, Route, CheckCircle2, 
  CloudRain, Thermometer, Wind, Activity, Zap,
  Shield, CreditCard 
} from 'lucide-react';
import { calculatePremium } from '../../utils/riskEngine';
import { maskAadhaar } from '../../utils/aadhaarMask';
import { PLATFORMS } from '../../constants/platforms';
import { launchRazorpayCheckout, formatINR } from '../../../billing-center/razorpay';
import { issuePolicy, recordPayment, seedMockTriggers } from '../../services/policyService';
import { Link } from 'react-router-dom';

/**
 * Step 3 — Issuance & Claims Dashboard
 * Policy review → Term selection → DPDP consent → Razorpay payment → 
 * BOUND → ISSUED → "System Protected" with Active Trigger slots
 */
export default function IssuanceStep({ form, onBind, policyId }) {
  const { setValue, watch, formState: { errors } } = form;
  const platform = watch('platform');
  const fullName = watch('fullName');
  const workerId = watch('workerId');
  const aadhaar = watch('aadhaar');
  const riskGrade = watch('riskGrade');
  const riskScore = watch('riskScore');
  const baseState = watch('baseState');
  const safeZone = watch('safeZone');
  const termType = watch('termType') || 'weekly';
  const consentGiven = watch('consentGiven') || false;

  const [bindState, setBindState] = useState('idle');
  const [paymentData, setPaymentData] = useState(null);
  const [transactionLog, setTransactionLog] = useState([]);

  const platformInfo = platform ? PLATFORMS[platform] : null;
  const safeZoneDiscount = safeZone?.isSafe ? safeZone.discount : 0;
  const basePremium = riskGrade ? calculatePremium(riskGrade, termType, 0) : 0;
  const finalPremium = riskGrade ? calculatePremium(riskGrade, termType, safeZoneDiscount) : 0;

  const addLog = (type, message) => {
    setTransactionLog(prev => [
      { type, message, time: new Date().toLocaleTimeString('en-IN', { hour12: false }) },
      ...prev,
    ]);
  };

  const handleTermToggle = (type) => {
    setValue('termType', type, { shouldValidate: true });
    const newPremium = calculatePremium(riskGrade, type, safeZoneDiscount);
    setValue('premiumAmount', newPremium, { shouldValidate: true });
  };

  const handleConsent = (e) => {
    setValue('consentGiven', e.target.checked, { shouldValidate: true });
  };

  const handleBind = async () => {
    if (!consentGiven) return;

    setBindState('binding');
    addLog('SYSTEM', 'Initiating policy binding...');
    setValue('premiumAmount', finalPremium, { shouldValidate: true });

    // Launch Razorpay checkout
    addLog('BILLING', 'Launching Razorpay checkout...');

    await launchRazorpayCheckout({
      amount: finalPremium,
      policyId: policyId || 'KS-DEMO',
      insuredName: fullName,
      platform: platform,
      termType,
      onSuccess: async (data) => {
        setPaymentData(data);
        addLog('PAYMENT', `Payment received: ${data.razorpay_payment_id}`);
        addLog('SYSTEM', 'Updating policy status → ISSUED');
        
        setBindState('bound');

        // Write to Firestore securely
        await issuePolicy(policyId, data);
        await recordPayment(policyId, data);
        await seedMockTriggers(policyId);
        
        setTimeout(() => {
          addLog('SYSTEM', 'Generating policy document...');
          addLog('SYSTEM', 'Arming parametric triggers...');
          addLog('CLAIM_CENTER', 'RAIN > 60mm → ARMED');
          addLog('CLAIM_CENTER', 'HEAT > 45°C → ARMED');
          addLog('CLAIM_CENTER', 'AQI > 300 → ARMED');
          setBindState('issued');
          if (onBind) onBind(data);
        }, 1500);
      },
      onFailure: (err) => {
        addLog('ERROR', `Payment failed: ${err.description}`);
        setBindState('idle');
      },
      onDismiss: () => {
        addLog('SYSTEM', 'Payment cancelled by user');
        setBindState('idle');
      },
    });
  };

  // ─── "System Protected" dashboard (post-issuance) ─────────
  if (bindState === 'issued') {
    return (
      <div className="step-issuance">
        <motion.div
          className="system-protected"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hero badge */}
          <div className="protected-hero">
            <motion.div className="protected-hero__shield"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, damping: 12 }}
            >
              <Shield size={48} />
            </motion.div>
            <h2 className="protected-hero__title">SYSTEM PROTECTED</h2>
            <span className="text-mono protected-hero__id">{policyId || 'KS-DEMO'}</span>
            <span className="text-mono protected-hero__status">STATUS: ISSUED · COVERAGE ACTIVE</span>
          </div>

          {/* Policy summary row */}
          <div className="protected-summary glass">
            <div className="protected-summary__item">
              <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.6rem' }}>INSURED</span>
              <span className="text-mono">{fullName}</span>
            </div>
            <div className="protected-summary__item">
              <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.6rem' }}>PLATFORM</span>
              <span style={{ color: platformInfo?.color }}>{platformInfo?.icon} {platformInfo?.name}</span>
            </div>
            <div className="protected-summary__item">
              <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.6rem' }}>PREMIUM</span>
              <span className="text-mono neon-text">{formatINR(finalPremium)}/{termType === 'weekly' ? 'wk' : 'km'}</span>
            </div>
            <div className="protected-summary__item">
              <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.6rem' }}>RISK GRADE</span>
              <span className={`grade--${riskGrade}`} style={{ fontWeight: 700, fontSize: '1.2rem' }}>{riskGrade}</span>
            </div>
          </div>

          {/* Active Protection Triggers (Claim Center) */}
          <div className="active-triggers">
            <div className="active-triggers__header">
              <Zap size={14} style={{ color: 'var(--neon)' }} />
              <span className="text-label" style={{ color: 'var(--neon)' }}>ZERO-TOUCH CLAIM TRIGGERS</span>
              <span className="text-mono active-triggers__pulse">● MONITORING</span>
            </div>

            <div className="triggers-grid">
              {[
                { icon: CloudRain, label: 'Heavy Rain', threshold: '> 60mm', status: 'ARMED', payout: '₹250' },
                { icon: Thermometer, label: 'Extreme Heat', threshold: '> 45°C', status: 'ARMED', payout: '₹150' },
                { icon: Wind, label: 'AQI Hazard', threshold: '> 300', status: 'ARMED', payout: '₹200' },
                { icon: Activity, label: 'Traffic Blockage', threshold: '> 90% density', status: 'ARMED', payout: '₹100' },
                { icon: Zap, label: 'Demand Surge', threshold: '> 3× surge', status: 'ARMED', payout: '₹75' },
              ].map((trigger, i) => (
                <motion.div
                  key={trigger.label}
                  className="trigger-card glass"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <div className="trigger-card__icon">
                    <trigger.icon size={18} />
                  </div>
                  <div className="trigger-card__info">
                    <span className="trigger-card__label">{trigger.label}</span>
                    <span className="trigger-card__threshold text-mono">{trigger.threshold}</span>
                  </div>
                  <div className="trigger-card__status">
                    <span className="trigger-status trigger-status--armed text-mono">{trigger.status}</span>
                    <span className="trigger-card__payout text-mono">{trigger.payout}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transaction Log */}
          <div className="transaction-log glass">
            <div className="transaction-log__header">
              <span className="text-label" style={{ color: 'var(--white)' }}>Transaction Log</span>
            </div>
            <div className="transaction-log__entries">
              {transactionLog.map((entry, i) => (
                <div key={i} className="tx-entry text-mono">
                  <span className="tx-entry__time">[{entry.time}]</span>
                  <span className={`tx-entry__type tx-entry__type--${entry.type.toLowerCase()}`}>{entry.type}</span>
                  <span className="tx-entry__msg">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div 
            style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link to="/dashboard" className="bind-btn ready" style={{ textDecoration: 'none', padding: '16px 32px', width: '100%' }}>
              <ShieldCheck size={20} />
              <span>ACCESS COMMAND CENTER</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── Pre-issuance: Review + Bind flow ─────────────────────
  return (
    <div className="step-issuance">
      {/* Policy Review Card */}
      <motion.div className="review-card glass"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="review-card__header">
          <ShieldCheck size={18} style={{ color: 'var(--neon)' }} />
          <span className="text-label" style={{ color: 'var(--neon)' }}>Policy Summary</span>
          <span className={`review-grade grade--${riskGrade}`}>{riskGrade}</span>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span className="review-item__label text-mono">insuredName</span>
            <span className="review-item__value">{fullName || '—'}</span>
          </div>
          <div className="review-item">
            <span className="review-item__label text-mono">platform</span>
            <span className="review-item__value" style={{ color: platformInfo?.color }}>
              {platformInfo?.icon} {platformInfo?.name || '—'}
            </span>
          </div>
          <div className="review-item">
            <span className="review-item__label text-mono">workerId</span>
            <span className="review-item__value text-mono">{workerId || '—'}</span>
          </div>
          <div className="review-item">
            <span className="review-item__label text-mono">aadhaar</span>
            <span className="review-item__value text-mono">{aadhaar ? maskAadhaar(aadhaar) : '—'}</span>
          </div>
          <div className="review-item">
            <span className="review-item__label text-mono">baseState</span>
            <span className="review-item__value">{baseState || '—'}</span>
          </div>
          <div className="review-item">
            <span className="review-item__label text-mono">riskScore</span>
            <span className="review-item__value text-mono neon-text">{riskScore?.toFixed(4) || '—'}</span>
          </div>
        </div>
      </motion.div>

      {/* Term Type Selection */}
      <motion.div className="term-selector"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <span className="text-label" style={{ color: 'var(--white)' }}>Select Coverage Term</span>
        <div className="term-options">
          <button type="button" className={`term-option ${termType === 'weekly' ? 'active' : ''}`}
            onClick={() => handleTermToggle('weekly')}
          >
            <Clock size={20} />
            <div className="term-option__text">
              <span className="term-option__title">Weekly</span>
              <span className="term-option__desc text-mono">
                {formatINR(calculatePremium(riskGrade, 'weekly', safeZoneDiscount))}/week
              </span>
            </div>
          </button>
          <button type="button" className={`term-option ${termType === 'per-mile' ? 'active' : ''}`}
            onClick={() => handleTermToggle('per-mile')}
          >
            <Route size={20} />
            <div className="term-option__text">
              <span className="term-option__title">Per-Mile</span>
              <span className="term-option__desc text-mono">₹{calculatePremium(riskGrade, 'per-mile')}/km</span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Premium Display with Dynamic Pricing */}
      <motion.div className="premium-display glass"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>ESTIMATED PREMIUM</span>
        <div className="premium-display__amount">
          <span className="premium-display__currency">₹</span>
          <span className="premium-display__value">{finalPremium}</span>
          <span className="premium-display__period text-mono">/{termType === 'weekly' ? 'wk' : 'km'}</span>
        </div>

        {/* Dynamic pricing breakdown */}
        {safeZoneDiscount > 0 && termType === 'weekly' && (
          <motion.div className="discount-breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4 }}
          >
            <div className="discount-breakdown__row">
              <span className="text-mono">Base Premium</span>
              <span className="text-mono">{formatINR(basePremium)}</span>
            </div>
            <div className="discount-breakdown__row discount-breakdown__row--discount">
              <span className="text-mono">🛡️ Safe Zone Discount ({safeZone?.zoneName})</span>
              <span className="text-mono" style={{ color: 'var(--neon)' }}>-{formatINR(safeZoneDiscount)}</span>
            </div>
            <div className="discount-breakdown__divider" />
            <div className="discount-breakdown__row discount-breakdown__row--total">
              <span className="text-mono">Final Premium</span>
              <span className="text-mono neon-text">{formatINR(finalPremium)}/wk</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* DPDP Act 2023 Consent */}
      <motion.div className="consent-block"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <label className="consent-checkbox">
          <input type="checkbox" checked={consentGiven} onChange={handleConsent} />
          <span className="consent-checkbox__mark" />
          <span className="consent-checkbox__text text-mono">
            I consent to policy terms and data processing under the <strong style={{ color: 'var(--neon)' }}>Digital Personal Data Protection Act, 2023</strong>.
            Aadhaar data will be encrypted and used solely for identity verification.
            I authorize automatic payouts triggered by parametric conditions (weather, AQI, traffic).
          </span>
        </label>
        {errors.consentGiven && (
          <span className="reg-field__error text-mono">{errors.consentGiven.message}</span>
        )}
      </motion.div>

      {/* Bind Policy Button */}
      <motion.div className="bind-action"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <AnimatePresence mode="wait">
          {bindState === 'idle' && (
            <motion.button key="bind" type="button"
              className={`bind-btn ${consentGiven ? 'ready' : 'disabled'}`}
              onClick={handleBind}
              disabled={!consentGiven}
              whileHover={consentGiven ? { scale: 1.02 } : {}}
              whileTap={consentGiven ? { scale: 0.98 } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CreditCard size={20} />
              <span>BIND POLICY — {formatINR(finalPremium)}</span>
            </motion.button>
          )}

          {bindState === 'binding' && (
            <motion.div key="binding" className="bind-status binding"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div className="bind-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-mono">PROCESSING PAYMENT...</span>
            </motion.div>
          )}

          {bindState === 'bound' && (
            <motion.div key="bound" className="bind-status bound"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <CheckCircle2 size={20} />
              <span className="text-mono">PAYMENT CONFIRMED — ISSUING POLICY...</span>
              {paymentData && (
                <span className="text-mono" style={{ fontSize: '0.6rem', color: 'var(--white-muted)' }}>
                  TX: {paymentData.razorpay_payment_id}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
