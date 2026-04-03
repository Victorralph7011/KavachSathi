import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * TerminalLoader — Restyled dark data terminal
 * Deliberate dark inset for data readout — not decoration
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

  const getLineColor = (line) => {
    if (line.isFormula) return 'text-[#38BDF8] font-semibold';
    if (line.isResult) return 'text-[#E2E8F0]';
    if (line.isSafeZone) return 'text-[#34D399]';
    if (line.isDiscount) return 'text-[#34D399]';
    return 'text-[#64748B]';
  };

  return (
    <div className="bg-[#0F172A] rounded-2xl overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
          <div className="w-3 h-3 rounded-full bg-[#EAB308]" />
          <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
        </div>
        <span className="font-mono text-xs text-[#94A3B8]">kavach://risk-engine</span>
        <span className="font-mono text-xs text-[#0F7B6C]">● LIVE</span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-sm min-h-[120px] max-h-[280px] overflow-y-auto">
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.div
            key={i}
            className={`mb-1 ${getLineColor(line)} ${line.isFormula ? 'bg-[#1E293B] rounded px-2 py-0.5 inline-block' : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {line.text}
          </motion.div>
        ))}

        {/* Live risk result */}
        {riskResult && visibleCount >= lines.length && (
          <motion.div
            className="mt-3 pt-3 border-t border-[#1E293B]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#94A3B8]">Risk Score:</span>
              <span className="text-[#E2E8F0] font-semibold">{riskResult.score.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#94A3B8]">Risk Grade:</span>
              <span className={`font-bold ${
                riskResult.grade === 'A' ? 'text-[#38BDF8]' : 
                riskResult.grade === 'B' ? 'text-[#34D399]' : 'text-[#FBBF24]'
              }`}>{riskResult.grade}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#94A3B8]">Formula:</span>
              <span className="text-[#38BDF8] font-semibold">{riskResult.formula}</span>
            </div>

            <div className="mt-2 pt-2 border-t border-[#1E293B] text-xs">
              <div className="flex justify-between text-[#64748B] mb-0.5">
                <span>Env Contribution:</span>
                <span className="text-[#94A3B8]">(0.4 × {riskResult.factors.environmental.toFixed(2)}) = {riskResult.formulaBreakdown?.envContribution?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-[#64748B] mb-0.5">
                <span>Platform Contribution:</span>
                <span className="text-[#94A3B8]">(0.4 × {riskResult.factors.personal.toFixed(2)}) = {riskResult.formulaBreakdown?.perContribution?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Market Contribution:</span>
                <span className="text-[#94A3B8]">(0.2 × {riskResult.factors.market.toFixed(2)}) = {riskResult.formulaBreakdown?.marContribution?.toFixed(4)}</span>
              </div>
            </div>

            {riskResult.safeZone?.isSafe && (
              <div className="mt-2 pt-2 border-t border-[#1E293B] text-xs">
                <div className="flex justify-between text-[#34D399]">
                  <span>Safe Zone Discount:</span>
                  <span>-₹{riskResult.safeZone.discount}/week</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Zone:</span>
                  <span className="text-[#34D399]">{riskResult.safeZone.zoneName}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Blinking cursor */}
        {visibleCount < lines.length && (
          <span className={`text-[#E2E8F0] transition-opacity ${showCursor ? 'opacity-100' : 'opacity-0'}`}>▋</span>
        )}
      </div>
    </div>
  );
}
