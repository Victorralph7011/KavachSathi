import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth(); // Assuming AuthProvider has a global loading state, or we just rely on currentUser

  // If AuthContext resolves very quickly, we might not need a loader here, 
  // but if we do, we can show a quick terminal dot.
  // For now, if no user, boot to login immediately.
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}
