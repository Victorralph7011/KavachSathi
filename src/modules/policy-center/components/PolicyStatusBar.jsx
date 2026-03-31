import { motion } from 'framer-motion';
import { LIFECYCLE_FLOW, STATE_CONFIG } from '../constants/policyStates';

/**
 * PolicyStatusBar — Visual state machine indicator
 * Shows the Guidewire lifecycle: DRAFT → UNDERWRITING → QUOTED → BOUND → ISSUED
 */
export default function PolicyStatusBar({ currentState }) {
  const currentIndex = LIFECYCLE_FLOW.indexOf(currentState);

  return (
    <div className="policy-status-bar">
      <div className="status-bar__track">
        {LIFECYCLE_FLOW.map((state, i) => {
          const config = STATE_CONFIG[state];
          const isFinalState = currentState === 'ISSUED';
          const isActive = i === currentIndex && !isFinalState;
          const isCompleted = i < currentIndex || (isFinalState && i === currentIndex);
          const isPending = i > currentIndex;

          return (
            <div key={state} className="status-bar__step-wrap">
              {/* Connector line before (except first) */}
              {i > 0 && (
                <div className={`status-bar__connector ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted && (
                    <motion.div
                      className="status-bar__connector-fill"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </div>
              )}

              {/* Step node */}
              <motion.div
                className={`status-bar__node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="var(--obsidian)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="text-mono" style={{ fontSize: '8px' }}>{String(i + 1).padStart(2, '0')}</span>
                )}
              </motion.div>

              {/* Label */}
              <span className={`status-bar__label text-mono ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
