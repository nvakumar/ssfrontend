// No React import needed if using React 17+ with "jsx": "react-jsx" in tsconfig.json
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // Show a loading screen while auth status is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  // If user is authenticated, render nested routes inside this ProtectedRoute
  // Otherwise, redirect to the login page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
