import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Betöltés...</div>;
  }

  if (!user) {
    return <Navigate to="/soulmind-login-2025" replace />;
  }

  return children;
};

export default ProtectedRoute;
