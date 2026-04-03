import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Wind } from 'lucide-react';
import { useCenterData } from '../../hooks/useCenterData';
import DashSidebar from '../DashSidebar';
import TacticalMap from '../claims/TacticalMap';

const ORACLE_CARDS = [
  {
    key: 'rain',
    label: 'Rainfall',
    icon: <CloudRain size={28} />,
    getCurrentValue: () => 'Mumbai: 45mm / 24h',
    threshold: 'Threshold: 50mm',
  },
  {
    key: 'heat',
    label: 'Heat Wave',
    icon: <Sun size={28} />,
    getCurrentValue: () => 'Delhi: 42°C',
    threshold: 'Threshold: 40°C',
  },
  {
    key: 'aqi',
    label: 'AQI Alert',
    icon: <Wind size={28} />,
    getCurrentValue: () => 'Bengaluru: 180 AQI',
    threshold: 'Threshold: 200 AQI',
  },
];

function ClaimStatusBadge({ status }) {
  const isDispatched = status === 'RESOLVED' || status === 'PAYOUT_DISPATCHED';
  return (
    <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm border
      ${isDispatched ? 'bg-emerald-100/90 text-emerald-700 border-emerald-200/50' : 'bg-amber-100/90 text-amber-700 border-amber-200/50'}
    `}>
      {isDispatched ? 'Payout Dispatched' : 'Evaluating'}
    </span>
  );
}

export default function ClaimTriggerLog() {
  const { policy, triggers, isLoading } = useCenterData();
  const [activeClaim, setActiveClaim] = useState(null);

  // Auto-focus logic: select the most recent claim organically mapping the dashboard view
  useEffect(() => {
    if (triggers && triggers.length > 0 && !activeClaim) {
      setActiveClaim(triggers[0]);
    }
  }, [triggers, activeClaim]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <div className="w-9 h-9 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    );
  }
  if (!policy) return null;

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="claims" />

      <main className="relative z-10 flex-1 overflow-y-auto w-full">
        {/* Top Nav bar */}
        <div className="px-10 py-5 flex items-center gap-3 border-b border-white/20">
          <div className="w-9 h-9 rounded-lg bg-white/40 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
          </div>
          <span className="text-base font-bold text-[#1A1A1A]">KavachSathi</span>
          <span className="text-slate-400 mx-1">|</span>
          <span className="text-sm font-semibold text-slate-500">Claim Center</span>
        </div>

        <div className="px-10 py-10 w-full">
          {/* Page Title */}
          <div className="flex items-center gap-4 mb-10 text-white">
            <div className="w-14 h-14 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 shadow-sm flex items-center justify-center text-[#0F172A]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h1 className="m-0 text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Active Claim Radar</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full mb-12">
            {/* GIS TACTICAL MAP CONTAINER (cols-3) */}
            <div className="lg:col-span-3">
               <TacticalMap activeClaim={activeClaim} />
            </div>

            {/* Oracle Monitor Cards Flanking */}
            <div className="flex flex-col gap-6">
              {ORACLE_CARDS.map((oracle, i) => (
                <motion.div
                  key={oracle.key}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-7 shadow-sm shadow-[#1A1A1A]/5 flex-1 flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[#0F172A]">{oracle.icon}</div>
                    <span className="inline-block px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-100/90 text-amber-700 shadow-sm border border-amber-200/50">
                      ARMED
                    </span>
                  </div>
                  <p className="m-0 text-lg font-bold text-[#1A1A1A]">{oracle.label}</p>
                  <p className="mt-2 mb-1 text-base font-semibold text-slate-800">{oracle.getCurrentValue()}</p>
                  <p className="m-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">({oracle.threshold})</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Claim Ledger / Selection Pane */}
          <h2 className="m-0 mb-6 text-xl font-bold text-[#1A1A1A] tracking-tight">
            Claim History & Payouts
          </h2>

          {!triggers || triggers.length === 0 ? (
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center text-slate-500 font-semibold shadow-sm">
              No active claims or triggers found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {triggers.map((trigger, i) => {
                const isSelected = activeClaim?.id === trigger.id;
                return (
                  <motion.div
                    key={trigger.id || i}
                    onClick={() => setActiveClaim(trigger)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className={`cursor-pointer bg-white/20 backdrop-blur-xl border rounded-2xl p-7 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.02)]
                      ${isSelected ? 'border-[#0F172A] ring-1 ring-[#0F172A] scale-[1.01]' : 'border-white/30 hover:bg-white/30'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="m-0 text-base font-bold text-[#1A1A1A]">
                          {trigger.event || 'Weather Event'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500 tracking-wide uppercase">
                          {new Date(trigger.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <ClaimStatusBadge status={trigger.status} />
                    </div>

                    <div className="my-6 pt-5 border-t border-white/20">
                      <p className="m-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payout amount</p>
                      <p className="mt-1 text-4xl font-black text-[#1A1A1A] tracking-tight">
                        ₹{(trigger.payoutAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {trigger.reason && (
                      <p className={`m-0 text-xs font-medium text-slate-600 leading-relaxed p-3 rounded-lg border transition-colors ${isSelected ? 'bg-white/50 border-[#0F172A]/20' : 'bg-white/30 border-white/40'}`}>
                        {trigger.reason}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
