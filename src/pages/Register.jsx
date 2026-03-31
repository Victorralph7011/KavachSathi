import { Navigate } from 'react-router-dom';
import RegistrationWizard from '../modules/policy-center/components/RegistrationWizard';
import { useUserPolicy } from '../hooks/useUserPolicy';

/**
 * Register Page — Policy Center Entry Point
 * Routes: /register
 */
export default function Register() {
  const { activePolicy, isLoading } = useUserPolicy();

  // If we are still checking their policy status, show a loader
  if (isLoading) {
    return (
      <div className="page-loader">
        <span className="loader-text text-mono">VERIFYING_CREDENTIALS</span>
      </div>
    );
  }

  // State Permanent Lock: One-Time Registration Guard
  // If the user already has an active policy, lock them out of the buying flow
  // and funnel them into the Command Center's Policy Vault
  if (activePolicy) {
    return <Navigate to="/policy" replace />;
  }

  return <RegistrationWizard />;
}
