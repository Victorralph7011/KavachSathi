import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingView() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background Environment - Boot Sequence Fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      {/* Transparent Navbar anchored at top */}
      <nav className="absolute top-0 inset-x-0 z-50 h-24 flex items-center justify-between px-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#0F172A] drop-shadow-sm hover:text-[#0F7B6C] transition-colors">
          Kavach Sathi
        </Link>
        
        {currentUser && (
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
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-14 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 w-64 z-50"
                >
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Authenticated Operative</p>
                  <p className="font-bold text-base text-white">{currentUser.displayName || 'Unassigned'}</p>
                  <p className="font-mono text-xs text-gray-400 truncate mt-1">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-3 mb-4">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-semibold tracking-wider">CLEARANCE ACTIVE</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Centered Vertical Stack - Borderless UI */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center text-center mt-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
          className="mb-8"
        >
          <ShieldCheck className="w-16 h-16 text-[#0F172A]" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="text-6xl font-bold tracking-tighter text-[#0F172A] mb-12 drop-shadow-sm"
        >
          <span className="block text-3xl text-slate-500 font-medium mb-3 tracking-tight">
            Welcome back, {currentUser?.displayName?.split(' ')[0] || 'User'}.
          </span>
          Welcome to KavachSathi.
        </motion.h1>

        {/* The Professional Status Indicators */}
        <div className="flex flex-col gap-4 mb-16 text-center items-center space-y-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="flex items-center gap-2 text-[#64748B] text-lg font-medium"
          >
            <ShieldCheck className="w-5 h-5 text-[#0F172A]" strokeWidth={2} />
            <p>Identity verified.</p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.6 }}
            className="text-[#64748B] font-medium text-lg"
          >
            No active protection found.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.0 }}
            className="text-[#64748B] text-lg"
          >
            Start your first policy submission.
          </motion.p>
        </div>

        {/* Primary Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2.4 }}
          className="w-full max-w-md"
        >
          <Link
            to="/register"
            style={{ color: '#ffffff' }}
            className="w-full py-[1.15rem] bg-[#0F172A] hover:bg-black !text-white font-extrabold tracking-widest text-[13px] uppercase rounded-none transition-all shadow-xl flex items-center justify-center gap-3 border border-[#0F172A]"
          >
            Initiate New Submission <ArrowRight size={18} className="text-white" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
