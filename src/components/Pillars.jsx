import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserPolicy } from '../hooks/useUserPolicy';
import { AlertCircle } from 'lucide-react';
import './Pillars.css';

/* —— SVG Icons —— */
const ShieldIcon = () => (
  <svg viewBox="0 0 120 140" fill="none" className="pillar-icon">
    <path
      d="M60 8L10 35V75C10 105 60 132 60 132C60 132 110 105 110 75V35L60 8Z"
      stroke="var(--neon)"
      strokeWidth="1.5"
      fill="none"
    />
    {[20, 35, 50, 65, 80].map((y) => (
      <line key={`h-${y}`} x1="20" y1={y} x2="100" y2={y} stroke="var(--white-muted)" strokeWidth="0.5" />
    ))}
    {[30, 45, 60, 75, 90].map((x) => (
      <line key={`v-${x}`} x1={x} y1="15" x2={x} y2="120" stroke="var(--white-muted)" strokeWidth="0.5" />
    ))}
    <line x1="20" y1="30" x2="100" y2="110" stroke="var(--white-ghost)" strokeWidth="0.5" />
    <line x1="100" y1="30" x2="20" y2="110" stroke="var(--white-ghost)" strokeWidth="0.5" />
    <circle cx="60" cy="65" r="4" fill="var(--neon)" opacity="0.8" />
    <circle cx="60" cy="65" r="12" fill="none" stroke="var(--neon)" strokeWidth="0.5" opacity="0.4" />
  </svg>
);

const BillingIcon = () => (
  <svg viewBox="0 0 120 120" fill="none" className="pillar-icon">
    <rect x="10" y="25" width="100" height="70" rx="8" stroke="var(--neon)" strokeWidth="1.5" />
    {Array.from({ length: 15 }, (_, i) => (
      <line key={i} x1={15 + i * 6.5} y1="30" x2={15 + i * 6.5} y2="90" stroke="var(--white-muted)" strokeWidth="0.4" />
    ))}
    <rect x="24" y="40" width="20" height="16" rx="3" stroke="var(--neon)" strokeWidth="1" fill="none" />
    <line x1="24" y1="48" x2="44" y2="48" stroke="var(--neon)" strokeWidth="0.5" />
    <line x1="34" y1="40" x2="34" y2="56" stroke="var(--neon)" strokeWidth="0.5" />
    <text x="80" y="78" fill="var(--neon)" fontSize="24" fontFamily="var(--font-serif)" fontWeight="700" opacity="0.7">₹</text>
    <path d="M65 45 L90 45 L85 40 M90 45 L85 50" stroke="var(--white-dim)" strokeWidth="1" fill="none" />
    <path d="M95 55 L70 55 L75 50 M70 55 L75 60" stroke="var(--white-dim)" strokeWidth="1" fill="none" />
  </svg>
);

const ClaimIcon = () => (
  <svg viewBox="0 0 120 140" fill="none" className="pillar-icon">
    <path d="M72 8L38 65H58L48 132L95 58H70L82 8H72Z" stroke="var(--neon)" strokeWidth="1.5" fill="none" />
    <path d="M8 95H30L38 75L50 115L62 82L70 95H112" stroke="var(--neon)" strokeWidth="1" fill="none" opacity="0.6" />
    <circle cx="38" cy="65" r="2" fill="var(--neon)" opacity="0.6" />
    <circle cx="70" cy="58" r="2" fill="var(--neon)" opacity="0.6" />
    <circle cx="60" cy="70" r="35" stroke="var(--neon)" strokeWidth="0.5" opacity="0.2" />
    <circle cx="60" cy="70" r="50" stroke="var(--neon)" strokeWidth="0.3" opacity="0.1" />
  </svg>
);

const pillarsData = [
  {
    id: 'policy',
    index: '01',
    title: 'Policy',
    center: 'Policy Center',
    subtitle: 'Submission → Issuance',
    description:
      'AI-powered risk assessment creates hyper-personalized micro-policies. Your shield adapts to your journey — location, weather, traffic, all in real-time.',
    detail: 'Mesh-Shield Protection Network',
    Icon: ShieldIcon,
  },
  {
    id: 'billing',
    index: '02',
    title: 'Billing',
    center: 'Billing Center',
    subtitle: 'Premium → Cash',
    description:
      'Pay only for what you need. Dynamic pricing flows with your risk profile — transparent, instant, and fraction-of-traditional-cost micro-premiums.',
    detail: 'Currency Flow Architecture',
    Icon: BillingIcon,
  },
  {
    id: 'claim',
    index: '03',
    title: 'Claim',
    center: 'Claim Center',
    subtitle: 'Trigger → Payout',
    description:
      'No paperwork. No waiting. When sensor thresholds are breached, payouts fire automatically — lightning-fast, trustless, and verifiable.',
    detail: 'Instant Parametric Activation',
    Icon: ClaimIcon,
  },
];

/* Card animation variants */
const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      delay: i * 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

function PillarCard({ pillar, index, onClick }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  return (
    <motion.div
      className="pillar-card"
      ref={ref}
      custom={index}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={cardVariants}
      onClick={() => onClick(pillar.id)}
      whileHover={{ y: -5, boxShadow: '0 10px 40px rgba(57, 255, 20, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      style={{ cursor: 'pointer' }}
    >
      <div className="pillar-card__inner">
        {/* Header */}
        <div className="pillar-card__header">
          <span className="pillar-card__index">{pillar.index}</span>
          <span className="pillar-card__center text-mono">{pillar.center}</span>
          <div className="pillar-card__header-line" />
        </div>

        {/* Icon */}
        <div className="pillar-card__icon-wrap">
          <pillar.Icon />
          <div className="pillar-card__icon-glow" />
        </div>

        {/* Text */}
        <div className="pillar-card__text-col">
          <span className="pillar-card__subtitle text-label">{pillar.subtitle}</span>
          <h2 className="pillar-card__title">{pillar.title}</h2>
          <p className="pillar-card__desc text-body">{pillar.description}</p>
        </div>

        {/* Footer with formula */}
        <div className="pillar-card__footer">
          <span className="pillar-card__detail text-label">{pillar.detail}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Pillars() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-5%' });
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activePolicy, isLoading } = useUserPolicy();

  const [toastError, setToastError] = useState(null);

  const handlePillarClick = (id) => {
    // Guest Mode
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Still loading policy state... wait to prevent false negatives
    if (isLoading) return;

    // Authenticated Mode
    if (id === 'policy') {
      if (!activePolicy) {
        navigate('/register'); // Redirect to Wizard
      } else {
        navigate('/policy'); // Redirect to Policy Sub-Dashboard
      }
    } else if (id === 'billing') {
      if (!activePolicy) {
        setToastError('NODE_ERROR: NO_ACTIVE_BILLING_STREAM_FOUND');
        setTimeout(() => setToastError(null), 3500);
      } else {
        navigate('/billing'); // Redirect to Billing Ledger
      }
    } else if (id === 'claim') {
      if (!activePolicy) {
        setToastError('NODE_ERROR: NO_ACTIVE_POLICY_FOR_CLAIMS');
        setTimeout(() => setToastError(null), 3500);
      } else {
        navigate('/claims'); // Redirect to Claim Trigger Log
      }
    }
  };

  return (
    <section className="pillars" id="pillars">
      {/* Section header */}
      <div className="container pillars__header" ref={headerRef}>
        <motion.div
          className="divider-neon"
          initial={{ scaleX: 0 }}
          animate={isHeaderInView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'left' }}
        />
        <div className="pillars__header-row">
          <span className="text-label" style={{ color: 'var(--neon)' }}>
            Three Pillars
          </span>
          <span className="text-mono" style={{ color: 'var(--white-muted)' }}>
            Core Architecture
          </span>
        </div>
      </div>

      {/* Risk Engine Formula — prominently displayed */}
      <motion.div
        className="pillars__formula-banner"
        initial={{ opacity: 0, y: 20 }}
        animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="pillars__formula-inner glass">
          <div className="pillars__formula-label">
            <span className="formula-dot" />
            <span className="text-label">AI Risk Engine</span>
          </div>
          <div className="pillars__formula-equation text-mono">
            <span className="formula-var">R</span>
            <span className="formula-op">=</span>
            <span className="formula-val">0.4</span>
            <span className="formula-var">E</span>
            <span className="formula-op">+</span>
            <span className="formula-val">0.4</span>
            <span className="formula-var">P</span>
            <span className="formula-op">+</span>
            <span className="formula-val">0.2</span>
            <span className="formula-var">M</span>
          </div>
          <div className="pillars__formula-legend text-mono">
            <span><em>E</em> Environmental</span>
            <span className="formula-sep">·</span>
            <span><em>P</em> Platform</span>
            <span className="formula-sep">·</span>
            <span><em>M</em> Mobility</span>
          </div>
        </div>
      </motion.div>

      {/* 3-Column Grid */}
      <div className="pillars__grid-container">
        <div className="pillars__grid">
          {pillarsData.map((pillar, i) => (
            <PillarCard key={pillar.id} pillar={pillar} index={i} onClick={handlePillarClick} />
          ))}
        </div>
      </div>

      {/* Floating Error Toast */}
      <AnimatePresence>
        {toastError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="text-mono"
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              zIndex: 9999,
              background: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff4444',
              padding: '12px 24px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <AlertCircle size={16} />
            <span>{toastError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
