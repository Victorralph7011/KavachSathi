import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun, Wind, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Shield, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import { usePolicy } from '../../contexts/PolicyContext';
import DashSidebar from '../DashSidebar';
import TacticalMap from '../claims/TacticalMap';
import ClaimHistoryCard from '../claims/ClaimHistoryCard';
import { fetchClaims } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { reverseGeocode } from '../../utils/reverseGeocode';

function getOracleCards(cityName) {
  return [
    {
      key: 'rain',
      label: 'Rainfall',
      icon: <CloudRain size={28} />,
      value: `${cityName}: 45mm / 24h`,
      threshold: 'Threshold: 60mm',
    },
    {
      key: 'heat',
      label: 'Heat Wave',
      icon: <Sun size={28} />,
      value: `${cityName}: 42°C`,
      threshold: 'Threshold: 45°C',
    },
    {
      key: 'aqi',
      label: 'AQI Alert',
      icon: <Wind size={28} />,
      value: `${cityName}: 180 AQI`,
      threshold: 'Threshold: 300 AQI',
    },
  ];
}

// ─── Demo Claims (seeded when backend is unreachable) ────────
function generateDemoClaims() {
  const now = new Date();
  return [
    {
      id: `DEMO-CLM-RAIN-001`,
      claim_id: `DEMO-CLM-RAIN-001`,
      event: 'RAINFALL_BREACH',
      trigger_type: 'RAINFALL',
      status: 'DETECTED',
      state: 'DETECTED',
      value: 65,
      trigger_value: 65,
      payoutAmount: 0,
      payout_amount: 0,
      reason: 'Sensor detected 65mm rain in 1hr — exceeds 60mm parametric threshold.',
      createdAt: now.toISOString(),
      created_at: now.toISOString(),
      source: 'demo',
    },
    {
      id: `DEMO-CLM-AQI-002`,
      claim_id: `DEMO-CLM-AQI-002`,
      event: 'AQI_BREACH',
      trigger_type: 'AQI',
      status: 'DETECTED',
      state: 'DETECTED',
      value: 337,
      trigger_value: 337,
      payoutAmount: 0,
      payout_amount: 0,
      reason: 'CPCB Oracle reported AQI 337 — exceeds 300 threshold for 4+ hours.',
      createdAt: new Date(now - 5 * 60000).toISOString(),
      created_at: new Date(now - 5 * 60000).toISOString(),
      source: 'demo',
    },
  ];
}

// ─── Main Component ──────────────────────────────────────────
export default function ClaimTriggerLog() {
  const { policy, triggers, isLoading } = useCenterData();
  const policyCtx = usePolicy();

  // Live GPS acquisition — replaces policy-stored coords
  const geo = useGeolocation();
  const [geoInfo, setGeoInfo] = useState(null);

  useEffect(() => {
    if (!geo.isLoading && geo.latitude && geo.longitude) {
      reverseGeocode(geo.latitude, geo.longitude).then(info => {
        setGeoInfo(info);
      });
    }
  }, [geo.isLoading, geo.latitude, geo.longitude]);

  const areaCategory = geoInfo?.areaCategory || policyCtx?.areaCategory || 'URBAN';
  const cityName = geoInfo?.city || 'India';
  const riskGrade = policyCtx?.activePolicy?.riskGrade || 'B';

  const userCoords = {
    latitude: geo.latitude,
    longitude: geo.longitude,
    areaCategory,
    riskGrade,
  };

  const oracleCards = getOracleCards(cityName);

  const [activeClaim, setActiveClaim] = useState(null);
  const [backendClaims, setBackendClaims] = useState([]);
  const [demoMode, setDemoMode] = useState(false);

  // ─── Backend Claims Polling (5s) ───────────────────────────
  const loadClaims = useCallback(async () => {
    const res = await fetchClaims();
    if (res.success && res.data) {
      const claims = Array.isArray(res.data) ? res.data : (res.data.claims || []);
      if (claims.length > 0) {
        setBackendClaims(claims);
        setDemoMode(false);
      } else {
        setDemoMode(true);
      }
    } else {
      setDemoMode(true);
    }
  }, []);

  useEffect(() => {
    loadClaims();
    const interval = setInterval(loadClaims, 5000);
    return () => clearInterval(interval);
  }, [loadClaims]);

  // Merge: backend claims + Firestore triggers + demo claims
  const allClaims = [
    ...backendClaims.map(c => ({
      id: c.claim_id || c.id,
      event: c.trigger_type || c.event || 'Parametric Event',
      trigger_type: c.trigger_type,
      status: c.state || c.status || 'DETECTED',
      payoutAmount: c.payout_amount || c.payoutAmount || 0,
      value: c.value || c.trigger_value || 0,
      trigger_value: c.value || c.trigger_value || 0,
      reason: c.reason || c.description || null,
      createdAt: c.created_at || c.createdAt || new Date().toISOString(),
      source: 'backend',
      evidence: c.fraud_evidence || c.evidence || null,
      max_velocity_kmh: c.max_velocity_kmh || null,
      paymentId: c.payment_id || null,
      txn_id: c.txn_id || null,
    })),
    ...(triggers || []).map(t => ({
      ...t,
      source: 'firestore',
    })),
    ...(demoMode && backendClaims.length === 0 ? generateDemoClaims() : []),
  ].filter(c => c.event !== 'SYSTEM_ARMED' && c.status !== 'MONITORING');

  // Auto-focus logic
  useEffect(() => {
    if (allClaims.length > 0 && !activeClaim) {
      setActiveClaim(allClaims[0]);
    }
  }, [allClaims.length]);

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

  // No-policy CTA instead of blank screen
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
          <div className="ml-auto flex items-center gap-3">
            {geoInfo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                <MapPin size={10} /> {geoInfo.city} · {areaCategory}
              </span>
            )}
            {demoMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                DEMO MODE
              </span>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Polling: 5s · {backendClaims.length > 0 ? `${backendClaims.length} pipeline` : demoMode ? '2 demo' : '0'} claims
            </span>
          </div>
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
            <div>
              <h1 className="m-0 text-3xl font-extrabold text-[#1A1A1A] tracking-tight">Active Claim Radar</h1>
              <span className="text-xs text-slate-500 font-semibold">Zero-Touch Pipeline · DETECTED → VALIDATING → APPROVED → DISBURSED → PAID</span>
            </div>
          </div>

          {/* Compliance Banner */}
          <div className="mb-6 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <ShieldCheck size={16} className="text-[#1A3C5E] shrink-0" />
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              COVERAGE: Loss of Income ONLY · PERSONA: Food Delivery · BILLING: Weekly (₹20–₹50) · POP VALIDATOR: Active
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full mb-12">
            {/* GIS TACTICAL MAP CONTAINER (cols-3) */}
            <div className="lg:col-span-3">
               <TacticalMap activeClaim={activeClaim} userCoords={userCoords} />
            </div>

            {/* Oracle Monitor Cards Flanking */}
            <div className="flex flex-col gap-6">
              {oracleCards.map((oracle, i) => (
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
                  <p className="mt-2 mb-1 text-base font-semibold text-slate-800">{oracle.value}</p>
                  <p className="m-0 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">({oracle.threshold})</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Claim History & Payouts — Now using ClaimHistoryCard State Machine */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="m-0 text-xl font-bold text-[#1A1A1A] tracking-tight">
              Claim History & Payouts
            </h2>
            <div className="flex items-center gap-3">
              {backendClaims.length > 0 && (
                <span className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1 text-[10px] font-bold text-[#1A3C5E] uppercase tracking-wider">
                  {backendClaims.length} Pipeline Claims
                </span>
              )}
              {demoMode && (
                <span className="bg-amber-100/80 border border-amber-200/50 rounded-full px-3 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  DEMO · State Machine Active
                </span>
              )}
            </div>
          </div>

          {allClaims.length === 0 ? (
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center text-slate-500 font-semibold shadow-sm">
              No active claims or triggers found. Use the Analytics Hub trigger simulation to generate claims.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allClaims.map((claim, i) => (
                <ClaimHistoryCard
                  key={claim.id || i}
                  claim={claim}
                  areaCategory={areaCategory}
                  isSelected={activeClaim?.id === claim.id}
                  onSelect={setActiveClaim}
                />
              ))}
            </div>
          )}

          {/* Back to Command Center */}
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
