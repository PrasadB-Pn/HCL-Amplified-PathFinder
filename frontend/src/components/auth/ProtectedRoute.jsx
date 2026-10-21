import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{ backgroundColor: '#171714' }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C89B5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#77766F]">Loading RouteMaster...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but onboarding not complete, redirect to onboarding
  // (except if already on onboarding page)
  if (
    currentUser &&
    !currentUser.onboarding_completed &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
