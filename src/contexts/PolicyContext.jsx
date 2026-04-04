import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import db from '../lib/firebase';
import { useAuth } from './AuthContext';
import { fetchPlatformHealth } from '../services/api';

/**
 * PolicyContext — Global state persistence for all centers
 * 
 * Provides policy_id, worker_id, areaCategory, and platform health
 * to Policy, Billing, Claims, and Analytics centers.
 */
const PolicyContext = createContext();

export function usePolicy() {
  return useContext(PolicyContext);
}

const IS_DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-kavachsathi-key';

export function PolicyProvider({ children }) {
  const { currentUser } = useAuth();

  // Policy state
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payments & Triggers from subcollections
  const [payments, setPayments] = useState([]);
  const [triggers, setTriggers] = useState([]);

  // Backend platform health
  const [platformHealth, setPlatformHealth] = useState(null);

  // ─── Fetch policies from Firestore ───────────────────────────
  useEffect(() => {
    async function fetchPolicies() {
      if (!currentUser) {
        setActivePolicy(null);
        setPolicyHistory([]);
        setPayments([]);
        setTriggers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (IS_DEMO_MODE) {
        const stored = localStorage.getItem(`kavach_policies_${currentUser.uid}`);
        let policies = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(policies)) policies = [];
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setPolicyHistory(policies);
        setActivePolicy(active || null);
        setPayments([]);
        setTriggers([]);
        setIsLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'policies'),
          where('ownerId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const policies = snapshot.docs.map(doc => doc.data());

        // Sort locally to bypass Firebase composite index requirements
        policies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPolicyHistory(policies);

        // Find the most recent active policy
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setActivePolicy(active || null);

        // Fetch subcollections if active policy exists
        if (active?.policyId) {
          const [paySnap, trigSnap] = await Promise.all([
            getDocs(query(collection(db, 'policies', active.policyId, 'payments'), orderBy('createdAt', 'desc'))),
            getDocs(query(collection(db, 'policies', active.policyId, 'triggers'), orderBy('createdAt', 'desc'))),
          ]);
          setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setTriggers(trigSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          setPayments([]);
          setTriggers([]);
        }
      } catch (error) {
        console.error('[KAVACH] PolicyContext sync error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPolicies();
  }, [currentUser]);

  // ─── Backend platform health polling (30s) ──────────────────
  useEffect(() => {
    async function loadHealth() {
      const res = await fetchPlatformHealth();
      if (res.success && res.data) {
        setPlatformHealth(res.data);
      }
    }
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Derived values ─────────────────────────────────────────
  const derivedValues = useMemo(() => {
    const policy = activePolicy;
    return {
      policyId: policy?.policyId || null,
      workerId: policy?.workerId || null,
      areaCategory: policy?.areaCategory || 'URBAN',
      lAvg: (policy?.areaCategory === 'RURAL') ? 400 : 800,
      wardId: policy?.wardId || null,
      platform: policy?.platform || null,
      insuredName: policy?.insuredName || currentUser?.displayName || null,
      riskGrade: policy?.riskGrade || null,
      isRegistered: !!policy,
    };
  }, [activePolicy, currentUser]);

  const value = {
    // Policy data
    activePolicy,
    policyHistory,
    payments,
    triggers,
    isLoading,

    // Derived convenience values
    ...derivedValues,

    // Backend health
    platformHealth,

    // Method to force refresh
    refreshPolicy: async () => {
      if (!currentUser) return;
      setIsLoading(true);

      if (IS_DEMO_MODE) {
        const stored = localStorage.getItem(`kavach_policies_${currentUser.uid}`);
        let policies = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(policies)) policies = [];
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setPolicyHistory(policies);
        setActivePolicy(active || null);
        setIsLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'policies'), where('ownerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const policies = snapshot.docs.map(doc => doc.data());
        policies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPolicyHistory(policies);
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setActivePolicy(active || null);
      } finally {
        setIsLoading(false);
      }
    },
  };

  return (
    <PolicyContext.Provider value={value}>
      {children}
    </PolicyContext.Provider>
  );
}
