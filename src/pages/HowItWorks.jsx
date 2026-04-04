import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UserPlus, Radio, ShieldCheck, Zap, ChevronRight, Clock, FileCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * KavachSathi — How It Works: "The Parametric Protocol"
 * ======================================================
 * 
 * 4-stage horizontal command flow explaining the parametric technology.
 * Desktop: 4-column with glowing orange connector lines
 * Mobile: Vertical timeline with step indicators
 * 
 * COMPLIANCE: Loss of Income ONLY · Food Delivery · Weekly ₹20–₹50
 */

const STAGES = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Contextual Enrollment',
    subtitle: 'Digital Handshake',
    description: 'The delivery partner selects a protection suite tailored to their platform (Zomato, Swiggy, Zepto) and city. The system establishes a secure digital handshake with our network of verified external data oracles.',
    detail: 'Coverage activates within minutes — no paperwork, no waiting periods.',
    color: '#3B82F6',
  },
  {
    step: '02',
    icon: Radio,
    title: 'Autonomous Monitoring',
    subtitle: '24/7 Oracle Surveillance',
    description: 'KavachSathi continuously polls high-fidelity data streams from IMD (India Meteorological Department) and CPCB (Central Pollution Control Board) around the clock.',
    detail: 'We monitor the specific environmental and technical risks of the worker\'s active delivery zone.',
    color: '#FF6B00',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'Algorithmic Verification',
    subtitle: 'POP Validator Defense',
    description: 'When a data point hits a threshold (e.g., 60mm rain), the system triggers the POP (Proof of Presence) Validator — our adversarial defense layer.',
    detail: 'It cross-checks platform login data and GPS trails using the Haversine formula to detect "Impossible Jumps" (>100 km/h), ensuring the worker was genuinely active during the disruption.',
    color: '#A855F7',
  },
  {
    step: '04',
    icon: Zap,
    title: 'Instant Liquidity',
    subtitle: 'Zero-Touch Settlement',
    description: 'Once verified, the parametric smart contract executes a payout immediately to the worker\'s digital wallet. Settlement happens in minutes, not weeks.',
    detail: 'The payout amount is calculated using the L_avg index specific to the worker\'s Urban or Rural zone.',
    color: '#10B981',
  },
];

function StageCard({ stage, index, total }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });
  const Icon = stage.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col"
    >
      {/* Connector line (desktop) */}
      {index < total - 1 && (
        <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 z-20">
          <div className="w-full h-full bg-gradient-to-r from-[#FF6B00]/60 to-[#FF6B00]/20 rounded-full" />
          <ArrowRight size={12} className="absolute -right-1 -top-[5px] text-[#FF6B00]/60" />
        </div>
      )}

      {/* Card */}
      <div className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-500 flex-1 relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ backgroundColor: `${stage.color}20` }}
        />

        <div className="relative z-10">
          {/* Step number + Icon */}
          <div className="flex items-center justify-between mb-5">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg relative"
              style={{
                backgroundColor: `${stage.color}15`,
                border: `1px solid ${stage.color}30`,
                boxShadow: `0 0 25px ${stage.color}20`,
              }}
            >
              <Icon size={24} style={{ color: stage.color }} />
            </div>
            <span className="font-mono text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors select-none">
              {stage.step}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:text-[#FF6B00] transition-colors">
            {stage.title}
          </h3>
          <p className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: stage.color }}>
            {stage.subtitle}
          </p>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed mt-4">
            {stage.description}
          </p>

          {/* Detail callout */}
          <div className="mt-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3">
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {stage.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile connector */}
      {index < total - 1 && (
        <div className="lg:hidden flex justify-center py-3">
          <div className="w-0.5 h-8 bg-gradient-to-b from-[#FF6B00]/50 to-[#FF6B00]/10 rounded-full" />
        </div>
      )}
    </motion.div>
  );
}

export default function HowItWorks() {
  const compRef = useRef(null);
  const isCompInView = useInView(compRef, { once: true, margin: '-50px' });

  return (
    <div className="relative min-h-screen font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      {/* Back Nav */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0F172A] transition-colors bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/40"
        >
          ← Back to Home
        </Link>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* ─── Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#FF6B00]">
            The Parametric Protocol
          </span>
          <h1 className="font-['Instrument_Serif'] italic text-4xl md:text-6xl font-bold text-[#0F172A] mt-3 leading-tight">
            How KavachSathi Works
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed">
            From enrollment to instant payout — our 4-stage pipeline transforms raw weather data
            into financial protection for delivery partners.
          </p>
        </motion.div>

        {/* ─── 4-Stage Flow ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mb-20">
          {STAGES.map((stage, i) => (
            <StageCard key={stage.step} stage={stage} index={i} total={STAGES.length} />
          ))}
        </div>

        {/* ─── Traditional vs Parametric ──────────────────── */}
        <motion.div
          ref={compRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isCompInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6 justify-center">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">The Efficiency Gap</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Traditional */}
            <div className="bg-white/10 backdrop-blur-xl border border-red-200/30 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Clock size={18} className="text-red-500" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Traditional Insurance</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Manual claim filing with paperwork',
                  'Claims adjuster visits & inspections',
                  '15–30 day settlement timeline',
                  'Dispute resolution required',
                  'High administrative overhead',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 text-xs">✕</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-red-50/50 border border-red-200/30 rounded-lg px-4 py-2.5 text-center">
                <span className="font-mono text-2xl font-black text-red-500">15–30 days</span>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-0.5">Average Settlement</p>
              </div>
            </div>

            {/* Parametric */}
            <div className="bg-white/10 backdrop-blur-xl border border-emerald-200/30 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Parametric (KavachSathi)</h3>
              </div>
              <div className="space-y-3">
                {[
                  'Zero paperwork — data IS the claim',
                  'Automated POP Validator verification',
                  'Minutes from trigger to settlement',
                  'Transparent, code-driven decisions',
                  'Haversine fraud detection (>100 km/h)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 text-xs">✓</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-emerald-50/50 border border-emerald-200/30 rounded-lg px-4 py-2.5 text-center">
                <span className="font-mono text-2xl font-black text-emerald-500">&lt; 5 minutes</span>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Average Settlement</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Adversarial Defense (POP) ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="bg-[#0F172A] rounded-2xl p-8 max-w-4xl mx-auto border border-white/5">
            <div className="flex items-center gap-3 mb-5">
              <ShieldAlert size={20} className="text-[#FF6B00]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                POP Validator — Adversarial Defense Layer
              </h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              Every payout passes through our Proof-of-Presence Validator. This adversarial defense engine uses the
              <span className="text-emerald-400 font-semibold"> Haversine formula</span> to calculate GPS velocity
              between consecutive check-ins. Any movement exceeding <span className="font-mono text-[#FF6B00] font-bold">100 km/h</span> is
              flagged as an <span className="text-red-400 font-semibold">"Impossible Jump"</span> — indicating GPS spoofing
              or device handoff.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'GPS Velocity Check', desc: 'Haversine distance ÷ time delta', icon: '📡' },
                { label: 'Platform Cross-Check', desc: 'Verify active login status on Zomato/Swiggy', icon: '🔄' },
                { label: 'Fraud Block', desc: 'Auto-reject + evidence trail if velocity > 100 km/h', icon: '🛡️' },
              ].map(item => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-xs font-bold text-white mt-2">{item.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ─── Survival Threshold ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl mx-auto text-center">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-3">Actuarial Intelligence</p>
            <h3 className="font-['Instrument_Serif'] italic text-2xl font-bold text-[#0F172A] mb-4">
              The Survival Threshold
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto mb-6">
              Our "Survival Threshold" line on the income graph represents the <span className="font-mono font-bold text-[#FF6B00]">L<sub>avg</sub></span> index —
              the minimum daily income needed for a delivery partner to sustain their livelihood in their specific city.
              Payouts are calculated to bridge exactly the gap between disrupted income and this survival line.
            </p>
            <div className="inline-block bg-[#0F172A] rounded-xl px-6 py-3">
              <span className="font-mono text-sm text-emerald-400 font-bold">
                Payout = max(0, L<sub>avg</sub> − Disrupted_Income) × D<sub>exposed</sub>
              </span>
            </div>
          </div>
        </motion.div>

        {/* ─── CTA ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center pb-12"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e66000] text-white px-10 py-4 rounded-full font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Covered Now <ChevronRight size={18} />
          </Link>
          <p className="text-xs text-slate-400 mt-3">
            Weekly premiums from ₹20 · Loss of Income coverage · Food Delivery partners
          </p>
        </motion.div>

      </main>
    </div>
  );
}
