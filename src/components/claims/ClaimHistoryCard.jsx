import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Search, ShieldCheck, ShieldAlert, Zap, CheckCircle2, CreditCard, AlertTriangle, MapPin } from 'lucide-react';

/**
 * KavachSathi — ClaimHistoryCard: Zero-Touch State Machine
 * =========================================================
 * 
 * 5-Stage automated lifecycle:
 *   DETECTED → VALIDATING → APPROVED → DISBURSED → PAID
 * 
 * Each stage advances automatically with realistic timing.
 * The POP Validator runs during VALIDATING with visual evidence strip.
 * Payout is calculated using Urban/Rural L_avg × D_exposed.
 * 
 * COMPLIANCE: Loss of Income ONLY · Food Delivery · Weekly ₹20–₹50
 */

// ─── Stage Definitions ──────────────────────────────────────
const STAGES = [
  { key: 'DETECTED',   label: 'Signal Detected',      icon: Search,       color: '#F59E0B', duration: 1800 },
  { key: 'VALIDATING', label: 'POP Validation',        icon: ShieldAlert,  color: '#A855F7', duration: 2800 },
  { key: 'APPROVED',   label: 'Actuarially Approved',  icon: CheckCircle2, color: '#3B82F6', duration: 1500 },
  { key: 'DISBURSED',  label: 'Payout Dispatched',     icon: CreditCard,   color: '#10B981', duration: 1200 },
  { key: 'PAID',       label: 'Settlement Complete',   icon: ShieldCheck,  color: '#059669', duration: 0 },
];

const FRAUD_STAGE = { key: 'FRAUD_BLOCKED', label: 'Fraud Blocked', icon: ShieldAlert, color: '#DC2626', duration: 0 };

function generateTxnId() {
  return `TXN${Date.now()}`;
}

// ─── POP Validator Evidence Strip ────────────────────────────
function POPValidatorStrip({ isValidating, passed }) {
  const checks = [
    { label: 'GPS', value: 'CONSISTENT', ok: true },
    { label: 'VELOCITY', value: '< 100 KM/H', ok: true },
    { label: 'PLATFORM', value: 'ACTIVE', ok: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#0F172A] rounded-xl p-4 border border-white/5"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={14} className={isValidating ? 'text-amber-400 animate-pulse' : passed ? 'text-emerald-400' : 'text-red-400'} />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
          {isValidating ? 'POP VALIDATOR — RUNNING...' : passed ? 'POP VALIDATOR — PASSED ✓' : 'POP VALIDATOR — BLOCKED ✕'}
        </span>
      </div>
      <div className="flex gap-2">
        {checks.map((check, i) => (
          <motion.div
            key={check.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: isValidating ? i * 0.6 : 0, duration: 0.3 }}
            className={`flex-1 rounded-lg px-3 py-2 border text-center ${
              isValidating && i >= Math.floor(Date.now() / 600 % 3)
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{check.label}</p>
            <p className={`font-mono text-xs font-bold mt-0.5 ${
              isValidating ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {check.value}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Audit Timeline Stepper ─────────────────────────────────
function AuditTimeline({ currentStageIndex, timestamps, isFraud }) {
  return (
    <div className="mt-4 relative">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Audit Trail</p>
      <div className="flex flex-col gap-0">
        {STAGES.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const isPending = i > currentStageIndex;
          const timestamp = timestamps[stage.key];
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex items-start gap-3 relative">
              {/* Vertical connector line */}
              {i < STAGES.length - 1 && (
                <div className={`absolute left-[11px] top-[24px] w-0.5 h-6 ${
                  isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-amber-400' : 'bg-slate-700'
                }`} />
              )}

              {/* Step indicator */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                isCompleted ? 'bg-emerald-500 border-emerald-500' :
                isCurrent ? 'bg-amber-500/20 border-amber-500 animate-pulse' :
                isFraud && i >= currentStageIndex ? 'bg-red-500/20 border-red-500/40' :
                'bg-slate-800 border-slate-700'
              }`}>
                <Icon size={12} className={
                  isCompleted ? 'text-white' :
                  isCurrent ? 'text-amber-400' :
                  'text-slate-600'
                } />
              </div>

              {/* Label + timestamp */}
              <div className="flex-1 pb-5">
                <p className={`text-xs font-bold ${
                  isCompleted ? 'text-emerald-600' :
                  isCurrent ? 'text-amber-600' :
                  'text-slate-400'
                }`}>
                  {stage.label}
                </p>
                {timestamp && (
                  <p className="font-mono text-[10px] text-slate-500 mt-0.5">
                    {new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
                {isPending && !timestamp && (
                  <p className="text-[10px] text-slate-600 italic mt-0.5">Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payout Computation ─────────────────────────────────────
function computePayout(areaCategory, triggerValue, triggerType) {
  const lAvg = areaCategory === 'RURAL' ? 400 : 800;
  // Guard: if no valid trigger value, return a minimum payout
  if (!triggerValue || triggerValue <= 0) return Math.round(lAvg * 0.3);
  // D_exposed: partial day based on severity
  let severity = 0;
  if (triggerType === 'RAINFALL') {
    severity = Math.max(0, Math.min((triggerValue - 60) / 60, 1)); // 0-1 scale above 60mm
  } else if (triggerType === 'AQI') {
    severity = Math.max(0, Math.min((triggerValue - 300) / 200, 1)); // 0-1 scale above 300
  }
  const dExposed = 0.3 + severity * 0.7; // 0.3 to 1.0 days
  return Math.round(lAvg * dExposed);
}

// ─── Main ClaimHistoryCard ───────────────────────────────────
export default function ClaimHistoryCard({ claim, areaCategory, isSelected, onSelect }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [timestamps, setTimestamps] = useState({});
  const [txnId, setTxnId] = useState('');
  const [popPassed, setPopPassed] = useState(false);
  const [showPOP, setShowPOP] = useState(false);
  const timerRef = useRef(null);

  // Determine the initial state from the claim
  const claimStatus = claim.status || claim.state || 'DETECTED';
  const isFraud = claimStatus === 'FRAUD_BLOCKED';
  const isAlreadyTerminal = claimStatus === 'PAID' || claimStatus === 'PAYOUT_DISPATCHED' || claimStatus === 'RESOLVED' || claimStatus === 'DISBURSED';

  // Detect trigger info
  const triggerType = (claim.event || claim.trigger_type || '').toUpperCase();
  const isRainfall = triggerType.includes('RAIN');
  const isAQI = triggerType.includes('AQI');
  const triggerValue = claim.value || claim.trigger_value || (isRainfall ? 65 : isAQI ? 337 : 0);

  // Calculate actuarial payout
  const calculatedPayout = claim.payoutAmount > 0 
    ? claim.payoutAmount 
    : computePayout(areaCategory || 'URBAN', triggerValue, isRainfall ? 'RAINFALL' : 'AQI');

  // Auto-advance state machine
  useEffect(() => {
    // If already terminal, jump to final state
    if (isAlreadyTerminal) {
      setCurrentStage(4); // PAID
      const now = new Date();
      setTimestamps({
        DETECTED: new Date(now - 8000).toISOString(),
        VALIDATING: new Date(now - 6000).toISOString(),
        APPROVED: new Date(now - 4000).toISOString(),
        DISBURSED: new Date(now - 2000).toISOString(),
        PAID: now.toISOString(),
      });
      setTxnId(claim.paymentId || claim.txn_id || generateTxnId());
      setPopPassed(true);
      return;
    }

    if (isFraud) {
      setCurrentStage(1); // Stuck at VALIDATING
      setTimestamps({
        DETECTED: new Date(new Date() - 4000).toISOString(),
        VALIDATING: new Date().toISOString(),
      });
      return;
    }

    // Start the auto-advance pipeline
    const startTimestamp = new Date();
    setTimestamps({ DETECTED: startTimestamp.toISOString() });
    setCurrentStage(0);

    let stageIdx = 0;
    const advanceStage = () => {
      if (stageIdx >= STAGES.length - 1) return;
      stageIdx++;
      setCurrentStage(stageIdx);
      setTimestamps(prev => ({
        ...prev,
        [STAGES[stageIdx].key]: new Date().toISOString(),
      }));

      // Show POP strip during VALIDATING
      if (stageIdx === 1) {
        setShowPOP(true);
      }
      if (stageIdx === 2) {
        setPopPassed(true);
      }
      if (stageIdx === 3) {
        setTxnId(generateTxnId());
      }

      // Schedule next advance
      if (stageIdx < STAGES.length - 1) {
        timerRef.current = setTimeout(advanceStage, STAGES[stageIdx].duration);
      }
    };

    timerRef.current = setTimeout(advanceStage, STAGES[0].duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [claim.id]);

  const stageConfig = isFraud ? FRAUD_STAGE : STAGES[currentStage];
  const StageIcon = stageConfig.icon;
  const isTerminal = currentStage >= 4 || isFraud;

  return (
    <motion.div
      onClick={() => onSelect?.(claim)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`cursor-pointer bg-white/10 backdrop-blur-xl border rounded-2xl p-6 transition-all relative overflow-hidden
        ${isFraud ? 'border-red-400/40 bg-red-50/5' : ''}
        ${isSelected && !isFraud ? 'border-[#FF6B00]/60 ring-1 ring-[#FF6B00]/30 scale-[1.01]' : ''}
        ${isSelected && isFraud ? 'border-red-500 ring-1 ring-red-500/30 scale-[1.01]' : ''}
        ${!isSelected && !isFraud ? 'border-white/20 hover:bg-white/15 hover:border-white/30' : ''}
      `}
    >
      {/* Glow accent */}
      {!isFraud && currentStage >= 4 && (
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl bg-emerald-500/10 pointer-events-none" />
      )}

      {/* Header: Event + Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base font-bold text-[#1A1A1A]">
            {isRainfall ? '🌧️' : isAQI ? '💨' : '⚡'} {claim.event || 'Parametric Event'}
          </p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
            {new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          {claim.source === 'backend' && (
            <span className="inline-block mt-1.5 bg-[#1A3C5E]/10 text-[#1A3C5E] rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider">
              BACKEND PIPELINE
            </span>
          )}
        </div>
        
        {/* Animated Status Badge */}
        <AnimatePresence mode="wait">
          <motion.span
            key={stageConfig.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shadow-sm`}
            style={{
              backgroundColor: `${stageConfig.color}15`,
              borderColor: `${stageConfig.color}40`,
              color: stageConfig.color,
            }}
          >
            {(currentStage < 4 && !isFraud) && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: stageConfig.color }} />
            )}
            <StageIcon size={12} />
            {stageConfig.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Compliance strip */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-bold text-amber-600 bg-amber-100/60 rounded px-1.5 py-0.5 border border-amber-200/50">LOSS OF INCOME ONLY</span>
        <span className="text-[9px] font-bold text-blue-600 bg-blue-100/60 rounded px-1.5 py-0.5 border border-blue-200/50">FOOD DELIVERY</span>
        <span className="text-[9px] font-bold text-slate-500 bg-slate-100/60 rounded px-1.5 py-0.5 border border-slate-200/50">{areaCategory || 'URBAN'}</span>
      </div>

      {/* Payout Amount */}
      <div className="py-4 border-t border-white/10">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actuarial Payout</p>
        <div className="flex items-end gap-2 mt-1">
          <p className={`text-4xl font-black tracking-tight ${isFraud ? 'text-red-600 line-through' : 'text-[#1A1A1A]'}`}>
            ₹{calculatedPayout.toLocaleString('en-IN')}
          </p>
          {!isFraud && (
            <span className="text-[10px] text-slate-500 font-medium mb-1.5">
              L<sub>avg</sub>={(areaCategory || 'URBAN') === 'RURAL' ? '₹400' : '₹800'}/day × D<sub>exp</sub>
            </span>
          )}
        </div>
      </div>

      {/* Trigger Evidence */}
      {triggerValue > 0 && (
        <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oracle Reading</span>
            <span className="font-mono text-sm font-bold" style={{ color: isRainfall ? '#3B82F6' : '#A855F7' }}>
              {triggerValue}{isRainfall ? 'mm' : ' AQI'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((triggerValue / (isRainfall ? 120 : 500)) * 100, 100)}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: isRainfall ? '#3B82F6' : '#A855F7' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-600">0</span>
            <span className="text-[9px] text-red-500 font-bold">Threshold: {isRainfall ? '60mm' : '300 AQI'}</span>
            <span className="text-[9px] text-slate-600">{isRainfall ? '120mm' : '500'}</span>
          </div>
        </div>
      )}

      {/* POP Validator Strip */}
      <AnimatePresence>
        {(showPOP || isTerminal || isFraud) && (
          <POPValidatorStrip
            isValidating={currentStage === 1 && !isFraud}
            passed={popPassed && !isFraud}
          />
        )}
      </AnimatePresence>

      {/* Fraud Evidence (for FRAUD_BLOCKED claims) */}
      {isFraud && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 bg-red-50/20 border border-red-300/30 rounded-xl p-3"
        >
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">⚠️ IMPOSSIBLE JUMP DETECTED</p>
          <p className="text-xs text-red-500 leading-relaxed">
            GPS velocity exceeded 100 km/h — POP Validator flagged this as GPS spoofing or device handoff.
            Claim auto-rejected with full evidence trail.
          </p>
          {claim.max_velocity_kmh && (
            <p className="font-mono text-xs font-bold text-red-600 mt-1">Velocity: {claim.max_velocity_kmh} km/h</p>
          )}
        </motion.div>
      )}

      {/* Transaction ID (when disbursed/paid) */}
      {txnId && !isFraud && currentStage >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
        >
          <CreditCard size={14} className="text-emerald-500" />
          <div>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Transaction Record</p>
            <p className="font-mono text-xs font-bold text-emerald-700">{txnId}</p>
          </div>
        </motion.div>
      )}

      {/* Audit Timeline */}
      <AuditTimeline currentStageIndex={currentStage} timestamps={timestamps} isFraud={isFraud} />
    </motion.div>
  );
}
