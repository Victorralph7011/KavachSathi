import { useState, useCallback } from 'react';
import { POLICY_STATES, STATE_CONFIG, STEP_TO_STATE } from '../constants/policyStates';

/**
 * useSubmissionState — Guidewire-inspired state machine hook
 * 
 * Manages the policy lifecycle: DRAFT → UNDERWRITING → QUOTED → BOUND → ISSUED
 * with a linear step counter for the wizard UI.
 */
export function useSubmissionState() {
  const [currentStep, setCurrentStep] = useState(1);
  const [policyState, setPolicyState] = useState(POLICY_STATES.DRAFT);
  const [history, setHistory] = useState([
    { state: POLICY_STATES.DRAFT, timestamp: new Date().toISOString(), note: 'Submission initiated' },
  ]);

  const addHistory = useCallback((state, note) => {
    setHistory((prev) => [
      ...prev,
      { state, timestamp: new Date().toISOString(), note },
    ]);
  }, []);

  const transition = useCallback((toState, note = '') => {
    setPolicyState((prev) => {
      const config = STATE_CONFIG[prev];
      if (!config.canTransitionTo.includes(toState)) {
        console.warn(`[KAVACH] Invalid transition: ${prev} → ${toState}`);
        return prev;
      }
      addHistory(toState, note || `Transitioned to ${toState}`);
      return toState;
    });
    return true;
  }, [addHistory]);

  const nextStep = useCallback(() => {
    if (currentStep >= 3) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    
    // Auto-transition policy state based on step
    const targetState = STEP_TO_STATE[next];
    if (targetState) {
      transition(targetState, `Advanced to step ${next}`);
    }
  }, [currentStep, transition]);

  const prevStep = useCallback(() => {
    if (currentStep <= 1) return;
    setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const bindPolicy = useCallback(() => {
    transition(POLICY_STATES.BOUND, 'Policy bound by user');
  }, [transition]);

  const issuePolicy = useCallback(() => {
    transition(POLICY_STATES.ISSUED, 'Policy issued — coverage active');
  }, [transition]);

  const withdraw = useCallback(() => {
    transition(POLICY_STATES.WITHDRAWN, 'Submission withdrawn by user');
  }, [transition]);

  return {
    currentStep,
    policyState,
    stateConfig: STATE_CONFIG[policyState],
    history,
    nextStep,
    prevStep,
    transition,
    bindPolicy,
    issuePolicy,
    withdraw,
    isComplete: policyState === POLICY_STATES.ISSUED,
  };
}
