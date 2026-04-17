import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Wind, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Shield, MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import { usePolicy } from '../../contexts/PolicyContext';
import DashSidebar from '../DashSidebar';
import TacticalMap from '../claims/TacticalMap';
import ClaimHistoryCard from '../claims/ClaimHistoryCard';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../utils/reverseGeocode';
import { useKavachData } from '../../hooks/useKavachData';

const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ── Thresholds (must match backend autonomous_trigger_service.py) ──
const RAIN_THRESHOLD = 50;
const TEMP_THRESHOLD = 40;
const AQI_THRESHOLD  = 200;

// ── Build Oracle Monitor cards from live data ────────────────────────
function getOracleCards(liveWeather) {
  const rain = liveWeather?.rain_mm  ?? 0;
  const temp = liveWeather?.temperature_c ?? 30;
  const aqi  = liveWeather?.aqi ?? 0;

  const badge = (val, thr) => val >= thr
    ? { label: 'BREACH', cls: 'bg-red-100/90 text-red-700 border-red-200/50 animate-pulse' }
    : { label: 'ARMED',  cls: 'bg-amber-100/90 text-amber-700 border-amber-200/50' };

  return [
    {
      key: 'rain',
      label: 'Rainfall Oracle',
      icon: <CloudRain size={28} />,
      value: `${rain.toFixed(1)} mm/hr`,
      threshold: `Threshold: ${RAIN_THRESHOLD}mm`,
      badge: badge(rain, RAIN_THRESHOLD),
    },
    {
      key: 'heat',
      label: 'Heat Wave Oracle',
      icon: <Sun size={28} />,
      value: `${temp.toFixed(1)}°C`,
      threshold: `Threshold: ${TEMP_THRESHOLD}°C`,
      badge: badge(temp, TEMP_THRESHOLD),
    },
    {
      key: 'aqi',
      label: 'AQI Oracle',
      icon: <Wind size={28} />,
      value: `AQI ${Math.round(aqi)}`,
      threshold: `Threshold: ${AQI_THRESHOLD} AQI`,
      badge: badge(aqi, AQI_THRESHOLD),
    },
  ];
}

// ── Main Component ────────────────────────────────────────────────────
export default function ClaimTriggerLog() {
  const { policy, triggers, isLoading } = useCenterData();
  const policyCtx = usePolicy();
  const { weather: liveWeather, multiplier } = useKavachData();

  // Live GPS acquisition
  const geo = useGeolocation();
  const [geoInfo, setGeoInfo] = useState(null);

  useEffect(() => {
    if (!geo.isLoading && geo.latitude && geo.longitude) {
      reverseGeocode(geo.latitude, geo.longitude).then(info => setGeoInfo(info));
    }
  }, [geo.isLoading, geo.latitude, geo.longitude]);

  const areaCategory = geoInfo?.areaCategory || policyCtx?.areaCategory || 'RURAL';
  const cityName     = geoInfo?.city || 'Kattankulathur';
  const riskGrade    = policyCtx?.activePolicy?.riskGrade || 'B';

  const userCoords = {
    latitude:     geo.latitude,
    longitude:    geo.longitude,
    areaCategory,
    riskGrade,
  };

  const oracleCards = getOracleCards(liveWeather);

  // ── Autonomous Oracle state ──────────────────────────────────────
  const [oracleState, setOracleState] = useState({
    monitoring: true,
    breaches:   [],
    checkedAt:  null,
    dataSource: 'loading',
  });
  const [oracleLoading, setOracleLoading] = useState(true);

  const [activeClaim, setActiveClaim] = useState(null);

  // Firestore / backend pipeline claims (real policies)
  const [backendClaims, setBackendClaims] = useState([]);

  // ── Poll the Autonomous Oracle every 30 s ───────────────────────
  const checkOracle = useCallback(async () => {
    try {
      const mult = multiplier ?? 1.0;
      const res = await fetch(
        `${BACKEND}/api/oracle/status?area_category=${areaCategory}&risk_multiplier=${mult}`
      );
      if (res.ok) {
        const data = await res.json();
        setOracleState({
          monitoring: data.monitoring ?? true,
          breaches:   data.breaches   ?? [],
          checkedAt:  data.checked_at ?? new Date().toISOString(),
          dataSource: data.data_source ?? 'live',
        });
      }
    } catch (e) {
      console.warn('[Oracle] check failed:', e.message);
    } finally {
      setOracleLoading(false);
    }
  }, [areaCategory, multiplier]);

  useEffect(() => {
    checkOracle();
    const id = setInterval(checkOracle, 30_000);
    return () => clearInterval(id);
  }, [checkOracle]);

  // ── Poll backend /claims pipeline every 5 s ─────────────────────
  const loadBackendClaims = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/claims/`);
      if (res.ok) {
        const data = await res.json();
        const claims = Array.isArray(data) ? data : (data.claims || []);
        setBackendClaims(claims.map(c => ({
          id:           c.claim_id || c.id,
          event:        c.trigger_type || c.event || 'Parametric Event',
          trigger_type: c.trigger_type,
          status:       c.state || c.status || 'DETECTED',
          payoutAmount: c.payout_amount || c.payoutAmount || 0,
          value:        c.value || c.trigger_value || 0,
          reason:       c.reason || null,
          createdAt:    c.created_at || c.createdAt || new Date().toISOString(),
          source:       'backend',
        })));
      }
    } catch {
      // backend offline — show oracle events only
    }
  }, []);

  useEffect(() => {
    loadBackendClaims();
    const id = setInterval(loadBackendClaims, 5_000);
    return () => clearInterval(id);
  }, [loadBackendClaims]);

  // ── Merge: pipeline claims + oracle breach events ────────────────
  const allClaims = [
    ...backendClaims,
    ...oracleState.breaches,
    ...(triggers || []).map(t => ({ ...t, source: 'firestore' })),
  ].filter(c => c.event !== 'SYSTEM_ARMED' && c.status !== 'MONITORING');

  // Auto-focus first claim
  useEffect(() => {
    if (allClaims.length > 0 && !activeClaim) {
      setActiveClaim(allClaims[0]);
    }
  }, [allClaims.length]);

  // ── Number of active breaches (for badge) ────────────────────────
  const breachCount = oracleState.breaches.length + backendClaims.length;

  // ────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ────────────────────────────────────────────────────────────────
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

  // ── No policy CTA ────────────────────────────────────────────────
  if (!policy) {
    return (
      <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <DashSidebar activeTab="claims" />
        <main className="relative z-10 flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center max-w-md shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center mx-auto mb-5">
              <Shield size={28} className="text-[#FF6B00]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Activate Claim Radar</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Complete the registration wizard to activate the real-time claim radar. Your parametric triggers will be monitored 24/7 across weather and platform data oracles.
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

  // ────────────────────────────────────────────────────────────────
  // MAIN VIEW
  // ────────────────────────────────────────────────────────────────
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

        {/* ── Top Nav bar ──────────────────────────────────────── */}
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

          <div className="ml-auto flex items-center gap-3">
            {geoInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                <MapPin size={10} /> {geoInfo.city} · {areaCategory}
              </span>
            )}

            {/* ── AUTONOMOUS ORACLE ACTIVE badge (replaces DEMO MODE) ── */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AUTONOMOUS ORACLE ACTIVE
            </span>

            {/* Polling indicator */}
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {oracleLoading
                ? 'Checking oracle...'
                : `Oracle: 30s · ${breachCount > 0 ? `${breachCount} breach${breachCount > 1 ? 'es' : ''}` : 'Monitoring'}`
              }
            </span>
          </div>
        </div>

        <div className="px-10 py-10 w-full">

          {/* ── Page Title ──────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-10 text-white">
            <div className="w-14 h-14 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 shadow-sm flex items-center justify-center text-[#0F172A]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <h1 className="m-0 text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Active Claim Radar</h1>
              <span className="text-xs text-slate-500 font-semibold">Zero-Touch Pipeline · DETECTED → VALIDATING → APPROVED → DISBURSED → PAID</span>
            </div>
          </div>

          {/* ── Compliance Banner ──────────────────────────────── */}
          <div className="mb-6 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <ShieldCheck size={16} className="text-[#1A3C5E] shrink-0" />
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              COVERAGE: Loss of Income ONLY · PERSONA: Food Delivery · BILLING: Weekly · POP VALIDATOR: Active
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Radio size={12} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                {oracleState.dataSource === 'live' ? 'Live Data Feed' : 'Fallback Data'}
              </span>
            </div>
          </div>

          {/* ── Map + Oracle Cards ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full mb-12">
            {/* GIS Tactical Map */}
            <div className="lg:col-span-3">
              <TacticalMap activeClaim={activeClaim} userCoords={userCoords} />
            </div>

            {/* Oracle Monitor Cards — all live */}
            <div className="flex flex-col gap-6">
              {oracleCards.map((oracle, i) => (
                <motion.div
                  key={oracle.key}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-7 shadow-sm flex-1 flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[#0F172A]">{oracle.icon}</div>
                    <span className={`inline-block px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm border ${oracle.badge.cls}`}>
                      {oracle.badge.label}
                    </span>
                  </div>
                  <p className="m-0 text-lg font-bold text-[#1A1A1A]">{oracle.label}</p>
                  <p className="mt-2 mb-1 text-base font-semibold text-slate-800">{oracle.value}</p>
                  <p className="m-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">({oracle.threshold})</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Claim History ───────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="m-0 text-xl font-bold text-[#1A1A1A] tracking-tight">
              Claim History &amp; Payouts
            </h2>

            {/* Autonomous Oracle Active badge (replaces DEMO · STATE MACHINE ACTIVE) */}
            <AnimatePresence mode="wait">
              {breachCount > 0 ? (
                <motion.span
                  key="breach"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider bg-red-500/10 text-red-700 border border-red-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {breachCount} ACTIVE BREACH{breachCount > 1 ? 'ES' : ''} DETECTED
                </motion.span>
              ) : (
                <motion.span
                  key="monitoring"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AUTONOMOUS ORACLE ACTIVE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ── Claim Cards or Monitoring State ─────────────────── */}
          <AnimatePresence mode="wait">
            {allClaims.length === 0 ? (
              /* No breaches — clean monitoring state */
              <motion.div
                key="monitoring-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck size={28} className="text-emerald-600" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-[#1A1A1A]">System Monitoring — No Breaches Detected</h3>
                </div>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  All parametric thresholds are within safe limits. The Autonomous Oracle is monitoring live conditions every 30 seconds.
                </p>
                {oracleState.checkedAt && (
                  <p className="text-[11px] text-slate-400 mt-4 font-mono">
                    Last checked: {new Date(oracleState.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    {' · '}Source: {oracleState.dataSource}
                  </p>
                )}
                <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
                  {[
                    { icon: CloudRain, label: 'Rainfall', val: `${(liveWeather?.rain_mm ?? 0).toFixed(1)}mm`, thr: `<${RAIN_THRESHOLD}mm ✓` },
                    { icon: Sun,       label: 'Heat',     val: `${(liveWeather?.temperature_c ?? 30).toFixed(1)}°C`, thr: `<${TEMP_THRESHOLD}°C ✓` },
                    { icon: Wind,      label: 'AQI',      val: `${Math.round(liveWeather?.aqi ?? 0)}`, thr: `<${AQI_THRESHOLD} ✓` },
                  ].map(({ icon: Icon, label, val, thr }) => (
                    <div key={label} className="bg-white/20 rounded-xl p-3 border border-white/30 text-center">
                      <Icon size={14} className="text-slate-400 mx-auto mb-1" />
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="font-mono text-sm font-bold text-[#1A1A1A]">{val}</p>
                      <p className="text-[9px] text-emerald-600 font-bold mt-0.5">{thr}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Breach events — render state machine cards */
              <motion.div
                key="breach-cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {allClaims.map((claim, i) => (
                  <ClaimHistoryCard
                    key={claim.id || i}
                    claim={claim}
                    areaCategory={areaCategory}
                    isSelected={activeClaim?.id === claim.id}
                    onSelect={setActiveClaim}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back link */}
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F172A] transition-colors"
            >
              ← Back to Command Center
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
