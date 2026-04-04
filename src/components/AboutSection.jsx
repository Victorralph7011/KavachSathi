import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CloudRain, Flame, Wind, Wifi, ShieldCheck, Target, MapPin, Scale, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashSidebar from './DashSidebar';

/**
 * KavachSathi — About Section: "The Glass Dossier"
 * ==================================================
 * 
 * Professional insurance portfolio page with:
 * - Mission Statement
 * - Zero-Touch Promise
 * - 4 Signature Series Policy Cards
 * - Geo-Fairness Actuarial Explanation
 * - Compliance Footer
 * 
 * GOLDEN RULES ENFORCED:
 *   ✓ Loss of Income ONLY
 *   ✓ Food Delivery persona
 *   ✓ Weekly ₹20–₹50 pricing
 */

const POLICIES = [
  {
    id: 'monsoon',
    name: 'Monsoon Sentinel',
    subtitle: 'Extreme Weather Protection',
    icon: CloudRain,
    color: '#3B82F6',
    bgGlow: 'rgba(59,130,246,0.15)',
    trigger: 'Rainfall > 60mm in 24hrs',
    source: 'IMD Verified Oracle',
    benefit: 'Instant income stabilization payout for delivery partners unable to work safely during extreme rainfall events.',
    tag: 'ACTIVE',
  },
  {
    id: 'thermal',
    name: 'Thermal Shield',
    subtitle: 'Heatwave Resilience',
    icon: Flame,
    color: '#F59E0B',
    bgGlow: 'rgba(245,158,11,0.15)',
    trigger: 'Temperature > 45°C for 3+ hours',
    source: 'IMD Thermal Oracle',
    benefit: 'Provides a hydration & sustenance stipend to mitigate income loss during extreme heat advisories.',
    tag: 'ACTIVE',
  },
  {
    id: 'aero',
    name: 'AeroGuard Credit',
    subtitle: 'Air Quality Protection',
    icon: Wind,
    color: '#A855F7',
    bgGlow: 'rgba(168,85,247,0.15)',
    trigger: 'AQI > 300 sustained for 4+ hours',
    source: 'CPCB Air Quality Oracle',
    benefit: 'Provides credit for N95 protection equipment and compensates income lost during severe pollution events.',
    tag: 'ACTIVE',
  },
  {
    id: 'sync',
    name: 'System Sync Assurance',
    subtitle: 'Platform Outage Cover',
    icon: Wifi,
    color: '#10B981',
    bgGlow: 'rgba(16,185,129,0.15)',
    trigger: 'Verified app downtime > 90 minutes',
    source: 'Platform Health Monitor',
    benefit: 'Hourly-rated compensation for lost incentive bonuses during verified Zomato/Swiggy/Zepto outages during peak hours.',
    tag: 'ACTIVE',
  },
];

function PolicyCard({ policy, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = policy.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-7 hover:bg-white/20 transition-all duration-500 relative overflow-hidden"
    >
      {/* Glow accent */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ backgroundColor: policy.bgGlow }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${policy.color}15`, border: `1px solid ${policy.color}30` }}
          >
            <Icon size={22} style={{ color: policy.color }} />
          </div>
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border"
            style={{
              color: policy.color,
              backgroundColor: `${policy.color}10`,
              borderColor: `${policy.color}30`,
            }}
          >
            {policy.tag}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#1A1A1A] group-hover:text-[#FF6B00] transition-colors">
          {policy.name}
        </h3>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          {policy.subtitle}
        </p>

        {/* Trigger */}
        <div className="mt-5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl p-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trigger Threshold</p>
          <p className="font-mono text-sm font-bold" style={{ color: policy.color }}>
            {policy.trigger}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Source: {policy.source}
          </p>
        </div>

        {/* Benefit */}
        <p className="text-sm text-slate-600 leading-relaxed mt-4">
          {policy.benefit}
        </p>
      </div>
    </motion.div>
  );
}

export default function AboutSection() {
  const missionRef = useRef(null);
  const isMissionInView = useInView(missionRef, { once: true, margin: '-80px' });

  return (
    <div className="relative min-h-screen flex font-['Inter',sans-serif] overflow-hidden bg-[#FAFAF8]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/assets/videos/atmosphere.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
      </div>

      <DashSidebar activeTab="about" />

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-12">

          {/* ─── Hero Mission ─────────────────────────────────── */}
          <motion.div
            ref={missionRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isMissionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/40 border border-white/20 shadow-sm flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#1A3C5E]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">KavachSathi Protection Portfolio</span>
                <h1 className="text-xl font-bold text-[#1A1A1A]">About KavachSathi</h1>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 md:p-12">
              <h2 className="font-['Instrument_Serif'] italic text-4xl md:text-5xl font-bold text-[#0F172A] leading-tight">
                The Digital Safety Net for India's<br />
                <span className="text-[#FF6B00]">7.7 Million</span> Gig Workers.
              </h2>

              <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-3xl mt-6">
                KavachSathi is a next-generation parametric insurance platform dedicated to the food delivery
                partners powering India's cities. We bridge the <strong className="text-[#0F172A]">'Protection Gap'</strong> by
                replacing traditional claims complexity with automated financial resilience.
              </p>

              {/* Zero-Touch Promise */}
              <div className="mt-8 bg-[#0F172A] rounded-xl p-6 max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-[#FF6B00]" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">The Zero-Touch Promise</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  No claims adjusters. No paperwork. No phone calls. The <span className="text-emerald-400 font-semibold">data is the claim</span>.
                  When environmental conditions cross predefined thresholds, payouts are executed instantly
                  to your digital wallet. From detection to settlement in minutes — not weeks.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Compliance Strip ──────────────────────────────── */}
          <div className="mb-8 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-xl px-5 py-3 flex flex-wrap items-center gap-4">
            <ShieldCheck size={16} className="text-[#1A3C5E] shrink-0" />
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              COVERAGE: Loss of Income ONLY
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              PERSONA: Food Delivery Partners
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              BILLING: Weekly (₹20 – ₹50)
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-[#1A3C5E] tracking-wide">
              CIRCUIT BREAKER: 85% Loss Ratio
            </span>
          </div>

          {/* ─── Signature Series — 4 Policy Cards ────────────── */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Signature Series</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {POLICIES.map((policy, i) => (
                <PolicyCard key={policy.id} policy={policy} index={i} />
              ))}
            </div>
          </div>

          {/* ─── Geo-Fairness & Actuarial Section ─────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Actuarial Intelligence</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Geo-Fairness */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-[#1A3C5E]/10 border border-[#1A3C5E]/20 flex items-center justify-center">
                    <MapPin size={18} className="text-[#1A3C5E]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Geo-Fairness Index</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Payouts are indexed by area classification. The income-drop severity differs
                  between Urban and Rural zones, ensuring fair and proportional coverage.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/20 border border-white/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-[#1A3C5E] uppercase tracking-widest mb-1">Urban</p>
                    <p className="font-mono text-lg font-bold text-[#0F172A]">₹8,000</p>
                    <p className="text-[10px] text-slate-500">weekly income → ₹5,000 drop</p>
                    <p className="font-mono text-xs font-bold text-[#FF6B00] mt-1">L<sub>avg</sub> = ₹800/day</p>
                  </div>
                  <div className="bg-white/20 border border-white/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] font-bold text-[#0F7B6C] uppercase tracking-widest mb-1">Rural</p>
                    <p className="font-mono text-lg font-bold text-[#0F172A]">₹4,000</p>
                    <p className="text-[10px] text-slate-500">weekly income → ₹1,000 drop</p>
                    <p className="font-mono text-xs font-bold text-[#FF6B00] mt-1">L<sub>avg</sub> = ₹400/day</p>
                  </div>
                </div>
              </div>

              {/* Pricing Formula */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-[#0F7B6C]/10 border border-[#0F7B6C]/20 flex items-center justify-center">
                    <Scale size={18} className="text-[#0F7B6C]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">Actuarial Formula</h3>
                </div>
                <div className="bg-[#0F172A] rounded-xl p-5 mb-4">
                  <p className="font-mono text-sm text-emerald-400 font-bold text-center">
                    Premium = P(Trigger) × L<sub>avg</sub> × D<sub>exposed</sub>
                  </p>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    Hard-capped at ₹20 – ₹50 per week (IRDAI Sandbox Compliance)
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    ['P(Trigger)', 'Probability of weather/platform event based on historical data'],
                    ['L_avg', 'Average income lost per day, indexed by Urban/Rural classification'],
                    ['D_exposed', 'Duration of exposure to the disruption event (in days)'],
                  ].map(([term, desc]) => (
                    <div key={term} className="flex gap-3 items-start">
                      <span className="font-mono text-xs font-bold text-[#FF6B00] shrink-0 mt-0.5">{term}</span>
                      <span className="text-xs text-slate-600 leading-relaxed">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── CTA ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10">
              <h3 className="font-['Instrument_Serif'] italic text-3xl font-bold text-[#0F172A] mb-3">
                Ready for Zero-Touch Protection?
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Join thousands of delivery partners who trust KavachSathi to protect their livelihood — automatically.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e66000] text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Get Covered <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
