import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { scrollY } = useScroll();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (y) => {
      setScrolled(y > 50);
    });
    
    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [scrollY]);

  const handleLogout = async () => {
    // We could add a terminal logout animation state here. For now, we signOut.
    await logout();
    setShowDropdown(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Policy', href: '#pillars' },
    { label: 'Billing', href: '#pillars' },
    { label: 'Claim', href: '#pillars' },
    { label: 'Mission Control', href: '#mission-control' },
  ];

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
    >
      <div className="navbar__inner">
        {/* Monogram */}
        <a href="#" className="navbar__logo" aria-label="KavachSathi Home">
          <span className="navbar__monogram">KS</span>
          <span className="navbar__logo-dot"></span>
        </a>

        {/* Nav Links */}
        <div className="navbar__links">
          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              className="navbar__link"
            >
              <span className="navbar__link-index text-mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="navbar__link-label">{link.label}</span>
            </a>
          ))}
        </div>

        {/* CTA or Profile Icon */}
        <div className="navbar__auth-area" ref={dropdownRef}>
          {!currentUser ? (
            <Link to="/login" className="navbar__cta">
              <TerminalIcon />
              <span>User Login</span>
            </Link>
          ) : (
            <div className="navbar__profile-container">
              <button 
                className="navbar__profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="profile-pulse"></div>
                <span className="profile-initial text-mono">
                  [{currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}]
                </span>
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    className="profile-dropdown glass"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">
                      <span className="text-mono sys-muted">SYSTEM INFO</span>
                    </div>
                    <div className="dropdown-body">
                      <div className="dropdown-row">
                        <span className="text-mono sys-muted">USER ID:</span>
                        <span className="text-mono">{currentUser.uid.substring(0, 8)}...</span>
                      </div>
                      <div className="dropdown-row">
                        <span className="text-mono sys-muted">STATUS:</span>
                        <span className="text-mono sys-neon">AUTHENTICATED</span>
                      </div>
                    </div>
                    <button className="dropdown-logout" onClick={handleLogout}>
                      <LogOut size={14} />
                      <span className="text-mono">LOGOUT_SESSION</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

// Simple Terminal Icon local component
function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  );
}
