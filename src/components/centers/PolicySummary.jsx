import { motion } from 'framer-motion';
import { FileText, Download, Shield, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import { useKavachData } from '../../hooks/useKavachData';
import DashSidebar from '../DashSidebar';
import { downloadPolicyCertificate } from '../../utils/generateCertificate';

function gradeStyle(g) {
  if (g === 'A') return 'badge-navy';
  if (g === 'B') return 'badge-teal';
  return 'badge-amber';
}

export default function PolicySummary() {
  const { policy, isLoading } = useCenterData();
  const { premium, multiplier, loading: mlLoading, weather } = useKavachData();

  // Risk score derived from ML multiplier:
  // multiplier 1.0 = 0.00 (no extra risk above base)
  // multiplier 1.45 = 0.45 (45% above base rate)
  // This is the clearest representation of what the ML engine computed.
  const displayRiskScore = multiplier != null
    ? (multiplier - 1).toFixed(4)
    : policy?.riskScore?.toFixed(4) ?? '—';

  const displayPremium = premium != null
    ? `₹${premium.toFixed(2)}/wk`
    : policy?.estimatedPremium != null
    ? `₹${policy.estimatedPremium.toFixed(2)}/wk`
    : '₹—/wk';

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <span className="relative z-10 text-sm font-semibold text-slate-600 bg-white/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-sm">Loading policy...</span>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <DashSidebar activeTab="policy" />
        <main className="relative z-10 flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center max-w-md shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center mx-auto mb-5">
              <Shield size={28} className="text-[#FF6B00]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No Active Policy</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              You don't have an active policy yet. Complete the registration wizard to get your parametric coverage activated.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#0F172A] hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:-translate-y-0.5"
            >
              Go to Dashboard →
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="policy" />

      <main className="relative z-10 flex-1 p-8 overflow-y-auto">
        <motion.div
          className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/40 border border-white/20 shadow-sm flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#1A3C5E]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Policy Document</h1>
                <span className="mono-data text-sm font-semibold">{policy.policyId}</span>
              </div>
            </div>
            <button
              onClick={() => downloadPolicyCertificate(policy)}
              className="bg-[#0F172A] hover:bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5"
            >
              <Download size={16} /> Export PDF
            </button>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Insured Name', value: policy.insuredName },
              { label: 'Platform', value: policy.platform },
              { label: 'Risk Grade', value: <span className={gradeStyle(policy.riskGrade)}>{policy.riskGrade || 'A'}</span> },
              { label: 'Base State', value: policy.baseState?.name || 'Unknown' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="section-label">{label}</p>
                <p className="text-sm font-semibold text-[#1A1A1A] mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Live Oracle Band */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={14} className="text-emerald-600" />
              <span className="text-xs font-bold text-[#1A3C5E] uppercase tracking-widest">Live Actuarial Oracle</span>
              {!mlLoading && (
                <span className="ml-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* ML Premium */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">ML Premium</p>
                {mlLoading ? (
                  <div className="h-5 w-24 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-[#1A3C5E]">{displayPremium}</p>
                )}
              </div>

              {/* Risk Score (multiplier - 1) */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">Risk Score</p>
                {mlLoading ? (
                  <div className="h-5 w-20 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <>
                    <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-[#E85D04]">{displayRiskScore}</p>
                    {multiplier != null && (
                      <p className="text-[10px] text-gray-400 mt-0.5">×{multiplier.toFixed(4)} multiplier</p>
                    )}
                  </>
                )}
              </div>

              {/* Temperature */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">Temperature</p>
                {mlLoading ? (
                  <div className="h-5 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-[#1A3C5E]">
                    {weather?.temperature_c != null ? `${weather.temperature_c.toFixed(1)}\u00b0C` : '—'}
                  </p>
                )}
              </div>

              {/* Humidity */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">Humidity</p>
                {mlLoading ? (
                  <div className="h-5 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-[#1A3C5E]">
                    {weather?.humidity != null ? `${Math.round(weather.humidity)}%` : '—'}
                  </p>
                )}
              </div>

              {/* AQI */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">AQI (US)</p>
                {mlLoading ? (
                  <div className="h-5 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-[#0F7B6C]">
                    {weather?.aqi != null ? Math.round(weather.aqi) : '—'}
                  </p>
                )}
              </div>

              {/* Rainfall */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <p className="section-label mb-1">Rainfall</p>
                {mlLoading ? (
                  <div className="h-5 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                ) : (
                  <>
                    <p className="font-['JetBrains_Mono',monospace] text-base font-bold text-blue-600">
                      {weather?.rain_mm != null ? `${weather.rain_mm.toFixed(1)}mm` : '0.0mm'}
                    </p>
                    {(weather?.rain_mm ?? 0) > 60 && (
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider mt-0.5">⚠ Trigger
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Back Link */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F172A] mt-8 transition-colors"
          >
            ← Back to Command Center
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
