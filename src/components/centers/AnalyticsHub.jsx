import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashSidebar from '../DashSidebar';

export default function AnalyticsHub() {
  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="analytics" />

      <main className="relative z-10 flex-1 p-8 overflow-y-auto">
        <motion.div
           className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-8 max-w-5xl"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/40 border border-white/20 shadow-sm flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#1A3C5E]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Financial Intelligence</h1>
                <span className="mono-data text-sm font-semibold">LIVE ACTIVE NODE</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
               <span className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em] hidden sm:inline">Risk Engine Operational</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Total Protected Volume', value: '₹4,50,000', icon: DollarSign, trend: '+12.5%' },
              { label: 'Active Risk Nodes', value: '1,204', icon: Activity, trend: '+3.2%' },
              { label: 'Automated Payouts', value: '₹82,400', icon: TrendingUp, trend: '+5.8%' },
            ].map(({ label, value, icon: Icon, trend }) => (
              <div key={label} className="bg-white/40 border border-white/30 p-6 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/50 rounded-lg shadow-sm border border-white/40"><Icon size={20} className="text-[#0F7B6C]"/></div>
                  <span className="text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">{trend}</span>
                </div>
                <h2 className="text-3xl font-bold text-[#111] font-['Instrument_Serif']">{value}</h2>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Visual Data Placeholder area */}
          <div className="bg-white/30 border border-white/30 rounded-xl p-8 mb-6 h-64 flex flex-col items-center justify-center relative overflow-hidden">
             {/* Mock Chart Lines */}
             <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-10 h-32 opacity-20 pointer-events-none">
                {[40, 70, 45, 90, 60, 80, 50, 100].map((h, i) => (
                  <div key={i} className="w-12 bg-gradient-to-t from-[#0F7B6C] to-transparent rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
             </div>

             <BarChart3 className="w-10 h-10 text-[#FF6B00] mb-4 opacity-80" />
             <h3 className="text-lg font-bold text-[#1A1A1A]">Telemetry Streaming</h3>
             <p className="text-sm text-slate-500 max-w-sm text-center mt-2">Live graphical feeds are initializing. Environmental and platform metrics will visualize here momentarily.</p>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F172A] transition-colors"
          >
            ← Back to Command Center
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
