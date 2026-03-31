import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

import { PersonaSchema, RiskValidationSchema, IssuanceSchema, DEFAULT_VALUES } from '../schemas/submission.schema';
import { useSubmissionState } from '../hooks/useSubmissionState';
import { createDraftPolicy, quotePolicyWithRisk, bindPolicy, issuePolicy } from '../services/policyService';
import PolicyStatusBar from './PolicyStatusBar';
import PersonaStep from './steps/PersonaStep';
import RiskValidationStep from './steps/RiskValidationStep';
import IssuanceStep from './steps/IssuanceStep';
import './RegistrationWizard.css';

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

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 80 : -80, opacity: 0 }),
};

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
      // Update to BOUND
      if (policyId) {
        await bindPolicy(policyId, { termType: values.termType });
      }
      bindPolicyState();
      
      // Update to ISSUED
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
    <div className="reg-wizard">
      {/* Top Navigation */}
      <nav className="reg-wizard__nav">
        <Link to="/" className="reg-wizard__logo" aria-label="KavachSathi Home">
          <span className="navbar__monogram">KS</span>
          <span className="navbar__logo-dot" />
        </Link>

        <div className="reg-wizard__step-info">
          <span className="text-mono reg-wizard__step-num">
            STEP {String(currentStep).padStart(2, '0')} / 03
          </span>
          <span className="text-label reg-wizard__step-title">
            {STEP_TITLES[currentStep]?.label}
          </span>
        </div>

        <div className="reg-wizard__nav-right">
          <span className="text-mono reg-wizard__state-badge">{policyState}</span>
          {policyId && (
            <span className="text-mono" style={{ fontSize: '0.55rem', color: 'var(--white-muted)' }}>
              {policyId}
            </span>
          )}
        </div>
      </nav>

      {/* Status Bar */}
      <PolicyStatusBar currentState={policyState} />

      {/* Main Content */}
      <div className="reg-wizard__body">
        {/* Sidebar */}
        <aside className="reg-wizard__sidebar">
          <div className="sidebar-section">
            <span className="text-label sidebar-section__title">Submission Flow</span>
            {[1, 2, 3].map((step) => (
              <div key={step}
                className={`sidebar-step ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
              >
                <div className="sidebar-step__indicator">
                  {step < currentStep ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="var(--neon)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <span className="text-mono">{String(step).padStart(2, '0')}</span>
                  )}
                </div>
                <div className="sidebar-step__text">
                  <span className="sidebar-step__label">{STEP_TITLES[step].label}</span>
                  <span className="sidebar-step__desc text-mono">{STEP_TITLES[step].subtitle}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Transaction log */}
          <div className="sidebar-section sidebar-log">
            <span className="text-label sidebar-section__title">State History</span>
            <div className="log-entries">
              {history.slice(-6).reverse().map((entry, i) => (
                <div key={i} className="log-entry-mini text-mono">
                  <span className="log-entry-mini__time">
                    {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                  </span>
                  <span className="log-entry-mini__state">{entry.state}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy ID */}
          {policyId && (
            <div className="sidebar-section">
              <span className="text-label sidebar-section__title">Policy ID</span>
              <span className="text-mono" style={{ color: 'var(--neon)', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                {policyId}
              </span>
            </div>
          )}
        </aside>

        {/* Steps Panel */}
        <main className="reg-wizard__main">
          <div className="reg-wizard__panel glass">
            <div className="reg-wizard__panel-header">
              <div>
                <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.7rem' }}>
                  {STEP_TITLES[currentStep]?.subtitle}
                </span>
                <h1 className="reg-wizard__panel-title text-heading">
                  {STEP_TITLES[currentStep]?.label}
                </h1>
              </div>
              {!isComplete && currentStep < 3 && (
                <span className="text-mono reg-wizard__panel-badge">{currentStep}/3 COMPLETE</span>
              )}
            </div>

            <div className="reg-wizard__content">
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

            {!isComplete && currentStep < 3 && (
              <div className="reg-wizard__actions">
                {currentStep > 1 && (
                  <button type="button" className="reg-btn reg-btn--back text-mono" onClick={prevStep}>
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <button type="button"
                  className={`reg-btn reg-btn--next text-label ${canProceed() ? '' : 'disabled'}`}
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
