import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Cloud, Thermometer, Wind, Server, Globe, Building2, Trees } from 'lucide-react';
import { Map, Marker } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { calculateRiskScore, generateTerminalLines, getWeatherData, getAreaCategory, getWardId } from '../../utils/riskEngine';
import { PLATFORMS } from '../../constants/platforms';
import { fetchPremiumQuote } from '../../../../services/api';
import TerminalLoader from '../TerminalLoader';

/**
 * Step 2 — Risk Validation
 * GPS → Reverse Geocode → State detection → Weather oracle → AI Risk Engine → Safe Zone check
 */
export default function RiskValidationStep({ form }) {
  const { setValue, watch } = form;
  const selectedPlatform = watch('platform');
  const { coords, baseState, loading, error, usedFallback, geoData, requestLocation } = useGeolocation();

  const [phase, setPhase] = useState('idle');
  const [riskResult, setRiskResult] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [backendQuote, setBackendQuote] = useState(null);
  const [backendLoading, setBackendLoading] = useState(false);

  const handleAcquireLocation = useCallback(async () => {
    setPhase('locating');
    const result = await requestLocation();
    if (result) {
      setValue('latitude', result.latitude);
      setValue('longitude', result.longitude);
      setValue('baseState', result.state);
      setValue('geoCity', result.city);
      setValue('geoAreaCategory', result.areaCategory);
      
      const weather = getWeatherData(result.state);
      setWeatherData(weather);
      
      const platformName = selectedPlatform ? PLATFORMS[selectedPlatform]?.name : 'Unknown';
      const lines = generateTerminalLines(result.state, platformName, {
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setTerminalLines(lines);
      
      setPhase('calculating');
    }
  }, [requestLocation, setValue, selectedPlatform]);

  useEffect(() => {
    if (phase !== 'calculating') return;

    const maxDelay = terminalLines.length > 0 
      ? terminalLines[terminalLines.length - 1].delay + 500
      : 4500;

    const timer = setTimeout(async () => {
      const platformModifier = selectedPlatform
        ? PLATFORMS[selectedPlatform]?.riskModifier ?? 0.85
        : 0.85;

      const result = calculateRiskScore(
        baseState,
        platformModifier,
        coords ? { latitude: coords.latitude, longitude: coords.longitude } : null
      );
      setRiskResult(result);

      setValue('riskScore', result.score);
      setValue('riskGrade', result.grade);
      setValue('riskFactors', result.factors);
      setValue('safeZone', result.safeZone);
      setValue('weather', result.weather);

      // ── BACKEND SYNC: Use reverse-geocoded area category when available ──
      const areaCategory = geoData?.areaCategory || getAreaCategory(baseState);
      const { wardId, city } = getWardId(baseState);
      setValue('areaCategory', areaCategory);
      setValue('wardId', wardId);
      setValue('backendCity', geoData?.city || city);

      setBackendLoading(true);
      try {
        const quoteRes = await fetchPremiumQuote(areaCategory, wardId, geoData?.city || city);
        if (quoteRes.success && quoteRes.data) {
          setBackendQuote(quoteRes.data);
          setValue('backendPremium', quoteRes.data.weekly_premium);
          setValue('backendFormula', quoteRes.data.formula_breakdown);
          console.log('[KAVACH] Backend premium:', quoteRes.data.weekly_premium, quoteRes.data.formula_breakdown);
        } else {
          console.warn('[KAVACH] Backend pricing unavailable — using local fallback');
        }
      } catch (e) {
        console.warn('[KAVACH] Backend unreachable — local mode');
      } finally {
        setBackendLoading(false);
      }
    }, maxDelay);

    return () => clearTimeout(timer);
  }, [phase, baseState, selectedPlatform, setValue, coords, terminalLines, geoData]);

  const handleTerminalComplete = () => {
    setPhase('complete');
  };

  const gradeStyles = {
    A: 'bg-[#EFF6FF] text-[#1A3C5E]',
    B: 'bg-[#DCFCE7] text-[#059669]',
    C: 'bg-[#FEF3C7] text-[#E85D04]',
  };

  const barColors = {
    environmental: 'bg-[#1A3C5E]',
    personal: 'bg-[#E85D04]',
    market: 'bg-[#0F7B6C]',
  };

  const resolvedAreaCategory = geoData?.areaCategory || (baseState ? getAreaCategory(baseState) : null);

  return (
    <div className="space-y-6">
      {/* Phase: Idle — GPS Acquisition */}
      {phase === 'idle' && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* GPS Pulse Animation */}
          <div className="w-56 h-56 mx-auto relative flex items-center justify-center bg-[#F0F9FF] rounded-full mb-8">
            <div className="absolute w-48 h-48 rounded-full border-2 border-[#0F7B6C]/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.7s' }} />
            <div className="absolute w-36 h-36 rounded-full border-2 border-[#0F7B6C]/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="absolute w-24 h-24 rounded-full border-2 border-[#1A3C5E]/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <MapPin size={48} className="text-[#1A3C5E] relative z-10" />
          </div>

          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Location Acquisition Required</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            GPS coordinates determine your base state, resolve hyper-local safe zones, and query the weather oracle for environmental risk factors.
          </p>

          <button
            type="button"
            onClick={handleAcquireLocation}
            className="mt-8 bg-[#FF6B00] hover:bg-[#D45900] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            📍 Acquire GPS Location
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Location is used for risk calculation only · Not stored permanently
          </p>
        </motion.div>
      )}

      {/* Phase: Locating */}
      {phase === 'locating' && (
        <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#1A3C5E] flex items-center justify-center">
            <motion.div
              className="w-3 h-3 rounded-full bg-white"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <span className="text-sm text-gray-500 font-medium">Acquiring coordinates & reverse geocoding...</span>
          {error && <span className="text-xs text-[#E85D04] block mt-2">{error}</span>}
        </motion.div>
      )}

      {/* Phase: Calculating / Complete */}
      {(phase === 'calculating' || phase === 'complete') && (
        <motion.div
          className="flex flex-col gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* GPS + Geo Info Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
              <MapPin size={16} className="text-[#1A3C5E] shrink-0" />
              <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#1A3C5E]">{coords?.formatted}</span>
              <span className="text-[#1A3C5E]/50 mx-1">→</span>
              <span className="font-bold text-sm text-[#1A3C5E]">{geoData?.city || baseState}</span>
              {usedFallback && (
                <span className="ml-auto bg-[#FF6B00]/10 text-[#FF6B00] rounded-full px-2 py-0.5 text-[10px] font-bold border border-[#FF6B00]/20">DEMO</span>
              )}
            </div>

            {/* URBAN / RURAL Badge */}
            {resolvedAreaCategory && (
              <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                {resolvedAreaCategory === 'URBAN' ? (
                  <Building2 size={16} className="text-[#1A3C5E]" />
                ) : (
                  <Trees size={16} className="text-[#0F7B6C]" />
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                    resolvedAreaCategory === 'URBAN' 
                      ? 'bg-[#1A3C5E]/10 text-[#1A3C5E] border border-[#1A3C5E]/20' 
                      : 'bg-[#0F7B6C]/10 text-[#0F7B6C] border border-[#0F7B6C]/20'
                  }`}>
                    {resolvedAreaCategory}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    L<sub>avg</sub> = ₹{resolvedAreaCategory === 'URBAN' ? '800' : '400'}/day
                  </span>
                </div>
                {geoData?.state && (
                  <span className="ml-auto text-[10px] font-semibold text-slate-400 tracking-wide">{geoData.state}</span>
                )}
              </div>
            )}
          </div>

          {/* Weather Strip */}
          {weatherData && (
            <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <span className="text-lg">{weatherData.icon}</span>
              <div className="flex items-center gap-3 text-sm text-[#1A3C5E] font-semibold">
                <span className="flex items-center gap-1"><Thermometer size={12} className="text-[#FF6B00]" /> {weatherData.temp}°C</span>
                <span className="flex items-center gap-1"><Cloud size={12} className="text-blue-500" /> {weatherData.rainfall}mm</span>
                <span className="flex items-center gap-1"><Wind size={12} className="text-gray-500" /> AQI {weatherData.aqi}</span>
              </div>
              <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weather Oracle</span>
            </div>
          )}

          {/* MapLibre Inset Map — Shows user's GPS */}
          {coords && (
            <motion.div
              className="w-full h-48 rounded-2xl overflow-hidden border border-white/30 shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Map
                initialViewState={{
                  longitude: coords.longitude,
                  latitude: coords.latitude,
                  zoom: 13,
                  pitch: 30,
                }}
                mapStyle="https://tiles.openfreemap.org/styles/positron"
                style={{ width: '100%', height: '100%' }}
                interactive={false}
              >
                <Marker longitude={coords.longitude} latitude={coords.latitude} anchor="center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-16 h-16 bg-[#FF6B00]/15 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute w-8 h-8 bg-[#FF6B00]/25 rounded-full animate-pulse" />
                    <div className="w-3 h-3 bg-[#FF6B00] rounded-full shadow-[0_0_12px_#FF6B00] z-10" />
                  </div>
                </Marker>
              </Map>
            </motion.div>
          )}

          {/* Terminal — deliberate dark design inset */}
          <div className="shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-[#0F172A]">
            <TerminalLoader
              lines={terminalLines}
              onComplete={handleTerminalComplete}
              riskResult={riskResult}
            />
          </div>

          {/* Risk Grade Card */}
          {phase === 'complete' && riskResult && (
            <motion.div
              className="backdrop-blur-xl bg-white/40 rounded-2xl border border-white/40 shadow-xl p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex gap-6 items-start">
                {/* Grade Badge */}
                <div className={`shadow-[0_0_15px_rgba(255,107,0,0.4)] w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${gradeStyles[riskResult.grade] || gradeStyles.C}`}>
                  <span className="text-4xl font-black leading-none">{riskResult.grade}</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">Risk Grade</span>
                </div>

                {/* Factor Bars */}
                <div className="flex-1 flex flex-col gap-4">
                  {[
                    { key: 'environmental', label: 'Environmental (E)', color: barColors.environmental },
                    { key: 'personal', label: 'Personal (P)', color: barColors.personal },
                    { key: 'market', label: 'Market (M)', color: barColors.market },
                  ].map((f) => (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#1A1A1A]">{f.label}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-sm text-[#1A3C5E]">
                          {riskResult.factors[f.key].toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <motion.div
                          className={`${f.color} rounded-full h-2`}
                          initial={{ width: 0 }}
                          animate={{ width: `${riskResult.factors[f.key] * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Safe zone discount */}
                  {riskResult.safeZone?.isSafe && (
                    <motion.div
                      className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-3 py-2 mt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      <span className="text-lg">🛡️</span>
                      <div>
                        <span className="text-xs font-semibold text-[#0F7B6C] block">Safe Zone Discount</span>
                        <span className="text-xs text-gray-500">{riskResult.safeZone.zoneName} — ₹{riskResult.safeZone.discount}/week off</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Geo-Fairness Classification */}
              {resolvedAreaCategory && (
                <div className="mt-5 pt-5 border-t border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe size={14} className="text-[#1A3C5E]" />
                    <span className="text-xs font-bold text-[#1A3C5E] uppercase tracking-widest">Geo-Fairness Classification</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Zone</span>
                      <span className={`font-bold text-sm ${resolvedAreaCategory === 'URBAN' ? 'text-[#1A3C5E]' : 'text-[#0F7B6C]'}`}>{resolvedAreaCategory}</span>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Income Drop</span>
                      <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E85D04]">
                        {resolvedAreaCategory === 'URBAN' ? '₹8K → ₹5K' : '₹4K → ₹1K'}
                      </span>
                    </div>
                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">L<sub>avg</sub></span>
                      <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#1A3C5E]">
                        ₹{resolvedAreaCategory === 'URBAN' ? '800' : '400'}/day
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Backend Actuarial Engine Response */}
              {backendLoading && (
                <div className="mt-5 pt-5 border-t border-white/20 flex items-center gap-3">
                  <motion.div
                    className="w-4 h-4 border-2 border-[#1A3C5E] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-xs font-medium text-[#1A3C5E]">Syncing with actuarial engine...</span>
                </div>
              )}

              {backendQuote && !backendLoading && (
                <motion.div
                  className="mt-5 pt-5 border-t border-white/20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Server size={14} className="text-[#1A3C5E]" />
                    <span className="text-xs font-bold text-[#1A3C5E] uppercase tracking-widest">Backend Actuarial Engine</span>
                    <span className="ml-auto bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-[10px] font-bold border border-emerald-200">LIVE</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'P(Trigger)', value: backendQuote.p_trigger?.toFixed(3) || '—' },
                      { label: 'L_avg', value: `₹${backendQuote.l_avg?.toFixed(0) || '—'}` },
                      { label: 'D_exposed', value: `${backendQuote.d_exposed?.toFixed(1) || '—'} days` },
                      { label: 'Risk ×', value: `${backendQuote.risk_multiplier?.toFixed(2) || '—'}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/30 backdrop-blur-sm rounded-lg p-2 text-center border border-white/30">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{label}</span>
                        <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#1A3C5E]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-[#0F172A] rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-emerald-400 truncate flex-1 mr-3">
                      {backendQuote.formula_breakdown}
                    </span>
                    <span className="font-['JetBrains_Mono',monospace] text-lg font-black text-white shrink-0">
                      ₹{backendQuote.weekly_premium}
                      <span className="text-xs text-gray-400 font-normal">/wk</span>
                    </span>
                  </div>
                  {backendQuote.cap_applied && (
                    <span className="text-[10px] text-amber-600 font-medium mt-1.5 block">⚠ Premium capped to ₹20–₹50 compliance bounds</span>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
