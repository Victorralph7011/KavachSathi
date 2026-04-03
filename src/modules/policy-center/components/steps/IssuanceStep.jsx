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

const TRIGGER_LIST = [
  { icon: CloudRain, label: 'Heavy Rain', threshold: '> 60mm', status: 'ARMED', payout: '₹250' },
  { icon: Thermometer, label: 'Extreme Heat', threshold: '> 45°C', status: 'ARMED', payout: '₹150' },
  { icon: Wind, label: 'AQI Hazard', threshold: '> 300', status: 'ARMED', payout: '₹200' },
  { icon: Activity, label: 'Traffic Blockage', threshold: '> 90% density', status: 'ARMED', payout: '₹100' },
  { icon: Zap, label: 'Demand Surge', threshold: '> 3× surge', status: 'ARMED', payout: '₹75' },
];

const TX_BADGE_STYLES = {
  CLAIM_CENTER: 'bg-[#EFF6FF] text-[#1A3C5E]',
  SYSTEM: 'bg-gray-100 text-gray-500',
  PAYMENT: 'bg-[#DCFCE7] text-[#059669]',
  BILLING: 'bg-[#FEF3C7] text-[#E85D04]',
  ERROR: 'bg-red-50 text-red-500',
};

function gradeStyle(g) {
  if (g === 'A') return 'bg-[#EFF6FF] text-[#1A3C5E]';
  if (g === 'B') return 'bg-[#DCFCE7] text-[#059669]';
  return 'bg-[#FEF3C7] text-[#E85D04]';
}

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

        await issuePolicy(policyId, data);
        await recordPayment(policyId, data);
        await seedMockTriggers(policyId);
        
        setTimeout(() => {
          addLog('SYSTEM', 'Generating policy document...');
          addLog('SYSTEM', 'Arming parametric triggers...');
          addLog('CLAIM_CENTER', 'Rain > 60mm → Armed');
          addLog('CLAIM_CENTER', 'Heat > 45°C → Armed');
          addLog('CLAIM_CENTER', 'AQI > 300 → Armed');
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

  // ─── COMPONENT 5: "System Protected" dashboard (post-issuance) ─────────
  if (bindState === 'issued') {
    return (
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Hero Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, damping: 12 }}
              className="mx-auto mb-4"
            >
              <ShieldCheck size={64} className="text-[#0F7B6C] mx-auto animate-pulse" style={{ animationDuration: '3s' }} />
            </motion.div>
            <h2 className="text-3xl font-bold text-[#1A1A1A]">System Protected</h2>
            <p className="font-mono text-sm text-gray-400 mt-1">{policyId || 'KS-DEMO'}</p>
            <span className="inline-flex items-center gap-1.5 bg-[#DCFCE7] text-[#059669] rounded-full px-4 py-1.5 text-sm font-semibold mt-3">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              ISSUED · COVERAGE ACTIVE
            </span>

            {/* Data Strip */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
              {[
                { label: 'INSURED', value: fullName },
                { label: 'PLATFORM', value: <span>{platformInfo?.icon} {platformInfo?.name}</span> },
                { label: 'PREMIUM', value: <span className="font-['JetBrains_Mono',monospace] text-[#1A3C5E]">{formatINR(finalPremium)}/{termType === 'weekly' ? 'wk' : 'km'}</span> },
                { label: 'RISK GRADE', value: <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${gradeStyle(riskGrade)}`}>{riskGrade}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block">{label}</span>
                  <span className="text-sm font-semibold text-[#1A1A1A] mt-1 block">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-Touch Triggers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                ⚡ Zero-Touch Claim Triggers
              </h3>
              <span className="bg-[#DCFCE7] text-[#059669] rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                Monitoring
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TRIGGER_LIST.map((trigger, i) => (
                <motion.div
                  key={trigger.label}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <trigger.icon size={24} className="text-[#1A3C5E]" />
                    <span className="bg-[#DCFCE7] text-[#059669] rounded-full px-2 py-0.5 text-[10px] font-semibold">{trigger.status}</span>
                  </div>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{trigger.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{trigger.threshold}</p>
                  <p className="text-[#E85D04] font-bold text-sm mt-2">{trigger.payout}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transaction Log */}
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">Transaction Log</h3>
            <div className="bg-white rounded-2xl border border-gray-100 max-h-64 overflow-y-auto">
              {transactionLog.map((entry, i) => (
                <div key={i} className="border-b border-gray-50 px-4 py-3 flex items-center gap-3 last:border-b-0">
                  <span className="font-mono text-xs text-gray-400 w-20 shrink-0">{entry.time}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-mono ${TX_BADGE_STYLES[entry.type] || 'bg-gray-100 text-gray-500'}`}>
                    {entry.type}
                  </span>
                  <span className="text-sm text-[#1A1A1A]">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Access Command Center */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              to="/dashboard"
              style={{ color: '#ffffff' }}
              className="block w-full text-center bg-[#1A3C5E] hover:bg-[#0F2D47] !text-white rounded-2xl py-4 text-base font-semibold transition-all no-underline"
            >
              → Access Command Center
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── COMPONENT 4: Pre-issuance Review + Bind flow ─────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Policy Review Card */}
      <motion.div
        className="backdrop-blur-xl bg-white/40 rounded-2xl border border-white/20 shadow-xl p-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0F7B6C]" />
            <span className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider">Policy Summary</span>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold text-lg ${gradeStyle(riskGrade)}`}>{riskGrade}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'INSURED NAME', value: fullName || '—' },
            { label: 'PLATFORM', value: <span>{platformInfo?.icon} {platformInfo?.name || '—'}</span> },
            { label: 'WORKER ID', value: <span className="font-['JetBrains_Mono',monospace]">{workerId || '—'}</span> },
            { label: 'AADHAAR', value: <span className="font-['JetBrains_Mono',monospace]">{aadhaar ? maskAadhaar(aadhaar) : '—'}</span> },
            { label: 'BASE STATE', value: baseState || '—' },
            { label: 'RISK SCORE', value: <span className="font-['JetBrains_Mono',monospace] text-[#1A3C5E]">{riskScore?.toFixed(4) || '—'}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
              <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Term Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <span className="text-sm font-semibold text-[#1A1A1A] mb-3 block">Select Coverage Term</span>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleTermToggle('weekly')}
            className={`backdrop-blur-md border-2 rounded-2xl p-5 text-left cursor-pointer transition-all
              ${termType === 'weekly' ? 'border-[#1A3C5E] bg-white/50 shadow-sm' : 'border-white/40 bg-white/20 hover:border-[#1A3C5E] hover:bg-white/30'}
            `}
          >
            <Clock size={32} className="text-[#1A3C5E] mb-2" />
            <p className="font-bold text-[#1A1A1A]">Weekly</p>
            <p className="text-[#E85D04] font-semibold text-sm mt-1">
              {formatINR(calculatePremium(riskGrade, 'weekly', safeZoneDiscount))}/week
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleTermToggle('per-mile')}
            className={`backdrop-blur-md border-2 rounded-2xl p-5 text-left cursor-pointer transition-all
              ${termType === 'per-mile' ? 'border-[#1A3C5E] bg-white/50 shadow-sm' : 'border-white/40 bg-white/20 hover:border-[#1A3C5E] hover:bg-white/30'}
            `}
          >
            <Route size={32} className="text-[#1A3C5E] mb-2" />
            <p className="font-bold text-[#1A1A1A]">Per-Mile</p>
            <p className="text-[#E85D04] font-semibold text-sm mt-1">
              ₹{calculatePremium(riskGrade, 'per-mile')}/km
            </p>
          </button>
        </div>
      </motion.div>

      {/* Premium Display */}
      <motion.div
        className="bg-white/50 backdrop-blur-md rounded-2xl p-6 text-center border border-white/50 shadow-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="text-xs text-gray-400 uppercase tracking-wider block">Estimated Premium</span>
        <div className="mt-2 flex items-baseline justify-center gap-1">
          <span className="font-['JetBrains_Mono',monospace] text-5xl font-bold text-[#1A3C5E]">₹{finalPremium}</span>
          <span className="text-lg text-gray-400">/{termType === 'weekly' ? 'wk' : 'km'}</span>
        </div>

        {safeZoneDiscount > 0 && termType === 'weekly' && (
          <motion.div
            className="mt-4 pt-4 border-t border-[#BFDBFE] text-sm max-w-xs mx-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-between text-gray-500">
              <span>Base Premium</span>
              <span>{formatINR(basePremium)}</span>
            </div>
            <div className="flex justify-between text-[#0F7B6C] font-medium mt-1">
              <span>🛡️ Safe Zone Discount ({safeZone?.zoneName})</span>
              <span>-{formatINR(safeZoneDiscount)}</span>
            </div>
            <div className="h-px bg-[#BFDBFE] my-2" />
            <div className="flex justify-between font-semibold text-[#1A3C5E]">
              <span>Final Premium</span>
              <span>{formatINR(finalPremium)}/wk</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* DPDP Consent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={handleConsent}
            className="mt-1 w-4 h-4 accent-[#1A3C5E] rounded shrink-0"
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I consent to policy terms and data processing under the{' '}
            <strong className="text-[#1A3C5E] underline">Digital Personal Data Protection Act, 2023</strong>.
            {' '}Aadhaar data will be encrypted and used solely for identity verification.
            I authorize automatic payouts triggered by parametric conditions (weather, AQI, traffic).
          </span>
        </label>
        {errors.consentGiven && (
          <span className="text-xs text-red-500 mt-1 block">{errors.consentGiven.message}</span>
        )}
      </motion.div>

      {/* Bind Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <AnimatePresence mode="wait">
          {bindState === 'idle' && (
            <motion.button
              key="bind"
              type="button"
              onClick={handleBind}
              disabled={!consentGiven}
              whileHover={consentGiven ? { scale: 1.01 } : {}}
              whileTap={consentGiven ? { scale: 0.99 } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${consentGiven
                  ? 'bg-[#E85D04] hover:bg-[#D14F00] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <CreditCard size={18} />
              💳 Bind Policy — {formatINR(finalPremium)}
            </motion.button>
          )}

          {bindState === 'binding' && (
            <motion.div
              key="binding"
              className="w-full py-3.5 rounded-xl bg-[#EFF6FF] flex items-center justify-center gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-5 h-5 border-2 border-[#1A3C5E] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm font-medium text-[#1A3C5E]">Processing payment...</span>
            </motion.div>
          )}

          {bindState === 'bound' && (
            <motion.div
              key="bound"
              className="w-full py-3.5 rounded-xl bg-[#F0FDF4] border border-[#059669]/30 flex flex-col items-center justify-center gap-1 relative overflow-hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div 
                className="absolute inset-0 border-2 border-[#059669] rounded-xl"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#059669]" />
                <span className="text-sm font-semibold text-[#059669]">Payment confirmed — issuing policy...</span>
              </div>
              {paymentData && (
                <span className="text-xs text-gray-400 font-mono">
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
