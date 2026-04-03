import { Navigate } from 'react-router-dom';
import RegistrationWizard from '../modules/policy-center/components/RegistrationWizard';
import { useUserPolicy } from '../hooks/useUserPolicy';

/**
 * Register Page — Policy Center Entry Point
 * Routes: /register
 */
export default function Register() {
  const { activePolicy, isLoading } = useUserPolicy();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <span className="text-sm font-medium text-[#1A3C5E]">Verifying credentials...</span>
      </div>
    );
  }

  if (activePolicy) {
    return <Navigate to="/policy" replace />;
  }

  return <RegistrationWizard />;
}
