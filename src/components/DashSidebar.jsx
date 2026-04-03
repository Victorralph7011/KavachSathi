import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, CreditCard, AlertCircle, BarChart3, Info } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Overview',  route: '/dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', route: '/analytics', icon: BarChart3 },
  { key: 'policy',    label: 'Policy',    route: '/policy',    icon: Shield },
  { key: 'billing',   label: 'Billing',   route: '/billing',   icon: CreditCard },
  { key: 'claims',    label: 'Claim',     route: '/claims',    icon: AlertCircle },
];

export default function DashSidebar({ activeTab }) {
  const navigate = useNavigate();

  return (
    <aside className="relative z-20 w-60 shrink-0 bg-white/10 backdrop-blur-lg border-r border-white/20 flex flex-col min-h-screen">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/20">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 w-full">
          <div className="w-8 h-8 rounded-lg bg-[#1A3C5E] flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs">KS</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-[#1A1A1A] leading-tight">KavachSathi</p>
            <p className="text-[10px] text-gray-400">Mission Control</p>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ key, label, route, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => navigate(route)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left relative overflow-hidden
                ${isActive
                  ? 'bg-white/20 text-[#0F172A] font-semibold shadow-[0_0_12px_rgba(255,107,0,0.15)] border-l-4 border-[#FF6B00]'
                  : 'text-slate-500 hover:text-[#0F172A] hover:bg-white/10 hover:shadow-[0_0_8px_rgba(255,107,0,0.1)]'
                }
              `}
            >
              <Icon size={20} className={`transition-all duration-300 ${isActive ? 'text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]' : 'text-[#0F172A] group-hover:text-[#FF6B00] group-hover:drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]'}`} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="px-3 pb-2 flex flex-col gap-0.5">
         <button
            onClick={() => navigate('/about')}
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left relative overflow-hidden
              ${activeTab === 'about'
                ? 'bg-white/20 text-[#0F172A] font-semibold shadow-[0_0_12px_rgba(255,107,0,0.15)] border-l-4 border-[#FF6B00]'
                : 'text-slate-500 hover:text-[#0F172A] hover:bg-white/10 hover:shadow-[0_0_8px_rgba(255,107,0,0.1)]'
              }
            `}
         >
            <Info size={20} className={`transition-all duration-300 ${activeTab === 'about' ? 'text-[#FF6B00] drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]' : 'text-[#0F172A] group-hover:text-[#FF6B00] group-hover:drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]'}`} />
            About
         </button>
      </div>

      {/* Zomato x KS */}
      <div className="mx-3 mb-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center">
        <div className="w-10 h-10 rounded-lg bg-[#E23744] flex items-center justify-center mx-auto mb-2">
          <span className="text-white font-black italic text-sm">z</span>
        </div>
        <p className="text-xs font-bold text-[#1A1A1A] leading-snug">Zomato × KS<br />Integration</p>
        <button className="btn-ghost text-xs py-1.5 px-3 mt-2 w-full">Manage Config</button>
      </div>
    </aside>
  );
}
