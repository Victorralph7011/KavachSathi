import { motion } from 'framer-motion';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import DashSidebar from '../DashSidebar';
import '../../pages/Dashboard.css';

export default function BillingLedger() {
  const { policy, payments, isLoading } = useCenterData();
  
  if (isLoading) return <div style={{ color: 'var(--neon)', textAlign: 'center', marginTop: '20vh' }}>SYSTEM_SYNC...</div>;
  if (!policy) return null;

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--obsidian)' }}>
      <DashSidebar activeTab="billing" />
      
      <main className="dash-main" style={{ padding: '2rem' }}>
      <motion.div 
        className="glass-strong"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--neon)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(57, 255, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-heading" style={{ margin: 0 }}>Premium Ledger</h1>
            <span className="text-mono" style={{ color: 'var(--white-dim)' }}>Policy: <span style={{ color: 'var(--neon)' }}>{policy.policyId}</span></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', borderBottom: '1px solid var(--white-ghost)' }} className="text-mono">
            <span style={{ color: 'var(--white-muted)' }}>PAYMENT_DATE</span>
            <span style={{ color: 'var(--white-muted)' }}>TRANSACTION_ID</span>
            <span style={{ color: 'var(--white-muted)' }}>AMOUNT</span>
            <span style={{ color: 'var(--white-muted)' }}>STATUS</span>
          </div>

          {!payments || payments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--white-dim)' }} className="text-mono">
              NO_BILLING_HISTORY_FOUND
            </div>
          ) : (
            payments.map((payment, i) => (
              <motion.div 
                key={payment.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '1rem', 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px'
                }}
                className="text-mono"
              >
                <span>{new Date(payment.createdAt).toLocaleDateString('en-IN')}</span>
                <span style={{ color: 'var(--white-dim)' }}>{payment.paymentId?.substring(0, 14)}...</span>
                <span className="text-serif" style={{ fontSize: '1.2rem', color: 'var(--neon)' }}>₹{payment.amount}</span>
                <span style={{
                  padding: '2px 8px',
                  background: 'rgba(57, 255, 20, 0.1)',
                  color: 'var(--neon)',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }}>SUCCESS</span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      </main>
    </div>
  );
}
