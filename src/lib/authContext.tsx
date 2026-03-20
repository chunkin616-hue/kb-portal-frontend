import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, AuthUser, logout as authLogout } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuthentication: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthentication = async () => {
    setLoading(true);
    const authState = await checkAuth();
    setIsAuthenticated(authState.isAuthenticated);
    setUser(authState.user);
    setLoading(false);
  };

  const logout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setUser(null);
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, logout, checkAuthentication }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
