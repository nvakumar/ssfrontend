// Removed 'React' import as it's not directly used for React.useState etc.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // If the auth state is still loading, show a simple loading message
  // This prevents a flicker from the protected page to the login page
  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            Loading...
        </div>
    );
  }

  // If loading is finished and there's a user, show the nested routes (e.g., the FeedPage)
  // The <Outlet /> component renders the child route element.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
