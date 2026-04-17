import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, Activity, ShieldAlert,
  CloudRain, Wind, Cpu, MapPin, Thermometer, Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import DashSidebar from '../DashSidebar';
import { fetchPlatformHealth } from '../../services/api';
import { usePolicy } from '../../contexts/PolicyContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../utils/reverseGeocode';
import { useKavachData } from '../../hooks/useKavachData';

// ─── Income chart generator ────────────────────────────────────
// The last point (Sunday = "Today") is pinned to the live multiplier:
//   - multiplier > 1.5  → disrupted day (income drops)
//   - multiplier 1.2–1.5 → slight dip
//   - multiplier < 1.2  → normal / above
function generateIncomeData(survivalThreshold, liveMultiplier = null) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => {
    const base = survivalThreshold + (Math.random() * 300 - 100);

    let income;
    if (i === 6 && liveMultiplier != null) {
      // Sunday = TODAY — driven by live ML multiplier
      // High multiplier → high environmental risk → lower actual income
      const riskFactor = Math.min(liveMultiplier, 2.5);
      const disruptionPct = Math.min(0.85, (riskFactor - 1) * 0.6);
      income = Math.round(Math.max(0, base * (1 - disruptionPct)));
    } else {
      income = Math.round(Math.max(0, base));
    }

    return {
      day: i === 6 ? 'Today' : day,
      income,
      projected: Math.round(base),
      threshold: survivalThreshold,
    };
  });
}

// ─── Loss Ratio Ring ──────────────────────────────────────────
function LossRatioGauge({ ratio, circuitBreakerActive }) {
  const pct = Math.min(ratio * 100, 100);
  const circumference = 2 * Math.PI * 60;
  const strokeDash = (pct / 100) * circumference;

  let color = '#059669';
  let label = 'HEALTHY';
  if (pct >= 85) { color = '#DC2626'; label = 'CIRCUIT BREAKER'; }
  else if (pct >= 50) { color = '#E85D04'; label = 'ELEVATED'; }

  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="150" className="transform -rotate-90">
        <circle cx="75" cy="75" r="60" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="75" cy="75" r="60" stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${strokeDash} ${circumference - strokeDash}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '40px' }}>
        <span className="font-['JetBrains_Mono',monospace] text-3xl font-black" style={{ color }}>{pct.toFixed(1)}%</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">Loss Ratio</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${pct >= 85 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${pct >= 85 ? 'text-red-600' : pct >= 50 ? 'text-amber-600' : 'text-emerald-600'}`}>{label}</span>
      </div>
      {circuitBreakerActive && (
        <motion.div
          className="mt-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ShieldAlert size={14} className="text-red-500" />
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">ENROLLMENT HALTED</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          <span className="font-mono font-bold">₹{entry.value}</span>
          <span className="text-gray-400 ml-1">{entry.name}</span>
        </p>
      ))}
    </div>
  );
}

// ─── DEMO DATA SEEDS ─────────────────────────────────────────
const DEMO_PREMIUM  = 450000;
const DEMO_NODES    = 1204;
const DEMO_PAYOUT   = 82400;
const DEMO_LOSS_RATIO = 0.183;

// ─── AQI → active risk node count ────────────────────────────
// Each environmental condition that breaches its threshold = 1 additional "active" risk node.
function deriveActiveRiskNodes(base, liveWeather) {
  if (!liveWeather) return base;
  let extra = 0;
  if ((liveWeather.aqi ?? 0) > 100)         extra += 1;  // AQI hazard threshold
  if ((liveWeather.temperature_c ?? 0) > 38) extra += 1;  // heat stress threshold
  if ((liveWeather.humidity ?? 0) > 85)      extra += 1;  // high-humidity disruption
  return base + extra;
}

// ─── Main Component ──────────────────────────────────────────
export default function AnalyticsHub() {
  const [health, setHealth]           = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [demoMode, setDemoMode]       = useState(false);

  // ── Live Oracle ─────────────────────────────────────────────
  const {
    weather: liveWeather,
    premium: livePremium,
    multiplier: liveMultiplier,
    loading: liveLoading,
  } = useKavachData();

  // GPS
  const geo = useGeolocation();
  const [geoInfo, setGeoInfo] = useState(null);

  const policyCtx = usePolicy();
  const areaCategory = geoInfo?.areaCategory || policyCtx?.areaCategory || 'URBAN';
  const lAvg        = geoInfo?.lAvg || (areaCategory === 'RURAL' ? 400 : 800);
  const gpsWardId   = geoInfo?.city
    ? `${geoInfo.city.toUpperCase().replace(/\s+/g, '_')}_ZONE`
    : null;
  const wardId   = gpsWardId || policyCtx?.wardId || 'LOCAL_ZONE';
  const cityName = geoInfo?.city || policyCtx?.activePolicy?.city || 'India';

  // Income chart — re-generates when lAvg or live multiplier changes
  const [incomeData, setIncomeData] = useState(() => generateIncomeData(lAvg, null));

  useEffect(() => {
    if (!liveLoading) {
      setIncomeData(generateIncomeData(lAvg, liveMultiplier));
    }
  }, [lAvg, liveMultiplier, liveLoading]);

  useEffect(() => {
    if (!geo.isLoading && geo.latitude && geo.longitude) {
      reverseGeocode(geo.latitude, geo.longitude).then(info => setGeoInfo(info));
    }
  }, [geo.isLoading, geo.latitude, geo.longitude]);

  // Platform health polling (10 s)
  const loadHealth = useCallback(async () => {
    const res = await fetchPlatformHealth();
    if (res.success && res.data) {
      setHealth(res.data);
      setDemoMode(false);
    } else {
      setDemoMode(true);
    }
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  // Derive KPI values
  const healthData    = health?.platform_health || health;
  const totalPremium  = healthData?.total_premium_collected ?? DEMO_PREMIUM;
  const baseNodes     = healthData?.total_policies_active   ?? DEMO_NODES;
  const activePolicies = deriveActiveRiskNodes(baseNodes, liveWeather);
  const totalPayout   = healthData?.total_payout_disbursed  ?? DEMO_PAYOUT;
  const lossRatio     = healthData?.loss_ratio              ?? DEMO_LOSS_RATIO;
  const circuitBreaker = healthData?.circuit_breaker_active ?? false;
  const survivalThreshold = lAvg;

  // Live oracle status string
  const oracleStatusLabel = liveLoading
    ? 'Syncing Oracle...'
    : liveWeather?.source === 'live'
      ? 'Verified Oracle Feed'
      : 'Live Network Data';

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="analytics" />

      <main className="relative z-10 flex-1 p-8 overflow-y-auto">
        <motion.div
          className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8 max-w-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/40 border border-white/20 shadow-sm flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#1A3C5E]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Financial Intelligence</h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="mono-data text-sm font-semibold">LIVE TELEMETRY FEED</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                    areaCategory === 'URBAN'
                      ? 'bg-[#1A3C5E]/10 text-[#1A3C5E] border border-[#1A3C5E]/20'
                      : 'bg-[#0F7B6C]/10 text-[#0F7B6C] border border-[#0F7B6C]/20'
                  }`}>
                    {areaCategory} · L<sub>avg</sub>=₹{lAvg}
                  </span>
                  {geoInfo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                      <MapPin size={10} /> {geoInfo.city}
                    </span>
                  )}
                  {demoMode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                      DEMO MODE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Oracle status pill */}
            <div className="flex items-center gap-2">
              <Radio size={14} className={liveLoading ? 'text-amber-500' : 'text-emerald-500'} />
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                liveLoading ? 'bg-amber-400' : demoMode ? 'bg-amber-400' : 'bg-emerald-500'
              } shadow-[0_0_10px_rgba(16,185,129,0.8)]`} />
              <span className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em] hidden sm:inline">
                {oracleStatusLabel}
              </span>
            </div>
          </div>

          {/* Coverage Banner */}
          <div className="mb-6 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <ShieldAlert size={16} className="text-[#1A3C5E] shrink-0" />
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              COVERAGE: Loss of Income ONLY · PERSONA: Food Delivery · BILLING: Weekly · CIRCUIT BREAKER: 85% Loss Ratio
            </span>
          </div>

          {/* Live Oracle Telemetry Strip */}
          <motion.div
            className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {[
              {
                icon: Thermometer, iconClass: 'text-orange-500',
                label: 'Temperature', bg: 'bg-orange-50/50',
                shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]',
                value: liveWeather?.temperature_c != null
                  ? `${liveWeather.temperature_c.toFixed(1)}°C` : null,
              },
              {
                icon: Wind, iconClass: 'text-teal-600',
                label: 'AQI (US)', bg: 'bg-teal-50/50',
                shadow: 'shadow-[0_0_12px_rgba(20,184,166,0.2)]',
                value: liveWeather?.aqi != null
                  ? Math.round(liveWeather.aqi).toString() : null,
              },
              {
                icon: CloudRain, iconClass: 'text-blue-600',
                label: 'Rainfall', bg: 'bg-blue-50/50',
                shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]',
                // rain_mm from Open-Meteo precipitation — 0.0 when dry
                value: liveWeather?.rain_mm != null
                  ? `${liveWeather.rain_mm.toFixed(1)}mm`
                  : '0.0mm',
                alert: (liveWeather?.rain_mm ?? 0) > 60,
              },
              {
                icon: Cpu, iconClass: 'text-emerald-600',
                label: 'ML Premium', bg: 'bg-emerald-50/50',
                shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
                value: livePremium != null ? `₹${livePremium.toFixed(2)}/wk` : null,
                sub: liveMultiplier != null ? `Risk ×${liveMultiplier.toFixed(2)}` : null,
                isAI: true,
              },
            ].map(({ icon: Icon, iconClass, label, value, sub, bg, shadow, isAI }) => (
              <div key={label} className={`${bg} backdrop-blur-md border border-white/40 rounded-xl p-4 flex items-center gap-3 ${shadow}`}>
                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={iconClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{label}</p>
                    {isAI && (
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1 py-0.5">AI</span>
                    )}
                    {alert && (
                      <span className="text-[8px] font-bold text-red-600 bg-red-500/10 border border-red-500/20 rounded-full px-1 py-0.5 animate-pulse">⚠ HIGH</span>
                    )}
                  </div>
                  {liveLoading ? (
                    <div className="h-4 w-16 bg-gray-200/60 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-sm font-mono font-bold text-[#1A1A1A] mt-0.5">{value ?? '—'}</p>
                  )}
                  {sub && !liveLoading && <p className="text-[10px] text-gray-400">{sub}</p>}
                </div>
              </div>
            ))}
          </motion.div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Total Protected Volume',
                value: totalPremium > 0 ? `₹${(totalPremium / 1000).toFixed(1)}K` : '₹450K',
                icon: DollarSign,
                trend: '+9.4%',
              },
              {
                label: 'Active Risk Nodes',
                // Derived from backend count + live weather breach count
                value: activePolicies.toLocaleString('en-IN'),
                icon: Activity,
                trend: liveWeather?.aqi > 100 ? '⚠ AQI Alert' : '+5.7%',
                trendRed: (liveWeather?.aqi ?? 0) > 100,
              },
              {
                label: 'Automated Payouts',
                value: `₹${(totalPayout / 1000).toFixed(1)}K`,
                icon: TrendingUp,
                trend: '+4.8%',
              },
            ].map(({ label, value, icon: Icon, trend, trendRed }) => (
              <motion.div
                key={label}
                className="bg-white/40 border border-white/30 p-6 rounded-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/50 rounded-lg shadow-sm border border-white/40">
                    <Icon size={20} className="text-[#0F7B6C]" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                    trendRed
                      ? 'bg-red-50 border-red-100 text-red-600'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    {trend}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-[#111] font-['Instrument_Serif']">{value}</h2>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart + Loss Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 7-Day Income Stability — Today driven by live multiplier */}
            <div className="lg:col-span-2 bg-white/30 backdrop-blur-md border border-white/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">7-Day Income Stability</h3>
                    {!liveLoading && liveMultiplier != null && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500">
                    Projected vs Actual · Survival: ₹{survivalThreshold}/day ({areaCategory})
                    {liveMultiplier != null && !liveLoading && (
                      <> · Today risk ×{liveMultiplier.toFixed(2)}</>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => setIncomeData(generateIncomeData(survivalThreshold, liveMultiplier))}
                  className="text-xs text-[#1A3C5E] font-semibold hover:text-[#0F7B6C] transition-colors bg-white/40 px-2 py-1 rounded-md border border-white/30"
                >
                  ↻ Refresh
                </button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={incomeData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A3C5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1A3C5E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7B6C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0F7B6C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                  <Tooltip content={<GlassTooltip />} />
                  <ReferenceLine
                    y={survivalThreshold}
                    stroke="#E85D04"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{ value: `Survival ₹${survivalThreshold}`, position: 'right', fill: '#E85D04', fontSize: 10, fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="projected" stroke="#0F7B6C" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#colorProjected)" name="Projected" />
                  <Area type="monotone" dataKey="income" stroke="#1A3C5E" strokeWidth={2.5} fill="url(#colorIncome)" name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Loss Ratio Gauge */}
            <div className="bg-white/30 backdrop-blur-md border border-white/30 rounded-xl p-6 flex flex-col items-center justify-center relative">
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-4 self-start">85% Circuit Breaker</h3>
              <div className="relative">
                <LossRatioGauge ratio={lossRatio} circuitBreakerActive={circuitBreaker} />
              </div>
              <div className="mt-4 w-full grid grid-cols-2 gap-2">
                <div className="bg-white/30 rounded-lg p-2 text-center border border-white/20">
                  <span className="text-[10px] text-gray-500 uppercase block">Collected</span>
                  <span className="font-mono text-sm font-bold text-[#1A3C5E]">₹{(totalPremium / 1000).toFixed(1)}K</span>
                </div>
                <div className="bg-white/30 rounded-lg p-2 text-center border border-white/20">
                  <span className="text-[10px] text-gray-500 uppercase block">Disbursed</span>
                  <span className="font-mono text-sm font-bold text-[#E85D04]">₹{(totalPayout / 1000).toFixed(1)}K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Oracle Feed status card (replaces Trigger Simulation) */}
          <motion.div
            className="bg-[#0F172A] rounded-2xl p-6 border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Radio size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Oracle Feed</h3>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider">
                VERIFIED ORACLE FEED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Temperature */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer size={14} className="text-orange-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Temperature</span>
                </div>
                {liveLoading ? (
                  <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="font-mono text-2xl font-bold text-white">
                      {liveWeather?.temperature_c != null ? `${liveWeather.temperature_c.toFixed(1)}°C` : '—'}
                    </p>
                    <p className={`text-[10px] font-semibold mt-1 ${
                      (liveWeather?.temperature_c ?? 0) > 38 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {(liveWeather?.temperature_c ?? 0) > 38 ? '⚠ Heat Stress Threshold Breached' : '✓ Within Safe Bounds'}
                    </p>
                  </>
                )}
              </div>

              {/* AQI */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wind size={14} className="text-teal-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">AQI Index</span>
                </div>
                {liveLoading ? (
                  <div className="h-8 w-20 bg-white/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="font-mono text-2xl font-bold text-white">
                      {liveWeather?.aqi != null ? Math.round(liveWeather.aqi) : '—'}
                    </p>
                    <p className={`text-[10px] font-semibold mt-1 ${
                      (liveWeather?.aqi ?? 0) > 300 ? 'text-red-400'
                      : (liveWeather?.aqi ?? 0) > 100 ? 'text-amber-400'
                      : 'text-emerald-400'
                    }`}>
                      {(liveWeather?.aqi ?? 0) > 300 ? '⚠ Hazardous — Payout Trigger Armed'
                        : (liveWeather?.aqi ?? 0) > 100 ? '⚡ Elevated — Risk Nodes Flagged'
                        : '✓ Within Safe Bounds'}
                    </p>
                  </>
                )}
              </div>

              {/* ML Risk Multiplier */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={14} className="text-emerald-400" />
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">ML Risk Multiplier</span>
                </div>
                {liveLoading ? (
                  <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />
                ) : (
                  <>
                    <p className="font-mono text-2xl font-bold text-white">
                      {liveMultiplier != null ? `×${liveMultiplier.toFixed(4)}` : '—'}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-400 mt-1">
                      Premium: ₹{livePremium != null ? livePremium.toFixed(2) : '—'}/wk
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${liveLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={`text-xs font-bold ${liveLoading ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {liveLoading ? 'Fetching Live Oracle Data...' : 'All signals streaming from Open-Meteo · Kattankulathur'}
                </span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">
                TEMP:{liveWeather?.temperature_c?.toFixed(1) ?? '—'}°C | AQI:{liveWeather?.aqi != null ? Math.round(liveWeather.aqi) : '—'} | WARD:{wardId} | ML:×{liveMultiplier?.toFixed(2) ?? '—'}
              </span>
            </div>
          </motion.div>

          <div className="mt-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F172A] transition-colors"
            >
              ← Back to Command Center
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
