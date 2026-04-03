import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CreditCard, Zap, ChevronRight, Menu, X, CheckCircle, Info, HelpCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ═══════════════════════════════════════════════════
   KavachSathi Landing Page
   Sections: Navbar → Hero → Data Strip → Pillars → Certainty → Footer
   ═══════════════════════════════════════════════════ */

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const navLinks = [
    { label: 'How it works', to: '/how-it-works', icon: HelpCircle, isPublic: true },
    { label: 'Policy', to: '/policy', isPublic: false },
    { label: 'Billing', to: '/billing', isPublic: false },
    { label: 'Claim', to: '/claims', isPublic: false },
    { label: 'Analytics', to: '/analytics', icon: BarChart3, isPublic: false },
    { label: 'About', to: '/about', icon: Info, isPublic: true },
  ];

  const handleLinkClick = (e, link) => {
    if (!link.isPublic && !currentUser) {
      e.preventDefault();
      setToastMsg('Authentication required to access the Mission Control.');
      setTimeout(() => {
        setToastMsg('');
        navigate('/login', { state: { from: link.to } });
      }, 1500);
    }
  };

  return (
    <nav className="absolute top-0 inset-x-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/50 backdrop-blur-lg flex items-center justify-center border border-gray-200">
            <span className="text-[#1F2937] font-black text-sm tracking-tight">KS</span>
          </div>
          <span className="text-lg font-semibold text-[#1F2937] tracking-widest hidden sm:inline uppercase">KavachSathi</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map(l => (
            <Link key={l.label} to={l.to} onClick={(e) => handleLinkClick(e, l)} className="group flex items-center gap-1.5 text-sm font-medium text-[#1F2937] hover:text-[#FF6B00] transition-colors tracking-wide">
              {l.icon && <l.icon className="w-5 h-5 text-gray-500 group-hover:text-[#FF6B00] transition-colors" />}
              <span>{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-5">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-10 px-4 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-lg border border-gray-200 text-[#1F2937] text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-[#1F2937] text-white flex items-center justify-center text-[10px]">
                  {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span>{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-14 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 w-64 z-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Authenticated Operative</p>
                  <p className="font-bold text-base text-white">{currentUser.displayName || 'Unassigned'}</p>
                  <p className="font-mono text-xs text-gray-400 truncate mt-1">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold tracking-wider">CLEARANCE ACTIVE</span>
                  </div>
                  <button
                    onClick={() => { logout(); setShowDropdown(false); }}
                    className="mt-4 w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#1F2937] hover:text-[#FF6B00] transition-colors">Log In</Link>
              <Link to="/register" className="bg-[#FF6B00] hover:bg-[#e66000] text-[#FFFFFF] px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-1.5 shadow-lg">
                Get Covered <ChevronRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-[#1F2937]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 px-6 py-6 flex flex-col gap-4 absolute w-full inset-x-0 shadow-lg">
          {navLinks.map(l => (
            <Link key={l.label} to={l.to} className="flex items-center gap-2 text-base font-medium text-[#1F2937] py-2" onClick={(e) => { handleLinkClick(e, l); setMobileOpen(false); }}>
              {l.icon && <l.icon className="w-5 h-5 text-[#1F2937]" />}
              <span>{l.label}</span>
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link to="/login" className="text-sm font-medium text-[#1F2937] text-center py-2">Log In</Link>
            <Link to="/register" className="bg-[#FF6B00] text-[#FFFFFF] py-3 rounded-xl font-bold text-center">Get Covered</Link>
          </div>
        </div>
      )}

      {/* Glassmorphism Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3"
          >
            <Shield className="w-4 h-4 text-[#FF6B00]" />
            <span className="text-sm font-semibold tracking-wide text-white">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative h-screen bg-[#FAFAF8] overflow-hidden flex items-center pt-20">
      {/* Cinematic Local Video Background */}
      <motion.video
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10" />

      {/* Seamless transition to bottom section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FAFAF8] to-transparent pointer-events-none z-10" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-8 flex flex-col items-start pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col max-w-3xl"
        >
          {/* Overlapping Typography */}
          <div className="flex flex-col">
            <h1 className="text-8xl font-light text-[#4B5563]">
              Kavach
            </h1>
            <h1 className="text-8xl font-extrabold text-[#111827] mt-[-20px] drop-shadow-sm">
              Sathi.
            </h1>
          </div>

          <p className="text-lg md:text-xl text-[#374151] font-medium max-w-xl pr-4 mt-8 leading-relaxed">
            Protection that triggers when you need it most. No claims. Just coverage.
          </p>

          <div className="flex gap-4 flex-wrap mt-10">
            <Link to="/register" style={{ color: 'white' }} className="bg-[#111827] hover:bg-black !text-white px-8 py-4 rounded-full font-bold text-sm md:text-base transition-transform hover:scale-105 flex items-center gap-2 shadow-lg">
              Initialize Coverage <ChevronRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Floating Live Data Strip */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-0 inset-x-0 border-t border-gray-200 bg-white/70 backdrop-blur-md z-20"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="text-xs font-bold text-[#111827] uppercase tracking-[0.2em]">Risk Engine Live</span>
          </div>
          <span className="font-mono text-xl sm:text-2xl text-[#0F7B6C] font-bold tracking-tight">
            $$R = 0.4E + 0.4P + 0.2M$$
          </span>
          <span className="hidden md:inline-flex text-xs font-semibold text-slate-500 tracking-wider">
            ENVIRONMENTAL · PLATFORM · MOBILITY
          </span>
        </div>
      </motion.div>
    </section>
  );
}

function PillarsSection() {
  const navigate = useNavigate();

  const pillars = [
    {
      num: '01',
      center: 'POLICY CENTER',
      flow: 'SUBMISSION → ISSUANCE',
      title: 'Policy',
      body: 'Parametric protection. Zero paperwork. Instant coverage. Define triggers, connect data sources, and get your policy active in minutes.',
      footer: 'MESH-SHIELD PROTECTION NETWORK',
      icon: <Shield className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] stroke-[1.5]" />,
      route: '/policy',
    },
    {
      num: '02',
      center: 'BILLING CENTER',
      flow: 'PREMIUM → AUTOMATION',
      title: 'Billing',
      body: 'Automated micro-premiums. Flexible payments. Transparent tracking. Pay premiums based on actual risk with detailed reports.',
      footer: 'ACTIVE COVERAGE PROTOCOL',
      icon: <CreditCard className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] stroke-[1.5]" />,
      route: '/billing',
    },
    {
      num: '03',
      center: 'CLAIM CENTER',
      flow: 'TRIGGER → PAYOUT',
      title: 'Claim',
      body: 'Zero-touch payouts. Trigger-based. Instant disbursement. When environmental triggers are met, receive instant payouts directly.',
      footer: 'AUTOMATED PAYOUT ENGINE',
      icon: <Zap className="w-10 h-10 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)] stroke-[1.5]" />,
      route: '/claims',
    },
  ];

  return (
    <section id="pillars" className="bg-[#FAFAF8] px-6" style={{ paddingBlock: 'clamp(80px, 12vw, 140px)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-stretch">
        {pillars.map((p, i) => (
          <motion.div
            key={p.num}
            onClick={() => navigate(p.route)}
            className="cursor-pointer group flex flex-col h-full bg-transparent relative"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            {/* Background Numbering */}
            <div className="absolute -top-10 -left-6 text-[8rem] font-light text-gray-100 select-none z-0 tracking-tighter leading-none pointer-events-none transition-all group-hover:text-orange-50 delay-75">
              {p.num}
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                {p.icon}
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {p.center}
                  </p>
                  <p className="text-xs text-[#1A1A1A] font-semibold uppercase tracking-wider mt-0.5">
                    {p.flow}
                  </p>
                </div>
              </div>
              
              <h3 className="font-['Inter'] text-2xl md:text-3xl font-bold text-[#111] tracking-tight group-hover:text-orange-600 transition-colors">
                {p.title}
              </h3>
              
              <p className="text-sm md:text-base leading-relaxed text-gray-500 mt-4 pr-4 border-l-2 border-transparent group-hover:border-orange-200 pl-4 -ml-4 transition-all">
                {p.body}
              </p>
              
              <div className="mt-auto pt-8">
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400 group-hover:text-orange-400 transition-colors">
                  {p.footer}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CertaintySection() {
  return (
    <section className="bg-[#FAFAF8] px-6" style={{ paddingBlock: 'clamp(80px, 10vw, 120px)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="max-w-xl">
          <h2 className="display-head leading-none text-[clamp(2.5rem,5vw,4.5rem)] break-words -tracking-widest">
            Redefining
          </h2>
          <h2 className="font-['Instrument_Serif'] italic font-bold text-[#0F7B6C] leading-none text-[clamp(2.5rem,5vw,4.5rem)] break-words">
            Certainty.
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-lg mt-8">
            KavachSathi provides parametric micro-insurance for India's gig economy.
            Experience instant, data-driven coverage with transparent, automated payouts
            when predefined triggers are met, ensuring financial stability for every worker.
          </p>
          <blockquote className="border-l-4 border-[#0F7B6C] pl-5 text-gray-500 italic text-sm mt-5 leading-relaxed">
            "When the rain exceeds 60mm, your payout is instant. No forms. No waiting.
            The oracle verifies, the smart contract executes."
          </blockquote>
        </motion.div>

        {/* Right — Oracle Widget */}
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
          <div className="card p-6 shadow-md max-w-sm ml-auto">
            <p className="section-label">Oracle State</p>
            <div className="flex items-center justify-center my-8">
              <div className="w-20 h-20 rounded-full border-2 border-[#0F7B6C] flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-[#0F7B6C]" />
              </div>
            </div>
            <p className="text-center text-[#0F7B6C] font-semibold uppercase tracking-wider text-sm">Verified</p>
            <div className="flex justify-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A3C5E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Variant 3 of 8</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#111827] text-white px-8 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h2 className="font-['Instrument_Serif'] italic text-6xl font-bold text-white">KS.</h2>
            <p className="text-sm text-gray-400 mt-2">Parametric Insurance Protocol // 2026</p>
          </div>
          {[
            { title: 'Product', links: ['Policy Center', 'Billing Center', 'Claim Center', 'Risk Engine'] },
            { title: 'Legal', links: ['Privacy Protocol', 'Terms of Service', 'DPDP Compliance', 'Smart Contract Terms'] },
            { title: 'Company', links: ['About', 'Careers', 'Contact Us', 'Documentation'] },
          ].map(col => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">{col.title}</p>
              <div className="flex flex-col gap-2.5">
                {col.links.map(l => (
                  <a key={l} href="#" className="text-sm text-gray-300 hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 mt-12 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 KavachSathi. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Protocol', 'Smart Contract Terms', 'Oracle SLAs'].map(l => (
              <a key={l} href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════
   Main Home Component
   ═══════════════════ */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navbar />
      <main>
        <HeroSection />
        <PillarsSection />
        <CertaintySection />
      </main>
      <Footer />
    </div>
  );
}
