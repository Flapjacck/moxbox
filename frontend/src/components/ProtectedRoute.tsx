import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../features/auth/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * ========================
 * Wraps routes that require authentication.
 * Redirects to login page if user is not authenticated.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
