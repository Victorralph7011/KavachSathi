import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * TerminalLoader — "Calculating Risk..." typewriter terminal effect
 * v2.0: Shows weather data, safe zone detection, and formula calculation
 */
export default function TerminalLoader({ 
  lines = [], 
  onComplete,
  riskResult = null, 
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (!lines.length) return;
    
    const timers = lines.map((line, i) =>
      setTimeout(() => {
        setVisibleCount(i + 1);
        if (i === lines.length - 1 && onComplete) {
          setTimeout(onComplete, 600);
        }
      }, line.delay)
    );

    const cursorInterval = setInterval(() => {
      setShowCursor((v) => !v);
    }, 530);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cursorInterval);
    };
  }, [lines, onComplete]);

  const getLineClass = (line) => {
    let cls = 'terminal-line text-mono';
    if (line.isResult) cls += ' terminal-line--result';
    if (line.isFormula) cls += ' terminal-line--formula';
    if (line.isSafeZone) cls += ' terminal-line--safe';
    if (line.isDiscount) cls += ' terminal-line--discount';
    return cls;
  };

  return (
    <div className="terminal-loader">
      <div className="terminal-loader__header">
        <div className="terminal-dots">
          <span className="dot dot--red" />
          <span className="dot dot--yellow" />
          <span className="dot dot--green" />
        </div>
        <span className="text-mono terminal-loader__title">kavach://risk-engine</span>
        <span className="text-mono terminal-loader__live">● LIVE</span>
      </div>

      <div className="terminal-loader__body">
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            className={getLineClass(line)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {line.text}
          </motion.div>
        ))}

        {/* Live risk result display */}
        {riskResult && visibleCount >= lines.length && (
          <motion.div
            className="terminal-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="terminal-result__divider" />
            
            <div className="terminal-result__row">
              <span className="text-mono">RISK_SCORE:</span>
              <span className="text-mono terminal-result__value">{riskResult.score.toFixed(4)}</span>
            </div>
            <div className="terminal-result__row">
              <span className="text-mono">RISK_GRADE:</span>
              <span className={`text-mono terminal-result__grade grade--${riskResult.grade}`}>
                {riskResult.grade}
              </span>
            </div>
            <div className="terminal-result__row">
              <span className="text-mono">FORMULA:</span>
              <span className="text-mono terminal-result__formula">{riskResult.formula}</span>
            </div>

            {/* Factor breakdown */}
            <div className="terminal-result__divider" />
            <div className="terminal-result__row">
              <span className="text-mono" style={{ color: 'var(--white-muted)' }}>ENV_CONTRIBUTION:</span>
              <span className="text-mono">(0.4 × {riskResult.factors.environmental.toFixed(2)}) = {riskResult.formulaBreakdown?.envContribution?.toFixed(4)}</span>
            </div>
            <div className="terminal-result__row">
              <span className="text-mono" style={{ color: 'var(--white-muted)' }}>PLT_CONTRIBUTION:</span>
              <span className="text-mono">(0.4 × {riskResult.factors.personal.toFixed(2)}) = {riskResult.formulaBreakdown?.perContribution?.toFixed(4)}</span>
            </div>
            <div className="terminal-result__row">
              <span className="text-mono" style={{ color: 'var(--white-muted)' }}>MKT_CONTRIBUTION:</span>
              <span className="text-mono">(0.2 × {riskResult.factors.market.toFixed(2)}) = {riskResult.formulaBreakdown?.marContribution?.toFixed(4)}</span>
            </div>

            {/* Safe zone discount */}
            {riskResult.safeZone?.isSafe && (
              <>
                <div className="terminal-result__divider" />
                <div className="terminal-result__row terminal-result__row--discount">
                  <span className="text-mono">SAFE_ZONE_DISCOUNT:</span>
                  <span className="text-mono" style={{ color: '#39FF14' }}>-₹{riskResult.safeZone.discount}/week</span>
                </div>
                <div className="terminal-result__row">
                  <span className="text-mono" style={{ color: 'var(--white-muted)' }}>ZONE:</span>
                  <span className="text-mono" style={{ color: '#39FF14' }}>{riskResult.safeZone.zoneName}</span>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Blinking cursor */}
        {visibleCount < lines.length && (
          <span className={`terminal-cursor ${showCursor ? '' : 'terminal-cursor--hidden'}`}>▋</span>
        )}
      </div>
    </div>
  );
}
