import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import db from '../lib/firebase';
import { useUserPolicy } from './useUserPolicy';

const IS_DEMO_MODE = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-kavachsathi-key';

export function useCenterData() {
  const { activePolicy, isLoading: isPolicyLoading } = useUserPolicy();
  
  const [payments, setPayments] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [isLoadingCenter, setIsLoadingCenter] = useState(true);

  useEffect(() => {
    async function fetchSubCollections() {
      if (!activePolicy || !activePolicy.policyId) {
        setPayments([]);
        setTriggers([]);
        setIsLoadingCenter(false);
        return;
      }

      setIsLoadingCenter(true);

      if (IS_DEMO_MODE) {
        setPayments(
          activePolicy.status === 'ISSUED'
            ? [{
                id: 'mock-pay-1',
                status: 'SUCCESS',
                amount: activePolicy.estimatedPremium || 40,
                paymentId: 'pay_MOCK1234567890',
                createdAt: activePolicy.issuedAt || new Date().toISOString(),
              }]
            : []
        );

        setTriggers(
          activePolicy.status === 'ISSUED'
            ? [
                {
                  id: 'mock-trig-1',
                  event: 'SYSTEM_ARMED',
                  reason: 'Coverage initiated',
                  status: 'MONITORING',
                  payoutAmount: 0,
                  createdAt: activePolicy.issuedAt || new Date().toISOString(),
                },
              ]
            : []
        );

        setIsLoadingCenter(false);
        return;
      }

      try {
        // Fetch Payments Subcollection
        const paymentsRef = collection(db, 'policies', activePolicy.policyId, 'payments');
        const qPayments = query(paymentsRef, orderBy('createdAt', 'desc'));
        const paySnap = await getDocs(qPayments);
        setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Triggers Subcollection
        const triggersRef = collection(db, 'policies', activePolicy.policyId, 'triggers');
        const qTriggers = query(triggersRef, orderBy('createdAt', 'desc'));
        const trigSnap = await getDocs(qTriggers);
        setTriggers(trigSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
      } catch (e) {
        console.error("[KAVACH] Center Data Sync Error:", e);
      } finally {
        setIsLoadingCenter(false);
      }
    }

    if (!isPolicyLoading) {
      fetchSubCollections();
    }
  }, [activePolicy, isPolicyLoading]);

  return {
    policy: activePolicy,
    payments,
    triggers,
    isLoading: isPolicyLoading || isLoadingCenter
  };
}
