import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  followers?: string[];
  following?: string[];
  resumeUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.profilePictureUrl && !parsedUser.avatar) {
          parsedUser.avatar = parsedUser.profilePictureUrl;
        }
        setUser(parsedUser);
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Option 1: Sync localStorage with state on changes:
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [user, token]);

  // login and logout just update state
  const login = (userData: User, token: string) => {
    const userToStore = { ...userData };
    if (userToStore.profilePictureUrl && !userToStore.avatar) {
      userToStore.avatar = userToStore.profilePictureUrl;
    }
    setUser(userToStore);
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({ user, token, login, logout, isLoading }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
