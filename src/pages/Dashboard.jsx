import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserPolicy } from '../hooks/useUserPolicy';
import { motion, AnimatePresence } from 'framer-motion';

import OnboardingView from '../components/OnboardingView';
import CommandCenterView from '../components/CommandCenterView';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { activePolicy, isLoading } = useUserPolicy();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1A3C5E] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading dashboard...</span>
        </div>
      </div>
    );
  }

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
          <CommandCenterView policy={activePolicy} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
