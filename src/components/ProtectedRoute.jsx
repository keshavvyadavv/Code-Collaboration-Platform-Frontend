import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;
  if (!isLoggedIn()) return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

export function DeveloperRoute({ children }) {
  const { isDeveloper, isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isDeveloper()) return <Navigate to="/dashboard" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner spinner-lg" /></div>;
  if (isLoggedIn()) return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  return children;
}
