// Authentication utilities for KB Portal Frontend (JWT-based)

// Use Next.js API routes (same origin)
const API_BASE_URL = ''; // Empty string for same-origin requests

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  username?: string;
  expiresIn?: number;
  error?: string;
}

// JWT token storage key
const TOKEN_KEY = 'kb_jwt_token';
const USER_KEY = 'kb_user';

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Check if user is authenticated using JWT
export async function checkAuth(): Promise<AuthState> {
  const token = getToken();
  
  if (!token) {
    return { isAuthenticated: false, user: null };
  }
  
  try {
    const response = await fetch(`/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isAuthenticated: data.authenticated,
        user: data.authenticated ? { id: '1', username: data.username } : null,
      };
    }
    
    // Token invalid or expired - clean up
    removeToken();
    return { isAuthenticated: false, user: null };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { isAuthenticated: false, user: null };
  }
}

// Login function - authenticates with backend using JWT
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data: LoginResponse = await response.json();
    
    if (response.ok && data.success && data.token) {
      // Store JWT token in localStorage
      setToken(data.token);
      
      // Store user info in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify({
        id: '1',
        username: username,
      }));
      
      return { success: true };
    }
    
    return { success: false, error: data.error || 'Invalid username or password' };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

// Logout function
export async function logout(): Promise<void> {
  const token = getToken();
  
  // Notify backend (optional - JWT is stateless)
  try {
    await fetch(`/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear localStorage
  removeToken();
  localStorage.removeItem(USER_KEY);
}

// Get stored user from localStorage
export function getStoredUser(): AuthUser | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Authenticated fetch wrapper for API calls
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If unauthorized, redirect to login
  if (response.status === 401) {
    // Clear any stored auth data
    removeToken();
    localStorage.removeItem(USER_KEY);
    
    // Redirect to login (only in browser)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  return response;
}

// Authenticated GraphQL fetch wrapper (not used in new architecture)
export async function authenticatedGraphQLFetch(query: string, variables?: object): Promise<Response> {
  return authenticatedFetch(`/graphql`, {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
  });
}
