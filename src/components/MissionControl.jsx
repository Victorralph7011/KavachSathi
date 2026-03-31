import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MissionControl.css';

export default function MissionControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [riskScore, setRiskScore] = useState(0.72);
  const [environmental, setEnv] = useState(0.85);
  const [personal, setPer] = useState(0.65);
  const [market, setMar] = useState(0.60);

  // Simulate live data fluctuations
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Small random fluctuations
      const newEnv = Math.max(0, Math.min(1, environmental + (Math.random() * 0.1 - 0.05)));
      const newPer = Math.max(0, Math.min(1, personal + (Math.random() * 0.05 - 0.025)));
      const newMar = Math.max(0, Math.min(1, market + (Math.random() * 0.08 - 0.04)));
      
      setEnv(newEnv);
      setPer(newPer);
      setMar(newMar);
      
      // Calculate risk: Risk = E × 0.4 + P × 0.4 + M × 0.2
      setRiskScore((newEnv * 0.4) + (newPer * 0.4) + (newMar * 0.2));
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, environmental, personal, market]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        className={`mission-toggle ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Mission Control"
      >
        <span className="mission-toggle__dot" />
        <span className="text-label" style={{ color: 'var(--white)' }}>Terminal</span>
      </button>

      {/* Overlay Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="mission-overlay"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="mission-panel glass-strong">
              
              <div className="mission-panel__header">
                <div>
                  <h3 className="text-subheading" style={{ color: 'var(--white)', margin: 0 }}>Mission Control</h3>
                  <span className="text-mono" style={{ color: 'var(--neon)', fontSize: '10px' }}>LIVE DATA FEED // V.1.0</span>
                </div>
                <button 
                  className="mission-panel__close"
                  onClick={() => setIsOpen(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />

              <div className="mission-panel__content">
                
                {/* Main Risk Score */}
                <div className="risk-display">
                  <span className="text-label" style={{ color: 'var(--white-dim)' }}>Global Risk Index</span>
                  <div className="risk-display__value text-mono neon-text">
                    {riskScore.toFixed(3)}
                  </div>
                  <div className="risk-formula text-mono">
                    <span style={{ color: 'var(--white)' }}>R</span> = E<span style={{ color: 'var(--neon)' }}>×0.4</span> + P<span style={{ color: 'var(--neon)' }}>×0.4</span> + M<span style={{ color: 'var(--neon)' }}>×0.2</span>
                  </div>
                </div>

                <div className="divider" style={{ margin: '24px 0' }} />

                {/* Variables */}
                <div className="variables-grid">
                  <div className="variable-item">
                    <div className="variable-item__header">
                      <span className="text-label" style={{ color: 'var(--white)' }}>Environmental (E)</span>
                      <span className="text-mono" style={{ color: 'var(--neon)' }}>{environmental.toFixed(2)}</span>
                    </div>
                    <div className="variable-progress">
                      <motion.div 
                        className="variable-progress__fill" 
                        animate={{ width: `${environmental * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="variable-item">
                    <div className="variable-item__header">
                      <span className="text-label" style={{ color: 'var(--white)' }}>Personal (P)</span>
                      <span className="text-mono" style={{ color: 'var(--neon)' }}>{personal.toFixed(2)}</span>
                    </div>
                    <div className="variable-progress">
                      <motion.div 
                        className="variable-progress__fill" 
                        animate={{ width: `${personal * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="variable-item">
                    <div className="variable-item__header">
                      <span className="text-label" style={{ color: 'var(--white)' }}>Market (M)</span>
                      <span className="text-mono" style={{ color: 'var(--neon)' }}>{market.toFixed(2)}</span>
                    </div>
                    <div className="variable-progress">
                      <motion.div 
                        className="variable-progress__fill" 
                        animate={{ width: `${market * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* System Status logs */}
                <div className="system-logs">
                  <div className="log-line text-mono">
                    <span style={{ color: 'var(--white-muted)' }}>[14:24:01]</span> ORACLE_SYNC_OK
                  </div>
                  <div className="log-line text-mono">
                    <span style={{ color: 'var(--white-muted)' }}>[14:24:05]</span> SMART_CONTRACT_VERIFIED
                  </div>
                  <div className="log-line text-mono">
                    <span style={{ color: 'var(--neon)' }}>[14:24:12]</span> TRIGGER_READY
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
