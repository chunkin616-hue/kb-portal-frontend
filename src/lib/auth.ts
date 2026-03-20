// Authentication utilities for KB Portal Frontend

const API_BASE_URL = 'http://192.168.140.149:5003';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

// Check if user is authenticated
export async function checkAuth(): Promise<AuthState> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
      credentials: 'include', // Important: include cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isAuthenticated: data.authenticated,
        user: data.authenticated ? { id: '1', username: data.username } : null,
      };
    }
    
    return { isAuthenticated: false, user: null };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Login function - authenticates with backend
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Check if login was successful (redirects to / on success)
    if (response.ok || response.redirected) {
      // Verify by checking auth status
      const authState = await checkAuth();
      if (authState.isAuthenticated) {
        // Store username in localStorage for display
        localStorage.setItem('kb_user', JSON.stringify({
          id: '1',
          username: username,
        }));
        return { success: true };
      }
    }
    
    return { success: false, error: 'Invalid username or password' };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

// Logout function
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear localStorage
  localStorage.removeItem('kb_token');
  localStorage.removeItem('kb_user');
}

// Get stored user from localStorage
export function getStoredUser(): AuthUser | null {
  const userStr = localStorage.getItem('kb_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Authenticated fetch wrapper for GraphQL
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  
  // If unauthorized, redirect to login
  if (response.status === 401) {
    // Clear any stored auth data
    localStorage.removeItem('kb_token');
    localStorage.removeItem('kb_user');
    // Redirect to login (only in browser)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return response;
}
