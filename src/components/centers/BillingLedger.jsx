import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCenterData } from '../../hooks/useCenterData';
import { usePolicy } from '../../contexts/PolicyContext';
import DashSidebar from '../DashSidebar';
import { fetchPlatformHealth } from '../../services/api';

// ─── Demo seed data (8 weeks) ────────────────────────────────
const DEMO_PAYMENTS = Array.from({ length: 8 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (i * 7));
  const isSurge = i === 3; // One surge event
  return {
    id: `DEMO-PMT-${String(8 - i).padStart(3, '0')}`,
    paymentId: `KS-BIL-${Date.now().toString(36).toUpperCase()}-${i}`,
    amount: isSurge ? 48 : (30 + Math.floor(Math.random() * 15)),
    status: isSurge ? 'DYNAMIC_SURGE' : 'PAID',
    createdAt: date.toISOString(),
  };
});

const PAGE_SIZE = 6;

function StatusBadge({ status }) {
  const isDynamicSurge = status === 'DYNAMIC_SURGE' || status === 'surge';
  return (
    <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase
      ${isDynamicSurge ? 'bg-amber-100/90 text-amber-700 border border-amber-200/50' : 'bg-emerald-100/90 text-emerald-700 border border-emerald-200/50'}
    `}>
      {isDynamicSurge ? 'Dynamic Surge' : 'Paid'}
    </span>
  );
}

export default function BillingLedger() {
  const { policy, payments, isLoading } = useCenterData();
  const policyCtx = usePolicy();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [backendHealth, setBackendHealth] = useState(null);

  // Fetch backend health for KPI enrichment
  const loadHealth = useCallback(async () => {
    const res = await fetchPlatformHealth();
    if (res.success && res.data) setBackendHealth(res.data?.platform_health || res.data);
  }, []);
  useEffect(() => { loadHealth(); }, [loadHealth]);

  // Use demo data when no real payments exist
  const effectivePayments = payments.length > 0 ? payments : DEMO_PAYMENTS;
  const isDemoMode = payments.length === 0;

  const totalPaid = useMemo(() => effectivePayments.reduce((sum, p) => sum + (p.amount || 0), 0), [effectivePayments]);
  const claimsPaid = useMemo(() => effectivePayments.filter(p => p.status === 'DYNAMIC_SURGE' || p.status === 'surge').reduce((sum, p) => sum + (p.amount || 0), 0), [effectivePayments]);
  const netBalance = totalPaid - claimsPaid;
  const lossRatio = backendHealth?.loss_ratio ? (backendHealth.loss_ratio * 100).toFixed(1) + '%' : null;

  const filtered = useMemo(() => {
    if (!search) return effectivePayments;
    const q = search.toLowerCase();
    return effectivePayments.filter(p =>
      new Date(p.createdAt).toLocaleDateString('en-IN').toLowerCase().includes(q) ||
      (p.paymentId || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  }, [effectivePayments, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>
        <div className="w-9 h-9 border-4 border-[#1A3C5E] border-t-transparent rounded-full animate-spin relative z-10" />
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
        <DashSidebar activeTab="billing" />
        <main className="relative z-10 flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-12 text-center max-w-md shadow-xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center mx-auto mb-5">
              <Shield size={28} className="text-[#FF6B00]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Activate Your Coverage</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Complete the registration wizard to activate your parametric policy. Your billing ledger will populate automatically with weekly premium records.
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

      <DashSidebar activeTab="billing" />

      <main className="relative z-10 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-10 py-5 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md border border-white/30 shadow-sm flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
              </svg>
            </div>
            <h1 className="m-0 text-2xl font-bold text-[#1A1A1A] tracking-tight">Billing Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-500'} shadow-[0_0_8px_${isDemoMode ? '#FBBF24' : '#10B981'}] animate-pulse`} />
            <span className={`text-sm font-semibold ${isDemoMode ? 'text-amber-600' : 'text-emerald-600'}`}>{isDemoMode ? 'Demo Mode' : 'Live Sync'}</span>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="px-10 py-8 flex gap-6">
          {[
            { icon: '🪙', label: 'Total Premiums Paid', value: `₹${totalPaid.toLocaleString('en-IN')}` },
            { icon: '🤝', label: 'Claims Paid Out', value: `₹${claimsPaid.toLocaleString('en-IN')}` },
            { icon: '⚖️', label: 'Net Balance', value: `₹${netBalance.toLocaleString('en-IN')}`, up: true },
          ].map(({ icon, label, value, up }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-6 flex items-center gap-5 shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
            >
              <span className="text-4xl">{icon}</span>
              <div>
                <p className="m-0 text-xs text-slate-500 font-bold tracking-wider uppercase">{label}</p>
                <p className="mt-1.5 text-3xl font-bold text-[#1A1A1A] tracking-tight">
                  {value} {up && <span className="text-xl text-emerald-500 font-normal ml-1">↑</span>}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Table Card */}
        <div className="px-10 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
          >
            <div className="px-7 py-5 border-b border-white/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="m-0 text-lg font-bold text-[#1A1A1A]">Premium History</h2>
                <div className="flex items-center gap-1.5 bg-white/30 border border-white/40 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] font-bold tracking-wide uppercase cursor-pointer">
                  Last 12 Weeks <span>▾</span>
                </div>
              </div>
              <div className="relative shrink-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F172A]/70" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder="Search"
                  className="pl-9 pr-4 py-2 border border-white/40 bg-white/30 backdrop-blur-md rounded-lg text-sm text-[#1A1A1A] font-medium outline-none w-64 placeholder-[#0F172A]/60 focus:ring-2 focus:ring-[#0F172A]/20 transition-all font-mono placeholder:font-sans"
                />
              </div>
            </div>

            <table className="w-full border-collapse text-sm table-fixed">
              <thead>
                <tr className="bg-white/10 backdrop-blur-sm border-b border-white/20">
                  {['Week', 'Status', 'Deduction'].map(col => (
                    <th key={col} className="text-left px-7 py-4 font-bold text-[#0F172A] text-xs uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-7 py-12 text-center text-slate-500 font-medium">
                      No billing history found.
                    </td>
                  </tr>
                ) : paginated.map((payment, i) => {
                  const isDynamic = payment.status === 'DYNAMIC_SURGE' || payment.status === 'surge';
                  const date = new Date(payment.createdAt);
                  const weekLabel = `Week of ${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
                  const amount = isDynamic
                    ? `₹${payment.amount?.toLocaleString('en-IN')}.00 (Surge Applied)`
                    : `₹${payment.amount?.toLocaleString('en-IN')}.00`;

                  return (
                    <motion.tr
                      key={payment.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/30 transition-colors"
                    >
                      <td className="px-7 py-5 text-slate-700 font-medium">{weekLabel}</td>
                      <td className="px-7 py-5"><StatusBadge status={payment.status} /></td>
                      <td className="px-7 py-5 text-[#1A1A1A] font-bold font-mono text-base">{amount}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-7 py-5 bg-white/5 border-t border-white/20 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`px-4 py-2 border border-white/40 rounded-lg bg-white/30 text-xs font-bold uppercase tracking-wider transition-all ${page === 0 ? 'opacity-50 cursor-not-allowed text-slate-400' : 'hover:bg-white/50 text-[#0F172A] cursor-pointer shadow-sm'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className={`px-4 py-2 border border-white/40 rounded-lg bg-white/30 text-xs font-bold uppercase tracking-wider transition-all ${page >= totalPages - 1 ? 'opacity-50 cursor-not-allowed text-slate-400' : 'hover:bg-white/50 text-[#0F172A] cursor-pointer shadow-sm'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 px-10 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#0F172A] font-bold text-sm tracking-wide">
            <div className="w-7 h-7 rounded bg-[#0F172A] flex items-center justify-center">
              <span className="text-white text-[10px] font-black">KS</span>
            </div>
            KavachSathi
          </div>
          <div className="flex gap-6">
            {['Support', 'FAQs', 'Terms of Service', 'Privacy Policy'].map(l => (
              <span key={l} className="text-xs font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer transition-colors uppercase tracking-wider">{l}</span>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
