import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Activity, ShieldAlert, CloudRain, Wind, Zap, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import DashSidebar from '../DashSidebar';
import { fetchPlatformHealth, ingestTrigger } from '../../services/api';
import { usePolicy } from '../../contexts/PolicyContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../utils/reverseGeocode';

// ─── 7-Day Income Simulation ─────────────────────────────────
function generateIncomeData(survivalThreshold, disrupted = false) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => {
    const base = survivalThreshold + (Math.random() * 300 - 100);
    const isDisrupted = disrupted && (i === 3 || i === 4); // Thu/Fri disrupted
    const income = isDisrupted ? base * 0.35 : base;
    return {
      day,
      income: Math.round(Math.max(0, income)),
      projected: Math.round(base),
      threshold: survivalThreshold,
    };
  });
}

// Generate recovery data after a successful trigger payout
function generateRecoveryData(survivalThreshold) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => {
    const base = survivalThreshold + (Math.random() * 300 - 100);
    const wasDisrupted = i === 3 || i === 4;
    // Show recovery: disrupted income + payout brings it back above threshold
    const disrupted = wasDisrupted ? base * 0.35 : base;
    const payout = wasDisrupted ? survivalThreshold * 0.6 : 0;
    return {
      day,
      income: Math.round(Math.max(0, disrupted + payout)),
      projected: Math.round(base),
      threshold: survivalThreshold,
    };
  });
}

// ─── Loss Ratio Ring Component ───────────────────────────────
function LossRatioGauge({ ratio, circuitBreakerActive }) {
  const pct = Math.min(ratio * 100, 100);
  const circumference = 2 * Math.PI * 60;
  const strokeDash = (pct / 100) * circumference;

  let color = '#059669'; // Green
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

// ─── Trigger Toast ───────────────────────────────────────────
function TriggerToast({ result, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isSuccess = result?.status === 'CLAIMS_CREATED';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-xl max-w-sm ${
        isSuccess
          ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-100'
          : 'bg-amber-900/90 border-amber-500/30 text-amber-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {isSuccess ? <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />}
        <div>
          <p className="font-bold text-sm">{isSuccess ? 'Trigger Accepted' : 'Below Threshold'}</p>
          <p className="text-xs mt-1 opacity-80">{result?.message || 'Unknown response'}</p>
          {result?.claims_created > 0 && (
            <p className="text-xs mt-1 font-mono font-bold">{result.claims_created} claim(s) auto-created</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── DEMO DATA SEEDS ─────────────────────────────────────────
const DEMO_PREMIUM = 450000;
const DEMO_NODES = 1204;
const DEMO_PAYOUT = 82400;
const DEMO_LOSS_RATIO = 0.183;

// ─── Main Component ──────────────────────────────────────────
export default function AnalyticsHub() {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // GPS acquisition
  const geo = useGeolocation();
  const [geoInfo, setGeoInfo] = useState(null);

  // Get personalized data from PolicyContext
  const policyCtx = usePolicy();

  // Resolve area category from GPS or policy
  const areaCategory = geoInfo?.areaCategory || policyCtx?.areaCategory || 'URBAN';
  const lAvg = geoInfo?.lAvg || (areaCategory === 'RURAL' ? 400 : 800);
  // Derive ward from GPS city name, not hardcoded Delhi
  const gpsWardId = geoInfo?.city
    ? `${geoInfo.city.toUpperCase().replace(/\s+/g, '_')}_ZONE`
    : null;
  const wardId = gpsWardId || policyCtx?.wardId || 'LOCAL_ZONE';
  const cityName = geoInfo?.city || policyCtx?.activePolicy?.city || 'India';

  const [incomeData, setIncomeData] = useState(() => generateIncomeData(lAvg));
  const [demoPayout, setDemoPayout] = useState(DEMO_PAYOUT);

  // Trigger simulation state
  const [rainSlider, setRainSlider] = useState(30);
  const [aqiSlider, setAqiSlider] = useState(150);
  const [triggerStatus, setTriggerStatus] = useState({ rain: false, aqi: false });
  const [triggerFiring, setTriggerFiring] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  // ─── Reverse Geocode on GPS acquisition ─────────────────
  useEffect(() => {
    if (!geo.isLoading && geo.latitude && geo.longitude) {
      reverseGeocode(geo.latitude, geo.longitude).then(info => {
        setGeoInfo(info);
      });
    }
  }, [geo.isLoading, geo.latitude, geo.longitude]);

  // Regenerate income data when L_avg changes
  useEffect(() => {
    setIncomeData(generateIncomeData(lAvg));
  }, [lAvg]);

  // ─── Platform Health Polling (10s) ──────────────────────────
  const loadHealth = useCallback(async () => {
    const res = await fetchPlatformHealth();
    if (res.success && res.data) {
      setHealth(res.data);
      setDemoMode(false);
    } else {
      // Backend unreachable — activate demo mode
      setDemoMode(true);
    }
    setHealthLoading(false);
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  // ─── Threshold breach detection ────────────────────────────
  useEffect(() => {
    setTriggerStatus({
      rain: rainSlider > 60,
      aqi: aqiSlider > 300,
    });
  }, [rainSlider, aqiSlider]);

  // ─── Fire Trigger to Backend ───────────────────────────────
  const handleFireTrigger = useCallback(async (type) => {
    setTriggerFiring(true);
    try {
      const triggerData = {
        trigger_type: type === 'rain' ? 'RAINFALL' : 'AQI',
        value: type === 'rain' ? rainSlider : aqiSlider,
        ward_id: wardId,
        city: cityName,
        timestamp: new Date().toISOString(),
      };
      const res = await ingestTrigger(triggerData);
      if (res.success) {
        setTriggerResult(res.data);
        // Update income graph to show recovery pattern after successful trigger
        if (res.data?.status === 'CLAIMS_CREATED') {
          setIncomeData(generateRecoveryData(lAvg));
          setDemoPayout(prev => prev + (lAvg * 2.5));
        }
      } else {
        // In demo mode, simulate a successful trigger
        if (demoMode) {
          const simResult = {
            status: 'CLAIMS_CREATED',
            message: `[DEMO] ${type === 'rain' ? 'Rainfall' : 'AQI'} breach verified. ${type === 'rain' ? rainSlider : aqiSlider}${type === 'rain' ? 'mm' : ''} exceeds threshold. Payout auto-created.`,
            claims_created: 1,
          };
          setTriggerResult(simResult);
          setIncomeData(generateRecoveryData(lAvg));
          setDemoPayout(prev => prev + (lAvg * 2.5));
        } else {
          setTriggerResult({ status: 'ERROR', message: res.error || 'Backend error' });
        }
      }
    } catch (e) {
      if (demoMode) {
        const simResult = {
          status: 'CLAIMS_CREATED',
          message: `[DEMO] Trigger simulated locally. Payout auto-dispatched.`,
          claims_created: 1,
        };
        setTriggerResult(simResult);
        setIncomeData(generateRecoveryData(lAvg));
        setDemoPayout(prev => prev + (lAvg * 2.5));
      } else {
        setTriggerResult({ status: 'ERROR', message: e.message });
      }
    } finally {
      setTriggerFiring(false);
    }
  }, [rainSlider, aqiSlider, wardId, cityName, demoMode, lAvg]);

  // Derive values (use health data if available, fallback to DEMO seeds)
  const healthData = health?.platform_health || health;
  const totalPremium = healthData?.total_premium_collected ?? DEMO_PREMIUM;
  const activePolicies = healthData?.total_policies_active ?? DEMO_NODES;
  const totalPayout = healthData?.total_payout_disbursed ?? demoPayout;
  const lossRatio = healthData?.loss_ratio ?? DEMO_LOSS_RATIO;
  const circuitBreaker = healthData?.circuit_breaker_active ?? false;
  const survivalThreshold = lAvg;

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background Atmosphere */}
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
                <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex items-center gap-2">
               <span className={`w-2.5 h-2.5 rounded-full ${healthLoading ? 'bg-amber-400' : demoMode ? 'bg-amber-400' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]`} />
               <span className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em] hidden sm:inline">
                 {healthLoading ? 'Syncing...' : demoMode ? 'Demo Engine' : 'Engine Online'}
               </span>
            </div>
          </div>

          {/* Coverage Compliance Banner */}
          <div className="mb-6 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <ShieldAlert size={16} className="text-[#1A3C5E] shrink-0" />
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              COVERAGE: Loss of Income ONLY · PERSONA: Food Delivery · BILLING: Weekly (₹20–₹50) · CIRCUIT BREAKER: 85% Loss Ratio
            </span>
          </div>

          {/* KPI Cards — Dynamic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Total Protected Volume', value: `₹${(totalPremium / 1000).toFixed(0)}K`, icon: DollarSign, trend: `+${(9.4).toFixed(1)}%` },
              { label: 'Active Risk Nodes', value: activePolicies.toLocaleString('en-IN'), icon: Activity, trend: `+${(5.7).toFixed(1)}%` },
              { label: 'Automated Payouts', value: `₹${(totalPayout / 1000).toFixed(0)}K`, icon: TrendingUp, trend: `+${(4.8).toFixed(1)}%` },
            ].map(({ label, value, icon: Icon, trend }) => (
              <motion.div
                key={label}
                className="bg-white/40 border border-white/30 p-6 rounded-xl relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/50 rounded-lg shadow-sm border border-white/40"><Icon size={20} className="text-[#0F7B6C]"/></div>
                  <span className="text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">{trend}</span>
                </div>
                <h2 className="text-3xl font-bold text-[#111] font-['Instrument_Serif']">{value}</h2>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Two-Column Layout: Chart + Loss Ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Income Stability Graph */}
            <div className="lg:col-span-2 bg-white/30 backdrop-blur-md border border-white/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">7-Day Income Stability</h3>
                  <span className="text-[10px] text-gray-500">
                    Projected vs Actual · Survival Threshold: ₹{survivalThreshold}/day ({areaCategory})
                  </span>
                </div>
                <button
                  onClick={() => setIncomeData(generateIncomeData(survivalThreshold))}
                  className="text-xs text-[#1A3C5E] font-semibold hover:text-[#0F7B6C] transition-colors bg-white/40 px-2 py-1 rounded-md border border-white/30"
                >
                  ↻ Refresh
                </button>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={incomeData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A3C5E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A3C5E" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F7B6C" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0F7B6C" stopOpacity={0}/>
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
                  <span className="font-mono text-sm font-bold text-[#1A3C5E]">₹{(totalPremium / 1000).toFixed(0)}K</span>
                </div>
                <div className="bg-white/30 rounded-lg p-2 text-center border border-white/20">
                  <span className="text-[10px] text-gray-500 uppercase block">Disbursed</span>
                  <span className="font-mono text-sm font-bold text-[#E85D04]">₹{(totalPayout / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Simulation Panel */}
          <motion.div
            className="bg-[#0F172A] rounded-2xl p-6 border border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parametric Trigger Simulation</h3>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider">
                ORACLE SANDBOX
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Rain Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <CloudRain size={14} className="text-blue-400" /> Rainfall (mm/hr)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{rainSlider}mm</span>
                    {triggerStatus.rain && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5 text-[10px] font-bold animate-pulse"
                      >
                        BREACH
                      </motion.span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range" min="0" max="120" value={rainSlider}
                    onChange={(e) => setRainSlider(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(rainSlider / 120) * 100}%, #1E293B ${(rainSlider / 120) * 100}%, #1E293B 100%)`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-2 border-r-2 border-red-500 pointer-events-none"
                    style={{ left: `${(60 / 120) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-600">0mm</span>
                  <span className="text-[9px] text-red-500 font-bold">Threshold: 60mm</span>
                  <span className="text-[9px] text-gray-600">120mm</span>
                </div>
                {triggerStatus.rain && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleFireTrigger('rain')}
                    disabled={triggerFiring}
                    className="mt-3 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                  >
                    {triggerFiring ? (
                      <motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" /> 🔴 Fire Rainfall Trigger ({rainSlider}mm)</>
                    )}
                  </motion.button>
                )}
              </div>

              {/* AQI Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Wind size={14} className="text-purple-400" /> AQI Index
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{aqiSlider}</span>
                    {triggerStatus.aqi && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 rounded px-2 py-0.5 text-[10px] font-bold animate-pulse"
                      >
                        BREACH
                      </motion.span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range" min="0" max="500" value={aqiSlider}
                    onChange={(e) => setAqiSlider(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #A855F7 0%, #A855F7 ${(aqiSlider / 500) * 100}%, #1E293B ${(aqiSlider / 500) * 100}%, #1E293B 100%)`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-2 border-r-2 border-red-500 pointer-events-none"
                    style={{ left: `${(300 / 500) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-600">0</span>
                  <span className="text-[9px] text-red-500 font-bold">Threshold: 300</span>
                  <span className="text-[9px] text-gray-600">500</span>
                </div>
                {triggerStatus.aqi && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleFireTrigger('aqi')}
                    disabled={triggerFiring}
                    className="mt-3 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                  >
                    {triggerFiring ? (
                      <motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" /> 🔴 Fire AQI Trigger ({aqiSlider})</>
                    )}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(triggerStatus.rain || triggerStatus.aqi) ? (
                  <span className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    THRESHOLD BREACHED — Use button above to fire trigger
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    All parameters within safe bounds
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-600 font-mono">
                RAIN:{rainSlider}mm | AQI:{aqiSlider} | WARD:{wardId} | MODE:{demoMode ? 'DEMO' : 'LIVE'}
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

      {/* Trigger Result Toast */}
      <AnimatePresence>
        {triggerResult && (
          <TriggerToast result={triggerResult} onDismiss={() => setTriggerResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
