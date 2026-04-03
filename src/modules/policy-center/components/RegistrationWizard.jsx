import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

import { PersonaSchema, RiskValidationSchema, IssuanceSchema, DEFAULT_VALUES } from '../schemas/submission.schema';
import { useSubmissionState } from '../hooks/useSubmissionState';
import { createDraftPolicy, quotePolicyWithRisk, bindPolicy, issuePolicy } from '../services/policyService';
import PersonaStep from './steps/PersonaStep';
import RiskValidationStep from './steps/RiskValidationStep';
import IssuanceStep from './steps/IssuanceStep';

const STEP_SCHEMAS = {
  1: PersonaSchema,
  2: null,
  3: IssuanceSchema,
};

const STEP_TITLES = {
  1: { label: 'Persona', subtitle: 'Identity & Platform Verification' },
  2: { label: 'Risk Validation', subtitle: 'GPS Acquisition & AI Risk Scoring' },
  3: { label: 'Issuance', subtitle: 'Policy Review & Binding' },
};

const LIFECYCLE_STEPS = ['Draft', 'Underwriting', 'Quoted', 'Bound', 'Issued'];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

function StepperDot({ index, label, currentState }) {
  const stateMap = { DRAFT: 0, UNDERWRITING: 1, QUOTED: 2, BOUND: 3, ISSUED: 4 };
  const ci = stateMap[currentState] ?? 0;
  const isCompleted = index < ci || (currentState === 'ISSUED' && index === ci);
  const isActive = index === ci && currentState !== 'ISSUED';

  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
          ${isCompleted ? 'bg-[#0F7B6C] text-white' : ''}
          ${isActive ? 'bg-[#1A3C5E] text-white ring-2 ring-[#1A3C5E] ring-offset-2 ring-offset-[#FAFAF8]' : ''}
          ${!isCompleted && !isActive ? 'bg-gray-200 text-gray-400' : ''}
        `}
      >
        {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
      </div>
      <span className={`text-[10px] font-medium whitespace-nowrap
        ${isActive ? 'text-[#1A3C5E]' : isCompleted ? 'text-[#0F7B6C]' : 'text-gray-400'}
      `}>{label}</span>
    </div>
  );
}

function getStateBadgeClass(state) {
  if (state === 'ISSUED') return 'bg-[#DCFCE7] text-[#059669]';
  if (state === 'BOUND' || state === 'QUOTED') return 'bg-[#EFF6FF] text-[#1A3C5E]';
  if (state === 'UNDERWRITING') return 'bg-[#FEF3C7] text-[#E85D04]';
  return 'bg-gray-100 text-gray-500';
}

export default function RegistrationWizard() {
  const {
    currentStep,
    policyState,
    history,
    nextStep,
    prevStep,
    bindPolicy: bindPolicyState,
    issuePolicy: issuePolicyState,
    isComplete,
  } = useSubmissionState();

  const { currentUser } = useAuth();

  const [policyId, setPolicyId] = useState(null);
  const [firebaseErrors, setFirebaseErrors] = useState([]);

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: 'onBlur',
  });

  const direction = 1;

  // ─── Firebase: Save Draft (Step 1 → 2) ─────────────────
  const saveDraft = useCallback(async () => {
    const values = form.getValues();
    try {
      const result = await createDraftPolicy({
        fullName: values.fullName,
        platform: values.platform,
        workerId: values.workerId,
        aadhaar: values.aadhaar,
      }, currentUser?.uid);
      if (result.success) {
        setPolicyId(result.policyId);
        console.log(`[KAVACH] Draft saved: ${result.policyId}`);
      } else {
        console.warn('[KAVACH] Draft save failed (offline mode):', result.error);
        setPolicyId(`KS-LOCAL-${Date.now().toString(36).toUpperCase()}`);
      }
    } catch (e) {
      console.warn('[KAVACH] Firebase unavailable — operating in offline mode');
      setPolicyId(`KS-LOCAL-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [form]);

  // ─── Firebase: Save Risk Data (Step 2 → 3) ─────────────
  const saveRiskData = useCallback(async () => {
    if (!policyId) return;
    const values = form.getValues();
    try {
      await quotePolicyWithRisk(policyId, {
        latitude: values.latitude,
        longitude: values.longitude,
        baseState: values.baseState,
        riskScore: values.riskScore,
        riskGrade: values.riskGrade,
        riskFactors: values.riskFactors,
        estimatedPremium: values.premiumAmount || 40,
        safeZoneDiscount: values.safeZone?.discount || 0,
        discounts: values.safeZone?.isSafe
          ? [{ type: 'SAFE_ZONE', amount: values.safeZone.discount, zone: values.safeZone.zoneName }]
          : [],
        stateHistory: history,
      });
    } catch (e) {
      console.warn('[KAVACH] Risk data save failed — continuing offline');
    }
  }, [policyId, form, history]);

  // ─── Firebase: Bind + Issue (Step 3 finalization) ───────
  const handleBind = useCallback(async (paymentData) => {
    const values = form.getValues();

    try {
      if (policyId) {
        await bindPolicy(policyId, { termType: values.termType });
      }
      bindPolicyState();
      
      if (policyId) {
        await issuePolicy(policyId, {
          ...paymentData,
          amount: values.premiumAmount || 40,
        });
      }
      
      setTimeout(() => {
        issuePolicyState();
      }, 500);
    } catch (e) {
      console.warn('[KAVACH] Firebase bind/issue failed — continuing offline');
      bindPolicyState();
      setTimeout(() => issuePolicyState(), 500);
    }
  }, [policyId, form, bindPolicyState, issuePolicyState]);

  const handleNext = async () => {
    const schema = STEP_SCHEMAS[currentStep];
    if (schema) {
      const fields = Object.keys(schema.shape);
      const valid = await form.trigger(fields);
      if (!valid) return;
    }

    if (currentStep === 1) {
      await saveDraft();
    }

    if (currentStep === 2) {
      const riskGrade = form.getValues('riskGrade');
      if (!riskGrade) return;
      await saveRiskData();
    }

    nextStep();
  };

  const canProceed = () => {
    if (currentStep === 2) return !!form.watch('riskGrade');
    return true;
  };

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background Environment */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80"
        >
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />
      </div>

      {/* Sidebar - Glassmorphism */}
      <aside className="relative z-10 w-64 shrink-0 bg-white/10 backdrop-blur-lg border-r border-white/20 min-h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <Link to="/" className="flex items-center gap-2.5" aria-label="KavachSathi Home">
            <div className="w-8 h-8 rounded-lg bg-[#1A3C5E] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xs italic tracking-tighter">KS</span>
            </div>
            <span className="text-sm font-semibold text-[#1A1A1A]">KavachSathi</span>
          </Link>
        </div>

        <div className="px-6 py-8 flex flex-col flex-1">
          {/* Submission Flow steps */}
          <div className="mb-8">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 block">Submission Flow</span>
            <div className="flex flex-col gap-1">
              {[1, 2, 3].map((step) => {
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                      ${isActive ? 'bg-[#EEF2FF]' : ''}
                    `}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0
                      ${isCompleted ? 'bg-[#0F7B6C] text-white' : ''}
                      ${isActive ? 'bg-[#1A3C5E] text-white' : ''}
                      ${!isCompleted && !isActive ? 'bg-white/40 text-slate-500' : ''}
                    `}>
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm leading-tight ${isActive ? 'text-[#1A3C5E] font-semibold' : isCompleted ? 'text-[#0F7B6C] font-medium' : 'text-gray-500'}`}>
                        {STEP_TITLES[step].label}
                      </span>
                      <span className="text-[10px] text-gray-400 leading-tight mt-0.5">
                        {STEP_TITLES[step].subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* State History */}
          <div className="mb-6 flex-1 overflow-y-auto">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 block">State History</span>
            <div className="flex flex-col gap-2">
              {history.slice(-6).reverse().map((entry, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    i === 0 ? 'bg-[#1A3C5E] animate-pulse' : 'bg-[#0F7B6C]'
                  }`} />
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${getStateBadgeClass(entry.state)}`}>
                    {entry.state}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy ID */}
          {policyId && (
            <div className="border-t border-[#E5E7EB] pt-4 mt-auto">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Policy ID</span>
              <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#1A3C5E] break-all">
                {policyId}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main - takes remaining space, scrolls independently */}
      <main className="relative z-10 flex-1 min-w-0 overflow-y-auto">

        {/* Top Bar - transparent frosted stepper + status */}
        <div className="sticky top-0 z-20 bg-white/10 backdrop-blur-md border-b border-white/20 px-8 py-5 pb-8 flex items-center justify-between">
          <div className="w-10"></div> {/* spacer for right alignment */}
          
          {/* Top Stepper */}
          <div className="hidden lg:flex items-center w-full max-w-lg mx-auto">
            {LIFECYCLE_STEPS.map((label, i) => {
              const stateMap = { DRAFT: 0, UNDERWRITING: 1, QUOTED: 2, BOUND: 3, ISSUED: 4 };
              const ci = stateMap[policyState] ?? 0;
              const isCompleted = i < ci || (policyState === 'ISSUED' && i === ci);
              const isActive = i === ci && policyState !== 'ISSUED';
              
              return (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center relative z-10 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold z-10 transition-all duration-300
                      ${isCompleted ? 'bg-[#0F7B6C] text-white' :
                        isActive ? 'bg-[#1A3C5E] text-white ring-2 ring-[#1A3C5E] ring-offset-2' :
                        'bg-white/40 text-slate-500'}`}>
                      {isCompleted ? '✓' : i+1}
                    </div>
                    <span className={`absolute top-10 text-[10px] sm:text-xs font-medium whitespace-nowrap
                      ${isActive ? 'text-[#1A3C5E]' : isCompleted ? 'text-[#0F7B6C]' : 'text-gray-400'}
                    `}>{label}</span>
                  </div>
                  {i < LIFECYCLE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${i < ci ? 'bg-[#0F7B6C]' : 'bg-[#E5E7EB]'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStateBadgeClass(policyState)}`}>
              {policyState}
            </span>
          </div>
        </div>

        {/* Form Area - centered borderless logic */}
        <div className="flex items-start justify-center p-8 min-h-[calc(100vh-73px)]">
          <div className="w-full max-w-2xl py-8">
            {/* Panel Header */}
            <div className="mb-8 border-b border-[#E5E7EB] pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                    {STEP_TITLES[currentStep]?.subtitle}
                  </span>
                  <h1 className="text-3xl font-bold text-[#1A1A1A] mt-1 font-['Instrument_Serif',serif] italic">
                    {STEP_TITLES[currentStep]?.label}
                  </h1>
                </div>
                {!isComplete && currentStep < 3 && (
                  <span className="bg-[#F0EDE8] text-[#1A3C5E] rounded-full px-3 py-1 text-xs font-semibold font-['Inter'] tracking-tight">
                    {currentStep}/3 Complete
                  </span>
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="py-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {currentStep === 1 && <PersonaStep form={form} />}
                  {currentStep === 2 && <RiskValidationStep form={form} />}
                  {currentStep === 3 && (
                    <IssuanceStep form={form} onBind={handleBind} policyId={policyId} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            {!isComplete && currentStep < 3 && (
              <div className="pt-10 mt-10 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="border border-white/20 text-[#1A3C5E] hover:border-[#1A3C5E] backdrop-blur-md bg-white/30 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                ) : <div />}
                <button
                  type="button"
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2
                    ${canProceed()
                      ? 'bg-[#E85D04] hover:bg-[#D14F00] text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
