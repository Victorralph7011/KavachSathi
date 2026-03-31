import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import './Hero.css';

const heroText = 'KAVACHSATHI';

const letterVariants = {
  hidden: { y: 200, opacity: 0, rotateX: -90 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 1.2,
      delay: 0.8 + i * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const fadeUp = {
  hidden: { y: 40, opacity: 0 },
  visible: (delay) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 1, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  return (
    <section className="hero" ref={sectionRef} id="hero">
      {/* Background grid lines */}
      <div className="hero__grid" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="hero__grid-line" />
        ))}
      </div>

      {/* Neon glow orb */}
      <motion.div
        className="hero__orb"
        style={{ opacity }}
        aria-hidden="true"
      />

      <div className="container hero__container">
        {/* Top meta */}
        <motion.div
          className="hero__meta"
          custom={0.6}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <span className="text-label" style={{ color: 'var(--white-muted)' }}>
            Parametric Insurance
          </span>
          <span className="hero__meta-divider" />
          <span className="text-mono neon-text">EST. 2026</span>
        </motion.div>

        {/* Giant Title */}
        <motion.div className="hero__title-wrap" style={{ y: titleY, scale }}>
          <h1 className="hero__title" aria-label="KavachSathi">
            {heroText.split('').map((char, i) => (
              <motion.span
                key={i}
                className="hero__letter"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={letterVariants}
                style={{ display: 'inline-block' }}
              >
                {char}
              </motion.span>
            ))}
          </h1>
          {/* Neon underline */}
          <motion.div
            className="hero__title-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>

        {/* Subtitle row */}
        <motion.div
          className="hero__subtitle-row"
          style={{ y: subtitleY, opacity }}
        >
          <motion.p
            className="hero__subtitle"
            custom={1.8}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            Insurance that triggers instantly.
            <br />
            <span className="neon-text">No claims. No delays. Just coverage.</span>
          </motion.p>

          <motion.div
            className="hero__risk-badge glass"
            custom={2.0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <span className="text-label" style={{ color: 'var(--neon)' }}>
              Risk Engine
            </span>
            <span className="text-mono" style={{ color: 'var(--white-dim)', marginTop: '4px' }}>
              R = E×0.4 + P×0.4 + M×0.2
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="hero__scroll-indicator"
          custom={2.4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="hero__scroll-line">
            <motion.div
              className="hero__scroll-dot"
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <span className="text-label" style={{ color: 'var(--white-muted)' }}>
            Scroll
          </span>
        </motion.div>
      </div>
    </section>
  );
}
