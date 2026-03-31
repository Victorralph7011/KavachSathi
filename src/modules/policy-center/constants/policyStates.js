/**
 * Guidewire-Inspired Policy Submission State Machine
 * 
 * Lifecycle: DRAFT → UNDERWRITING → QUOTED → BOUND → ISSUED
 * Side-states: WITHDRAWN, DECLINED, NOT_TAKEN, CANCELLED
 */

export const POLICY_STATES = {
  DRAFT: 'DRAFT',
  UNDERWRITING: 'UNDERWRITING',
  QUOTED: 'QUOTED',
  BOUND: 'BOUND',
  ISSUED: 'ISSUED',
  // Terminal side-states
  WITHDRAWN: 'WITHDRAWN',
  DECLINED: 'DECLINED',
  NOT_TAKEN: 'NOT_TAKEN',
  CANCELLED: 'CANCELLED',
};

export const STATE_CONFIG = {
  [POLICY_STATES.DRAFT]: {
    label: 'Draft',
    step: 1,
    color: 'var(--white-muted)',
    description: 'Gathering identity & persona information',
    canTransitionTo: [POLICY_STATES.UNDERWRITING, POLICY_STATES.WITHDRAWN],
  },
  [POLICY_STATES.UNDERWRITING]: {
    label: 'Underwriting',
    step: 2,
    color: 'var(--amber)',
    description: 'AI Risk Engine scoring in progress',
    canTransitionTo: [POLICY_STATES.QUOTED, POLICY_STATES.DECLINED],
  },
  [POLICY_STATES.QUOTED]: {
    label: 'Quoted',
    step: 3,
    color: 'var(--neon)',
    description: 'Premium calculated — ready for review',
    canTransitionTo: [POLICY_STATES.BOUND, POLICY_STATES.NOT_TAKEN],
  },
  [POLICY_STATES.BOUND]: {
    label: 'Bound',
    step: 3,
    color: 'var(--neon)',
    description: 'Coverage active — binding confirmed',
    canTransitionTo: [POLICY_STATES.ISSUED, POLICY_STATES.CANCELLED],
  },
  [POLICY_STATES.ISSUED]: {
    label: 'Issued',
    step: 3,
    color: 'var(--neon)',
    description: 'Policy document generated — fully active',
    canTransitionTo: [],
  },
};

/** The happy-path linear flow for the status bar */
export const LIFECYCLE_FLOW = [
  POLICY_STATES.DRAFT,
  POLICY_STATES.UNDERWRITING,
  POLICY_STATES.QUOTED,
  POLICY_STATES.BOUND,
  POLICY_STATES.ISSUED,
];

/**
 * Maps registration wizard steps to policy states
 * Step 1 (Persona)         → DRAFT
 * Step 2 (Risk Validation) → UNDERWRITING
 * Step 3 (Issuance)        → QUOTED → BOUND → ISSUED
 */
export const STEP_TO_STATE = {
  1: POLICY_STATES.DRAFT,
  2: POLICY_STATES.UNDERWRITING,
  3: POLICY_STATES.QUOTED,
};
