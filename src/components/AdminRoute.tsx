import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      setIsChecking(false);
    }
  }, [loading, user]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-primary"></div>
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    // If not admin, redirect to home page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
