import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check localStorage first
      const token = localStorage.getItem('kb_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Verify with backend session
      const response = await fetch('/backend/', {
        credentials: 'include',
      });

      // If we get redirected to login, session is invalid
      if (response.url.includes('/login') || response.status === 302) {
        localStorage.removeItem('kb_token');
        localStorage.removeItem('kb_user');
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (e) {
      console.error('Auth check failed:', e);
      localStorage.removeItem('kb_token');
      localStorage.removeItem('kb_user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f6fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '10px' }}>📚</div>
          <div style={{ color: '#7f8c8d' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Logout function
export const logout = async () => {
  try {
    await fetch('/backend/logout', {
      credentials: 'include',
    });
  } catch (e) {
    console.error('Logout error:', e);
  }
  localStorage.removeItem('kb_token');
  localStorage.removeItem('kb_user');
  window.location.href = '/login';
};

// Get current user
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('kb_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Check if authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('kb_token');
};