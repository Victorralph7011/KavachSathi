import { motion } from 'framer-motion';
import { Shield, Wallet, Activity, ArrowRight, CloudRain, ShieldAlert, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashSidebar from './DashSidebar';
import '../pages/Dashboard.css';
import { downloadPolicyCertificate } from '../utils/generateCertificate';

export default function CommandCenterView({ policy }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      
      <DashSidebar activeTab="dashboard" />

      {/* MAIN VIEW */}
      <main className="dash-main">
        
        {/* Header Area */}
        <header className="dash-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="dash-header__title">
              <span className="text-mono" style={{ color: 'var(--neon)', fontSize: '12px' }}>LIVE NODE TERMINAL</span>
              <h1 className="text-heading" style={{ fontSize: '2.5rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                KAVACHSATHA <span style={{ color: 'var(--white-muted)' }}>/</span> MAH-ZONE-04
              </h1>
            </div>
            <button
              onClick={() => downloadPolicyCertificate(policy)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', 
                background: 'rgba(57, 255, 20, 0.1)', border: '1px solid var(--neon)', color: 'var(--neon)', 
                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', width: 'fit-content'
              }}
            >
              <Download size={14} /> <span>DL_DIGITAL_PROOF</span>
            </button>
          </div>
          
          <div className="dash-ticker glass">
            <div className="ticker-track">
              {/* Ticker items */}
              <div className="ticker-item text-mono">
                <span style={{ color: 'var(--white-dim)' }}>LOC: MUMBAI, MH</span>
                <span style={{ color: 'var(--neon)' }}>[HEAVY RAIN WARNING]</span>
                <span>DENSITY_PROXY: 0.89</span>
              </div>
              <div className="ticker-divider" />
              <div className="ticker-item text-mono">
                <span style={{ color: 'var(--white-dim)' }}>LOC: DELHI, NCR</span>
                <span style={{ color: '#FFB000' }}>[AQI HAZARD]</span>
                <span>DENSITY_PROXY: 0.72</span>
              </div>
              <div className="ticker-divider" />
              <div className="ticker-item text-mono">
                <span style={{ color: 'var(--white-dim)' }}>LOC: BENGALURU, KA</span>
                <span style={{ color: 'var(--neon)' }}>[CLEAR]</span>
                <span>DENSITY_PROXY: 0.65</span>
              </div>
            </div>
          </div>
        </header>

        {/* Center Stage Layout */}
        <div className="dash-stage">

          {/* BACKGROUND CONNECTIONS (Visual Polish) */}
          <div className="dash-connections">
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <path d="M 400 50 C 600 50, 600 350, 800 350" stroke="var(--white-ghost)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
              <path d="M 400 350 C 600 350, 600 50, 800 50" stroke="var(--neon)" strokeWidth="1" fill="none" opacity="0.3" />
              <circle cx="400" cy="50" r="4" fill="var(--white-muted)" />
              <circle cx="800" cy="350" r="4" fill="var(--neon)" />
            </svg>
          </div>

          <div className="dash-stage__grid">
            
            {/* Left Col: Billing History Table */}
            <div className="dash-panel glass-strong">
              <div className="panel-header">
                <span className="text-label" style={{ color: 'var(--white)' }}>Premium History</span>
                <span className="text-mono" style={{ color: 'var(--neon)' }}>LIVE_SYNC</span>
              </div>
              
              <div className="billing-table">
                <div className="billing-row header-row text-mono">
                  <span>WEEK</span>
                  <span>STATUS</span>
                  <span style={{ textAlign: 'right' }}>DEDUCTION</span>
                </div>
                
                <div className="billing-row data-row glass">
                  <span className="text-mono" style={{ color: 'var(--white-dim)' }}>Wk 32 (Aug 01)</span>
                  <span className="status-badge success">PAID</span>
                  <span className="text-serif" style={{ textAlign: 'right', fontSize: '1.2rem' }}>₹40</span>
                </div>
                <div className="billing-row data-row glass">
                  <span className="text-mono" style={{ color: 'var(--white-dim)' }}>Wk 33 (Aug 08)</span>
                  <span className="status-badge success">PAID</span>
                  <span className="text-serif" style={{ textAlign: 'right', fontSize: '1.2rem' }}>₹40</span>
                </div>
                <div className="billing-row data-row glass active-row">
                  <span className="text-mono" style={{ color: 'var(--neon)' }}>Wk 34 (Aug 15)</span>
                  <span className="status-badge pending">DYNAMIC_SURGE</span>
                  <span className="text-serif" style={{ textAlign: 'right', fontSize: '1.2rem', color: 'var(--neon)' }}>₹60</span>
                </div>
              </div>
            </div>

            {/* Right Col: Claim History Log */}
            <div className="dash-panel glass-strong">
              <div className="panel-header">
                <span className="text-label" style={{ color: 'var(--white)' }}>Parametric Trigger Log</span>
                <span className="status-dot-pulse" />
              </div>
              
              <div className="claim-log">
                
                <div className="log-entry">
                  <div className="log-entry__icon" style={{ borderColor: 'var(--white-muted)', color: 'var(--white-muted)' }}>
                    <ShieldAlert size={14} />
                  </div>
                  <div className="log-entry__content">
                    <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '10px' }}>AUG 02 / 14:00 IST</span>
                    <p className="text-mono" style={{ fontSize: '11px', lineHeight: 1.4 }}>
                      <span style={{ color: 'var(--white-dim)' }}>TRIGGER:</span> AQI &gt; 300 | <span style={{ color: 'var(--white-dim)' }}>LOC:</span> DELHI, NCR<br/>
                      <span style={{ color: 'var(--white-dim)' }}>STATUS:</span> THRESHOLD_WARNING
                    </p>
                  </div>
                </div>

                <div className="log-line-connector" />

                <motion.div 
                  className="log-entry glass payout-active"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="log-entry__icon" style={{ borderColor: 'var(--neon)', color: 'var(--neon)', background: 'rgba(118, 185, 0, 0.1)' }}>
                    <CloudRain size={14} />
                  </div>
                  <div className="log-entry__content">
                    <span className="text-mono" style={{ color: 'var(--neon)', fontSize: '10px' }}>AUG 15 / 18:45 IST</span>
                    <p className="text-mono" style={{ fontSize: '11px', lineHeight: 1.4, color: 'var(--white)' }}>
                      <span style={{ color: 'var(--neon)' }}>TRIGGER:</span> RAIN &gt; 60mm | <span style={{ color: 'var(--neon)' }}>LOC:</span> MUMBAI<br/>
                      <span style={{ color: 'var(--neon)' }}>STATUS:</span> PAYOUT DISPATCHED <span className="text-serif" style={{ fontSize: '1.2rem', marginLeft: '4px' }}>₹250</span>
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Overlays */}
      <div className="decision-engine-panel glass">
        <div className="panel-header" style={{ marginBottom: '24px' }}>
          <span className="text-label" style={{ color: 'var(--neon)' }}>AI Decision Engine</span>
        </div>
        
        <div className="engine-grid">
          {/* Gauge */}
          <div className="gauge-container">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--white-ghost)" strokeWidth="6" />
              <motion.circle 
                cx="60" cy="60" r="50" 
                fill="none" 
                stroke="var(--neon)" 
                strokeWidth="6"
                strokeDasharray="314"
                strokeDashoffset="314"
                animate={{ strokeDashoffset: 314 * (1 - 0.82) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 1 }}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="gauge-value">
              <span className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>82<span style={{ fontSize: '1rem' }}>%</span></span>
              <span className="text-mono" style={{ fontSize: '10px', color: 'var(--neon)', marginTop: '4px' }}>HIGH PAYOUT</span>
            </div>
          </div>

          {/* Formula */}
          <div className="formula-box">
             <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '10px', display: 'block', marginBottom: '8px' }}>REAL-TIME CALCULATION</span>
             <p className="text-mono" style={{ fontSize: '12px', lineHeight: 1.6 }}>
                Risk Score = <br/>
                (Env <span style={{ color: 'var(--neon)' }}>× 0.4</span>) + <br/>
                (Platform <span style={{ color: 'var(--neon)' }}>× 0.4</span>) + <br/>
                (Mobility <span style={{ color: 'var(--neon)' }}>× 0.2</span>)
             </p>
          </div>
        </div>
      </div>

    </div>
  );
}
