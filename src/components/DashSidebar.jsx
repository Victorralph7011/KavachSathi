import { motion } from 'framer-motion';
import { LayoutDashboard, Shield, Wallet, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashSidebar({ activeTab }) {
  const navigate = useNavigate();

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar__top">
        <div className="dash-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span className="text-display" style={{ fontSize: '2rem' }}>KS.</span>
        </div>

        <nav className="dash-nav">
          <button 
            className={`dash-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={20} />
            <div className="dash-nav-text">
              <span className="text-label" style={{ color: activeTab === 'dashboard' ? 'var(--neon)' : 'var(--white)' }}>Overview</span>
              <span className="text-mono" style={{ color: activeTab === 'dashboard' ? 'var(--neon)' : 'var(--white-dim)', fontSize: '10px' }}>Mission Control</span>
            </div>
            {activeTab === 'dashboard' && <div className="active-bar" />}
          </button>

          <button 
            className={`dash-nav-item ${activeTab === 'policy' ? 'active' : ''}`} 
            onClick={() => navigate('/policy')}
          >
            <Shield size={20} />
            <div className="dash-nav-text">
              <span className="text-label" style={{ color: activeTab === 'policy' ? 'var(--neon)' : 'var(--white)' }}>Policy</span>
              <span className="text-mono" style={{ color: activeTab === 'policy' ? 'var(--neon)' : 'var(--white-dim)', fontSize: '10px' }}>Configuration</span>
            </div>
            {activeTab === 'policy' && <div className="active-bar" />}
          </button>
          
          <button 
            className={`dash-nav-item ${activeTab === 'billing' ? 'active' : ''}`} 
            onClick={() => navigate('/billing')}
          >
            <Wallet size={20} />
            <div className="dash-nav-text">
              <span className="text-label" style={{ color: activeTab === 'billing' ? 'var(--neon)' : 'var(--white)' }}>Billing</span>
              <span className="text-mono" style={{ color: activeTab === 'billing' ? 'var(--neon)' : 'var(--white-dim)', fontSize: '10px' }}>Premium History</span>
            </div>
            {activeTab === 'billing' && <div className="active-bar" />}
          </button>
          
          <button 
            className={`dash-nav-item ${activeTab === 'claims' ? 'active' : ''}`} 
            onClick={() => navigate('/claims')}
          >
            <Activity size={20} />
            <div className="dash-nav-text">
              <span className="text-label" style={{ color: activeTab === 'claims' ? 'var(--neon)' : 'var(--white)' }}>Claim</span>
              <span className="text-mono" style={{ color: activeTab === 'claims' ? 'var(--neon)' : 'var(--white-dim)', fontSize: '10px' }}>Trigger History</span>
            </div>
            {activeTab === 'claims' && <div className="active-bar" />}
          </button>
        </nav>
      </div>

      <div className="dash-sidebar__bottom">
        <div className="cobrand-box glass">
          <span className="text-mono" style={{ fontSize: '10px', color: 'var(--white-muted)' }}>INTEGRATION PIPELINE</span>
          <div className="cobrand-logos">
            <span style={{ fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.05em', color: '#E23744', fontSize: '1.2rem' }}>zomato</span>
            <span style={{ color: 'var(--white-ghost)' }}>×</span>
            <span className="text-serif" style={{ fontSize: '1.2rem', fontWeight: 600 }}>KS</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
