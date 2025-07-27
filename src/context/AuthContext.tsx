import React, { createContext, useContext, useState, useEffect } from 'react'; // Keep React import for hooks
import type { ReactNode } from 'react'; // Import ReactNode as a type

// Define the shape of the user object
interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePictureUrl?: string; // Explicitly include profilePictureUrl from backend
  avatar?: string; // Alias for profilePictureUrl for frontend consistency
  bio?: string;
  skills?: string[];
  followers?: string[];
  following?: string[];
  resumeUrl?: string;
}

// Define the shape of the context state
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the context with a default value of undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load

  // On initial load, try to get user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        // Ensure the storedUser is parsed correctly and includes all User properties
        const parsedUser: User = JSON.parse(storedUser);
        // Map profilePictureUrl to avatar for consistency in frontend components
        if (parsedUser.profilePictureUrl && !parsedUser.avatar) {
          parsedUser.avatar = parsedUser.profilePictureUrl;
        }
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function: saves user and token to state and localStorage
  const login = (userData: User, token: string) => {
    // Ensure that when logging in, profilePictureUrl is mapped to avatar
    const userToStore = { ...userData };
    if (userToStore.profilePictureUrl && !userToStore.avatar) {
      userToStore.avatar = userToStore.profilePictureUrl;
    }
    setUser(userToStore);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userToStore));
    localStorage.setItem('token', token);
  };

  // Logout function: clears state and localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // The value that will be provided to all consuming components
  const value = { user, token, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to easily use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
