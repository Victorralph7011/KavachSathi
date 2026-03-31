import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Radar, Cloud, Thermometer, Wind } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { calculateRiskScore, generateTerminalLines, getWeatherData } from '../../utils/riskEngine';
import { PLATFORMS } from '../../constants/platforms';
import TerminalLoader from '../TerminalLoader';

/**
 * Step 2 — Risk Validation
 * GPS → State detection → Weather oracle → AI Risk Engine → Safe Zone check
 */
export default function RiskValidationStep({ form }) {
  const { setValue, watch } = form;
  const selectedPlatform = watch('platform');
  const { coords, baseState, loading, error, usedFallback, requestLocation } = useGeolocation();

  const [phase, setPhase] = useState('idle');
  const [riskResult, setRiskResult] = useState(null);
  const [terminalLines, setTerminalLines] = useState([]);
  const [weatherData, setWeatherData] = useState(null);

  const handleAcquireLocation = useCallback(async () => {
    setPhase('locating');
    const result = await requestLocation();
    if (result) {
      setValue('latitude', result.latitude);
      setValue('longitude', result.longitude);
      setValue('baseState', result.state);
      
      // Get weather data for display
      const weather = getWeatherData(result.state);
      setWeatherData(weather);
      
      // Generate dynamic terminal lines
      const platformName = selectedPlatform ? PLATFORMS[selectedPlatform]?.name : 'Unknown';
      const lines = generateTerminalLines(result.state, platformName, {
        latitude: result.latitude,
        longitude: result.longitude,
      });
      setTerminalLines(lines);
      
      setPhase('calculating');
    }
  }, [requestLocation, setValue, selectedPlatform]);

  // Run risk engine after terminal animation
  useEffect(() => {
    if (phase !== 'calculating') return;

    const maxDelay = terminalLines.length > 0 
      ? terminalLines[terminalLines.length - 1].delay + 500
      : 4500;

    const timer = setTimeout(() => {
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
    }, maxDelay);

    return () => clearTimeout(timer);
  }, [phase, baseState, selectedPlatform, setValue, coords, terminalLines]);

  const handleTerminalComplete = () => {
    setPhase('complete');
  };

  return (
    <div className="step-risk">
      {/* Phase: Idle */}
      {phase === 'idle' && (
        <motion.div
          className="risk-idle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="risk-idle__radar">
            <motion.div className="radar-ring radar-ring--1"
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div className="radar-ring radar-ring--2"
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
            />
            <div className="radar-center"><Radar size={28} /></div>
          </div>

          <h3 className="risk-idle__title">Location Acquisition Required</h3>
          <p className="risk-idle__desc text-mono">
            GPS coordinates determine your base state, resolve hyper-local safe zones, and query the weather oracle for environmental risk factors.
          </p>

          <button type="button" className="risk-idle__btn" onClick={handleAcquireLocation}>
            <MapPin size={16} />
            <span>Acquire GPS Location</span>
          </button>

          <span className="text-mono risk-idle__privacy">
            Location is used for risk calculation only · Not stored permanently
          </span>
        </motion.div>
      )}

      {/* Phase: Locating */}
      {phase === 'locating' && (
        <motion.div className="risk-locating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="risk-locating__pulse">
            <motion.div className="locating-dot"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <span className="text-mono">ACQUIRING COORDINATES...</span>
          {error && <span className="text-mono" style={{ color: 'var(--amber)', fontSize: '0.7rem' }}>{error}</span>}
        </motion.div>
      )}

      {/* Phase: Calculating / Complete */}
      {(phase === 'calculating' || phase === 'complete') && (
        <motion.div className="risk-calculating"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Location + Weather banner */}
          <div className="risk-info-banner">
            <div className="risk-location-badge glass">
              <MapPin size={14} style={{ color: 'var(--neon)' }} />
              <span className="text-mono">{coords?.formatted}</span>
              <span className="risk-location-badge__sep">→</span>
              <span className="text-mono" style={{ color: 'var(--neon)' }}>{baseState}</span>
              {usedFallback && <span className="text-mono risk-location-badge__demo">DEMO</span>}
            </div>

            {weatherData && (
              <div className="weather-badge glass">
                <span className="weather-badge__icon">{weatherData.icon}</span>
                <div className="weather-badge__data">
                  <span className="text-mono"><Thermometer size={10} /> {weatherData.temp}°C</span>
                  <span className="text-mono"><Cloud size={10} /> {weatherData.rainfall}mm</span>
                  <span className="text-mono"><Wind size={10} /> AQI {weatherData.aqi}</span>
                </div>
              </div>
            )}
          </div>

          {/* Terminal loader */}
          <TerminalLoader
            lines={terminalLines}
            onComplete={handleTerminalComplete}
            riskResult={riskResult}
          />

          {/* Risk grade card */}
          {phase === 'complete' && riskResult && (
            <motion.div className="risk-grade-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className={`risk-grade-badge grade--${riskResult.grade}`}>
                <span className="risk-grade-badge__letter">{riskResult.grade}</span>
                <span className="risk-grade-badge__label text-mono">RISK GRADE</span>
              </div>

              <div className="risk-factors-grid">
                <div className="risk-factor">
                  <span className="risk-factor__label text-mono">Environmental (E)</span>
                  <div className="risk-factor__bar">
                    <motion.div className="risk-factor__fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${riskResult.factors.environmental * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                    />
                  </div>
                  <span className="risk-factor__value text-mono">{riskResult.factors.environmental.toFixed(2)}</span>
                </div>
                <div className="risk-factor">
                  <span className="risk-factor__label text-mono">Personal (P)</span>
                  <div className="risk-factor__bar">
                    <motion.div className="risk-factor__fill personal"
                      initial={{ width: 0 }}
                      animate={{ width: `${riskResult.factors.personal * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                  </div>
                  <span className="risk-factor__value text-mono">{riskResult.factors.personal.toFixed(2)}</span>
                </div>
                <div className="risk-factor">
                  <span className="risk-factor__label text-mono">Market (M)</span>
                  <div className="risk-factor__bar">
                    <motion.div className="risk-factor__fill market"
                      initial={{ width: 0 }}
                      animate={{ width: `${riskResult.factors.market * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                    />
                  </div>
                  <span className="risk-factor__value text-mono">{riskResult.factors.market.toFixed(2)}</span>
                </div>

                {/* Safe zone discount indicator */}
                {riskResult.safeZone?.isSafe && (
                  <motion.div className="safe-zone-badge"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    <span className="safe-zone-badge__icon">🛡️</span>
                    <div className="safe-zone-badge__text">
                      <span className="text-mono" style={{ color: 'var(--neon)', fontSize: '0.7rem' }}>SAFE ZONE DISCOUNT</span>
                      <span className="text-mono" style={{ fontSize: '0.65rem' }}>
                        {riskResult.safeZone.zoneName} — ₹{riskResult.safeZone.discount}/week off
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
