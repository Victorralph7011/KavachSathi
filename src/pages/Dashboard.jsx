import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPolicy } from '../hooks/useUserPolicy';
import { motion, AnimatePresence } from 'framer-motion';

// Component Views
import OnboardingView from '../components/OnboardingView';
import CommandCenterView from '../components/CommandCenterView';

/**
 * The unified morphing dashboard component.
 * Acts as the single source of truth for an authenticated user.
 */
export default function Dashboard() {
  const { currentUser } = useAuth();
  const { activePolicy, isLoading } = useUserPolicy();

  // If calculating auth or policy data, show a loader
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--obsidian)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--neon)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // NOTE: If it's a guest, ProtectedRoute should kick them to Home/Login
  // But just in case, return null here to prevent flashes before redirect
  if (!currentUser) return null;

  return (
    <AnimatePresence mode="wait">
      {!activePolicy ? (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <OnboardingView />
        </motion.div>
      ) : (
        <motion.div
          key="command-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Note: In a real system the policy data would hydrate the UI */}
          <CommandCenterView policy={activePolicy} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
