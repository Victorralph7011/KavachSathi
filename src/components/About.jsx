import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import './About.css';

export default function About() {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  const yImage = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const isTextInView = useInView(textRef, { once: true, margin: '-10%' });

  return (
    <section className="about section" id="about" ref={containerRef}>
      <div className="container about__container">
        
        {/* Left: Asymmetric Typography */}
        <div className="about__text-col" ref={textRef}>
          <motion.h2 
            className="about__title text-display"
            initial={{ opacity: 0, y: 50 }}
            animate={isTextInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Redefining <br/>
            <span className="neon-text" style={{ fontStyle: 'italic' }}>Certainty.</span>
          </motion.h2>
          
          <motion.div 
            className="about__desc-wrap"
            initial={{ opacity: 0, x: -30 }}
            animate={isTextInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="about__line" />
            <p className="about__desc text-body">
              Traditional insurance is built on claims adjusters, long wait times, and endless paperwork. We believe in code over bureaucracy. 
              <br/><br/>
              By utilizing data oracles and smart contracts, KavachSathi executes micro-policies the moment an environmental or personal risk threshold is crossed. Trustless, transparent, and instantaneous.
            </p>
          </motion.div>
        </div>

        {/* Right: Data Viz Graphic */}
        <div className="about__visual-col">
          <motion.div 
            className="about__visual-box glass"
            style={{ y: yImage }}
          >
            {/* Minimalist abstract visualization of parametric logic */}
            <div className="about__viz-grid">
              <div className="viz-node" />
              <div className="viz-line" />
              <div className="viz-node active" />
              <div className="viz-line" />
              <div className="viz-node" />
            </div>
            
            <div className="about__viz-data text-mono">
              <span style={{ color: 'var(--white-muted)' }}>ORACLE_STATE:</span> 
              <span className="neon-text" style={{ marginLeft: '12px' }}>VERIFIED</span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
