import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TerminalAuth.css';

/**
 * TerminalAuth — "Dark Ops / System Access" Login & Registration Portal
 * Simulates a secure console login experience.
 */
export default function TerminalAuth() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [authStatus, setAuthStatus] = useState('idle'); // idle, processing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [terminalLines, setTerminalLines] = useState([]);

  // Auto-focus email input on load
  const emailInputRef = useRef(null);
  useEffect(() => {
    emailInputRef.current?.focus();
  }, [isLogin]);

  const addLine = (text, type = 'system') => {
    setTerminalLines(prev => [...prev.slice(-4), { text, type, id: Date.now() + Math.random() }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setAuthStatus('processing');
    setErrorMsg('');
    setTerminalLines([]);

    addLine('> INITIATING SECURE HANDSHAKE...', 'system');
    
    setTimeout(() => {
      addLine(`> VERIFYING CREDENTIALS FOR [${email}]...`, 'process');
    }, 600);

    try {
      if (isLogin) {
        await login(email, password);
        setTimeout(() => {
          addLine('> AUTH TOKEN VERIFIED.', 'success');
          addLine('> ACCESS GRANTED.', 'success');
          setAuthStatus('success');
          
          setTimeout(() => {
            navigate('/dashboard'); // Route to morphing dashboard
          }, 1500);
        }, 1200);

      } else {
        await signup(email, password);
        setTimeout(() => {
          addLine('> USER IDENTITY REGISTERED.', 'success');
          addLine('> SESSION ESTABLISHED.', 'success');
          setAuthStatus('success');

          setTimeout(() => {
            navigate('/register'); // Route new users straight to Policy Center registration
          }, 1500);
        }, 1200);
      }
    } catch (err) {
      setTimeout(() => {
        let msg = 'ACCESS DENIED: INSUFFICIENT CLEARANCE';
        if (err.code === 'auth/user-not-found') msg = 'IDENTITY NOT FOUND';
        if (err.code === 'auth/wrong-password') msg = 'INVALID CREDENTIALS';
        if (err.code === 'auth/email-already-in-use') msg = 'IDENTITY CONFLICT: EMAIL IN USE';
        if (err.code === 'auth/weak-password') msg = 'SECURITY RISK: PASSWORD TOO WEAK';

        addLine(`> ${msg}`, 'error');
        setErrorMsg(msg);
        setAuthStatus('error');
      }, 1200);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg('');
    setAuthStatus('idle');
    setTerminalLines([]);
  };

  return (
    <div className="terminal-auth-container">
      <motion.div 
        className="auth-box glass"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header / Brand */}
        <div className="auth-header">
          <motion.div 
            className="auth-header__icon"
            animate={{ 
              boxShadow: authStatus === 'processing' 
                ? '0 0 20px rgba(57, 255, 20, 0.5)' 
                : '0 0 0px rgba(57, 255, 20, 0)' 
            }}
            transition={{ duration: 0.5, yoyo: Infinity }}
          >
            {authStatus === 'success' ? <Shield size={24} /> : <Terminal size={24} />}
          </motion.div>
          <div className="auth-header__titles">
            <h1 className="auth-header__title">KAVACH_SATHI</h1>
            <span className="auth-header__subtitle text-mono">
              SYSTEM_AUTH // v4.0.1
            </span>
          </div>
        </div>

        {/* Input Form */}
        <div className="auth-body">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="text-mono">IDENTITY_URI [EMAIL]</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  ref={emailInputRef}
                  type="email"
                  className="auth-input text-mono"
                  placeholder="agent@network.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={authStatus === 'processing' || authStatus === 'success'}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="text-mono">ACCESS_KEY [PASSWORD]</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input
                  type="password"
                  className="auth-input text-mono"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authStatus === 'processing' || authStatus === 'success'}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  className="auth-error text-mono"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`auth-submit-btn ${authStatus === 'processing' ? 'processing' : ''}`}
              disabled={authStatus === 'processing' || authStatus === 'success'}
            >
              <span className="text-mono">
                {authStatus === 'processing' ? 'AUTHENTICATING...' : isLogin ? 'INITIATE_LOGIN' : 'REGISTER_IDENTITY'}
              </span>
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="auth-toggle text-mono">
            {isLogin ? "NO IDENTITY FOUND? " : "IDENTITY VERIFIED? "}
            <button type="button" onClick={toggleMode} disabled={authStatus === 'processing' || authStatus === 'success'}>
              {isLogin ? 'REQUEST_ACCESS' : 'PROCEED_TO_LOGIN'}
            </button>
          </div>
        </div>

        {/* Terminal Live Output logs */}
        <div className="auth-terminal-log">
          <div className="auth-terminal-log__header">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
            <span className="text-mono auth-terminal-log__title">SECURE_CHANNEL</span>
          </div>
          <div className="auth-terminal-log__body text-mono">
            {terminalLines.map((line) => (
              <motion.div 
                key={line.id} 
                className={`terminal-out line-${line.type}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {line.text}
              </motion.div>
            ))}
            {authStatus === 'processing' && (
              <span className="auth-cursor">_</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Futuristic Background overlay */}
      <div className="auth-bg-overlay" />
    </div>
  );
}
