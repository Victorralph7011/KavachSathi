import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Pillars from '../components/Pillars';
import MissionControl from '../components/MissionControl';
import Footer from '../components/Footer';

export default function Home() {
  const [loading, setLoading] = useState(true);

  // Remove loader after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // 2 second initial loading flash
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Intro sequence loader (simulated quick flash) */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="page-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }}
            key="loader"
          >
            <motion.div
              className="loader-text"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.8 }}
            >
              Initializing System
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Navbar />
      
      <main>
        <Hero />
        <About />
        <Pillars />
      </main>

      <Footer />
      <MissionControl />
    </>
  );
}
