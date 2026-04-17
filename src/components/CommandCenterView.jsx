import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Download, Zap, Building2, Trees, Wind, Cpu, CloudRain } from 'lucide-react';
import DashSidebar from './DashSidebar';
import { useCenterData } from '../hooks/useCenterData';
import { usePolicy } from '../contexts/PolicyContext';
import { downloadPolicyCertificate } from '../utils/generateCertificate';
import { useKavachData } from '../hooks/useKavachData';

const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/* ─── Risk Ring ─── */
function RiskRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative w-[140px] h-[140px] shrink-0">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius}
          fill="none" stroke="#0F7B6C" strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[#1A1A1A] leading-none">{score}%</span>
        <span className="text-xs text-gray-500 font-medium mt-1">Risk Score</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPaid = status !== 'DYNAMIC_SURGE' && status !== 'surge';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold
      ${isPaid ? 'bg-[#DCFCE7] text-[#059669]' : 'bg-[#FEF3C7] text-[#E85D04]'}
    `}>
      {isPaid ? 'Paid' : 'Dynamic Surge'}
    </span>
  );
}

function TriggerBadge({ status }) {
  if (status === 'RESOLVED') {
    return <span className="badge-teal">Claim Initiated</span>;
  }
  return <span className="badge-amber">Monitoring</span>;
}

export default function CommandCenterView({ policy }) {
  const navigate = useNavigate();
  const { payments, triggers } = useCenterData();
  const policyCtx = usePolicy();

  const zoneId = policy?.policyId || 'MAH-ZONE-04';
  const riskScore = Math.round((policy?.riskScore || 0.82) * 100);
  const areaCategory = policyCtx?.areaCategory || policy?.areaCategory || 'URBAN';

  // ── Live data via shared hook (weather + ML premium) ────────────
  const { weather, premium, multiplier, loading: weatherLoading } = useKavachData();

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background Environment */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="dashboard" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">
          
          {/* Top Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Policy Identification</span>
              <h1 className="font-mono text-4xl md:text-5xl font-bold tracking-[0.1em] text-[#111]">{zoneId}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md">ARMED</span>
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> MONITORING
                </span>
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md flex items-center gap-1.5 border ${
                  areaCategory === 'URBAN'
                    ? 'bg-[#1A3C5E]/10 border-[#1A3C5E]/30 text-[#1A3C5E]'
                    : 'bg-[#0F7B6C]/10 border-[#0F7B6C]/30 text-[#0F7B6C]'
                }`}>
                  {areaCategory === 'URBAN' ? <Building2 size={11} /> : <Trees size={11} />}
                  {areaCategory}
                </span>
              </div>
            </div>
            <button
              onClick={() => downloadPolicyCertificate(policy)}
              className="bg-[#0F172A] hover:bg-black text-white px-6 py-3.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 self-start md:self-auto shrink-0"
            >
              <Download size={16} /> Download Certificate
            </button>
          </div>

          {/* Active Radar - Live Monitoring Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Active Radar</span>
              {!weatherLoading && weather?.source === 'live' && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">

               {/* Temperature */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0 }} className="bg-white/20 backdrop-blur-xl border border-white/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-orange-50/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temperature</p>
                    {weatherLoading ? (
                      <div className="h-7 w-20 bg-gray-200/60 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-[#111] mt-0.5">
                        {weather?.temperature_c?.toFixed(1) ?? '—'}<span className="text-sm text-gray-400 ml-1">°C</span>
                      </p>
                    )}
                  </div>
               </motion.div>

               {/* Humidity */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white/20 backdrop-blur-xl border border-white/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-blue-50/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Wind className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Humidity</p>
                    {weatherLoading ? (
                      <div className="h-7 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-[#111] mt-0.5">
                        {weather?.humidity?.toFixed(0) ?? '—'}<span className="text-sm text-gray-400 ml-1">%</span>
                      </p>
                    )}
                  </div>
               </motion.div>

               {/* Rainfall */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0.15 }} className="bg-white/20 backdrop-blur-xl border border-white/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-blue-50/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <CloudRain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rainfall</p>
                    {weatherLoading ? (
                      <div className="h-7 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-[#111] mt-0.5">
                        {weather?.rain_mm?.toFixed(1) ?? '0.0'}<span className="text-sm text-gray-400 ml-1">mm</span>
                      </p>
                    )}
                    {!weatherLoading && (weather?.rain_mm ?? 0) > 60 && (
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5">⚠ TRIGGER THRESHOLD</p>
                    )}
                  </div>
               </motion.div>

               {/* AQI */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white/20 backdrop-blur-xl border border-white/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-teal-50/50 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                    <Zap className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AQI (US)</p>
                    {weatherLoading ? (
                      <div className="h-7 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-[#111] mt-0.5">
                        {weather?.aqi?.toFixed(0) ?? '—'}<span className="text-sm text-gray-400 ml-1">idx</span>
                      </p>
                    )}
                  </div>
               </motion.div>

               {/* ML Premium — driven by live weather + Random Forest model */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white/20 backdrop-blur-xl border border-white/30 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-emerald-50/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Cpu className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ML Premium</p>
                      <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">AI</span>
                    </div>
                    {weatherLoading ? (
                      <div className="h-7 w-20 bg-gray-200/60 animate-pulse rounded mt-1" />
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-[#111] mt-0.5">
                        {premium != null ? `₹${premium.toFixed(2)}` : '—'}<span className="text-sm text-gray-400 ml-1">/wk</span>
                      </p>
                    )}
                    {multiplier != null && !weatherLoading && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Risk ×{multiplier.toFixed(2)}</p>
                    )}
                  </div>
               </motion.div>

            </div>
          </div>

          {/* Main Grid Data (Premium & Triggers) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
            {/* LEFT: Premium History */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/20">
                <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-widest">Ledger History</h2>
              </div>
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="bg-white/10 backdrop-blur-sm">
                    {['Transaction ID', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-[10px] uppercase font-bold text-[#0F172A] tracking-wider border-b border-white/20">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-sm">No payment records yet.</td>
                    </tr>
                  ) : payments.slice(0, 10).map((p, i) => (
                    <tr key={p.id || i} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-[#1A3C5E] font-medium">
                        {(p.paymentId || p.id || '').substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-[#1A1A1A]">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-[#111]">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6">
              {/* Parametric Trigger Log */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-5">Parametric Log</h3>
                {triggers.length === 0 ? (
                  <p className="text-gray-400 text-sm">No trigger events recorded.</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {triggers.slice(0, 3).map((t, i) => (
                      <div key={t.id || i} className="flex gap-3 items-start border-b border-white/10 last:border-0 pb-4 last:pb-0">
                        <div className="shrink-0 flex flex-col items-center">
                          <p className="text-xs text-slate-600 font-mono">
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center shrink-0 border border-white/30">
                          {i % 2 === 0 ? <Zap size={12} className="text-[#111]" /> : <Thermometer size={12} className="text-[#111]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-[#1A1A1A] font-bold">{t.event || 'Weather Event'}</p>
                          {t.reason && <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{t.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
