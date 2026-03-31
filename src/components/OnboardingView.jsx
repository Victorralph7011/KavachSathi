import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export default function OnboardingView() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--obsidian)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--white)',
      padding: '2rem',
      position: 'relative'
    }}>
      <motion.div 
        className="onboarding-card glass-strong"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '3rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '1px solid var(--neon)',
          boxShadow: '0 0 40px rgba(57, 255, 20, 0.05)'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(57, 255, 20, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          color: 'var(--neon)',
          border: '1px solid rgba(57, 255, 20, 0.3)'
        }}>
          <Terminal size={32} />
        </div>
        
        <h2 className="text-display" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to the Mesh</h2>
        <p className="text-mono" style={{ color: 'var(--white-dim)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Identity verified.<br/>
          Inventory Empty.<br/>
          No active protection found.
        </p>
        
        <Link 
          to="/register" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            backgroundColor: 'rgba(57, 255, 20, 0.1)',
            border: '1px solid var(--neon)',
            color: 'var(--neon)',
            borderRadius: '100px',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            letterSpacing: '1px',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>INITIATE NEW SUBMISSION</span>
        </Link>
      </motion.div>
    </div>
  );
}
