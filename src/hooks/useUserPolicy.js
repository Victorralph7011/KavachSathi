import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import db from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const IS_DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-kavachsathi-key';

export function useUserPolicy() {
  const { currentUser } = useAuth();
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyHistory, setPolicyHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPolicies() {
      if (!currentUser) {
        setActivePolicy(null);
        setPolicyHistory([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (IS_DEMO_MODE) {
        // Resolve Demo Mode locally
        const stored = localStorage.getItem(`kavach_policies_${currentUser.uid}`);
        let policies = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(policies)) policies = [];
        setPolicyHistory(policies);
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setActivePolicy(active || null);
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

        // Find the most recent active policy (ISSUED or BOUND)
        const active = policies.find(p => p.status === 'ISSUED' || p.status === 'BOUND');
        setActivePolicy(active || null);

      } catch (error) {
        console.error("[KAVACH] Error fetching user policies:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPolicies();
  }, [currentUser]);

  return { activePolicy, policyHistory, isLoading };
}
