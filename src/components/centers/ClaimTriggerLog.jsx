import { motion } from 'framer-motion';
import { ArrowLeft, CloudRain, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import DashSidebar from '../DashSidebar';
import '../../pages/Dashboard.css';

export default function ClaimTriggerLog() {
  const { policy, triggers, isLoading } = useCenterData();
  
  if (isLoading) return <div style={{ color: 'var(--neon)', textAlign: 'center', marginTop: '20vh' }}>SYSTEM_SYNC...</div>;
  if (!policy) return null;

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
      <DashSidebar activeTab="claims" />
      
      <main className="dash-main" style={{ padding: '2rem' }}>
      <motion.div 
        className="glass-strong"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--neon)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Radar Animation */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', pointerEvents: 'none' }}>
          <motion.div
            animate={{ scale: [1, 2, 2.5], opacity: [0.3, 0.1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--neon)' }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', top: '50%', left: '50%', width: '150px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--neon))', transformOrigin: '0 0' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon)' }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-heading" style={{ margin: 0 }}>Active Claim Radar</h1>
            <span className="text-mono" style={{ color: 'var(--white-dim)' }}>Risk Monitoring: <span style={{ color: 'var(--neon)' }}>ARMED & ACTIVE</span></span>
          </div>
        </div>

        {/* Armed Parametric Oracles Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem', position: 'relative', zIndex: 10 }}>
          {[
            { id: '1', title: 'Heavy Rain', threshold: '> 60mm', icon: <CloudRain size={20} /> },
            { id: '2', title: 'Extreme Heat', threshold: '> 45°C', icon: <Activity size={20} /> },
            { id: '3', title: 'AQI Hazard', threshold: '> 300 AQI', icon: <Activity size={20} /> },
          ].map((oracle) => (
            <div key={oracle.id} style={{ padding: '1.25rem', border: '1px solid rgba(57, 255, 20, 0.3)', borderRadius: '12px', background: 'rgba(10, 10, 10, 0.8)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--neon)' }}>
                {oracle.icon}
                <span className="text-mono" style={{ fontSize: '0.7rem', border: '1px solid var(--neon)', padding: '2px 8px', borderRadius: '4px' }}>ARMED</span>
              </div>
              <span className="text-label" style={{ color: 'var(--white)' }}>{oracle.title}</span>
              <span className="text-mono" style={{ color: 'var(--white-muted)', fontSize: '0.8rem' }}>TRIGGERS: <strong style={{color: 'var(--white)'}}>{oracle.threshold}</strong></span>
            </div>
          ))}
        </div>

        <h3 className="text-label" style={{ color: 'var(--neon)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(57,255,20,0.2)', position: 'relative', zIndex: 10 }}>Claim History & Payouts</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 10 }}>
          {!triggers || triggers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--white-dim)' }} className="text-mono">
              NO_ACTIVE_CLAIMS_OR_TRIGGERS
            </div>
          ) : (
            triggers.map((trigger, i) => (
              <motion.div 
                key={trigger.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '1.5rem', 
                  background: 'rgba(57, 255, 20, 0.05)',
                  border: '1px solid var(--neon)',
                  borderRadius: '12px',
                  boxShadow: '0 0 20px rgba(57, 255, 20, 0.1)'
                }}
                className="text-mono"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--neon)', fontWeight: 'bold' }}>{trigger.event || 'WEATHER_EVENT_DETECTED'}</span>
                  <span>{new Date(trigger.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div style={{ color: 'var(--white)' }}>
                  REASON: <span style={{ color: 'var(--white-dim)' }}>{trigger.reason}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <span style={{ color: '#FFB000' }}>{trigger.status === 'RESOLVED' ? 'PAYOUT_DISPATCHED' : 'EVALUATING'}</span>
                  <span className="text-serif" style={{ fontSize: '1.4rem', color: 'var(--neon)' }}>₹{trigger.payoutAmount || 0}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      </main>
    </div>
  );
}
