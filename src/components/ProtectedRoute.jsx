import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();

  // Wait for Firebase auth to resolve before making redirect decision
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-['Inter',sans-serif]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[#1A3C5E]/20" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-[#1A3C5E] border-t-transparent animate-spin" />
          </div>
          <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}
