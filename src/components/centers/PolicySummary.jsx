import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import DashSidebar from '../DashSidebar';
import { downloadPolicyCertificate } from '../../utils/generateCertificate';
import '../../pages/Dashboard.css';

export default function PolicySummary() {
  const { policy, isLoading } = useCenterData();
  
  if (isLoading) return <div style={{ color: 'var(--neon)', textAlign: 'center', marginTop: '20vh' }}>SYSTEM_SYNC...</div>;
  if (!policy) return null;

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
      <DashSidebar activeTab="policy" />
      
      <main className="dash-main" style={{ padding: '2rem' }}>
        <motion.div 
          className="glass-strong"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--neon)' }}
        >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon)' }}>
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-heading" style={{ margin: 0 }}>Policy Document</h1>
              <span className="text-mono" style={{ color: 'var(--neon)' }}>{policy.policyId}</span>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => downloadPolicyCertificate(policy)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'transparent', border: '1px solid var(--neon)', color: 'var(--neon)', 
              padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)' 
            }}
          >
            <Download size={16} /> <span>EXPORT_PDF</span>
          </motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div>
            <span className="text-mono" style={{ color: 'var(--white-dim)', fontSize: '0.8rem' }}>INSURED_NAME</span>
            <p className="text-serif" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{policy.insuredName}</p>
          </div>
          <div>
            <span className="text-mono" style={{ color: 'var(--white-dim)', fontSize: '0.8rem' }}>PLATFORM</span>
            <p className="text-serif" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{policy.platform}</p>
          </div>
          <div>
            <span className="text-mono" style={{ color: 'var(--white-dim)', fontSize: '0.8rem' }}>RISK_GRADE</span>
            <p className="text-serif" style={{ fontSize: '1.2rem', marginTop: '0.5rem', color: policy.riskGrade === 'A' ? 'var(--neon)' : '#FFB000' }}>{policy.riskGrade || 'A'}</p>
          </div>
          <div>
            <span className="text-mono" style={{ color: 'var(--white-dim)', fontSize: '0.8rem' }}>BASE_STATE</span>
            <p className="text-serif" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{policy.baseState?.name || 'Unknown'}</p>
          </div>
        </div>
      </motion.div>
      </main>
    </div>
  );
}
