import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AuthInput from '../components/AuthInput';

/**
 * KavachSathi Login — High-Trust Borderless Login
 * All Firebase auth logic preserved from TerminalAuth.jsx.
 * Visual redesign: Video background, AuthInput borderless lines, Deep Navy text.
 */
export default function TerminalAuth() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from || '/dashboard';

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authStatus, setAuthStatus] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthStatus('processing');
    setErrorMsg('');

    try {
      if (isLogin) {
        await login(email, password);
        setAuthStatus('success');
        setTimeout(() => navigate(fromPath), 800);
      } else {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        await signup(email, password, fullName);
        setAuthStatus('success');
        setTimeout(() => navigate(fromPath), 800);
      }
    } catch (err) {
      let msg = 'Authentication failed. Unauthorized.';
      if (err.code === 'auth/user-not-found') msg = 'No clearance found for this identifier.';
      if (err.code === 'auth/wrong-password') msg = 'Invalid access credential.';
      if (err.code === 'auth/invalid-credential') msg = 'Invalid identifier or credential.';
      if (err.code === 'auth/email-already-in-use') msg = 'Identifier already active in network.';
      if (err.code === 'auth/weak-password') msg = 'Credential does not meet protocol entropy.';
      setErrorMsg(msg);
      setAuthStatus('error');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setAuthStatus('idle');
  };

  const isDisabled = authStatus === 'processing' || authStatus === 'success';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* The Environment */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      >
        <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      {/* Transparent Navbar */}
      <nav className="absolute top-0 inset-x-0 z-50 h-24 flex items-center px-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#0F172A] drop-shadow-sm hover:text-[#0F7B6C] transition-colors">
          Kavach Sathi
        </Link>
      </nav>

      {/* Centered Vertical Stack */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[400px] px-8 flex flex-col items-start pt-10"
      >
        <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tighter text-[#0F172A] mb-14 drop-shadow-sm">
          {isLogin ? 'Welcome back' : 'Get started'}
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-10">
          {!isLogin && (
            <AuthInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isDisabled}
              placeholder="Shashwat C."
              hasError={authStatus === 'error'}
            />
          )}

          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isDisabled}
            placeholder="you@example.com"
            hasError={authStatus === 'error'}
          />

          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isDisabled}
            placeholder="••••••••"
            hasError={authStatus === 'error'}
          />

          {/* Error Display */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-[-10px]"
              >
                <p className="font-mono text-[11px] text-[#EF4444] tracking-tight font-bold">
                  [ERR] {errorMsg.replace('Error: ', '')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Execution */}
          <div className="mt-4 flex flex-col gap-6 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isDisabled}
              className={`w-full py-[1.15rem] text-center text-[#FFFFFF] font-extrabold tracking-widest text-[13px] uppercase
                rounded-none transition-all shadow-xl bg-[#0F172A]
                ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black'}
              `}
            >
              {authStatus === 'processing' ? 'NEGOTIATING...' : authStatus === 'success' ? 'ACCESS GRANTED' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </motion.button>
            
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[11px] uppercase tracking-widest text-slate-500 hover:text-[#0F172A] font-bold transition-colors"
              >
                {isLogin ? 'Get started' : 'Sign in'}
              </button>
              {isLogin && (
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-widest text-slate-500 hover:text-[#0F172A] font-bold transition-colors"
                >
                  FORGOT PASSWORD?
                </button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
