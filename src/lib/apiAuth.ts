// Authentication utilities for Next.js API routes
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

// JWT Configuration
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'kb_portal_jwt_secret_key_2026';
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION_HOURS = 24;

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'afe2026';

export interface JWTPayload {
  username: string;
  exp: number;
  iat: number;
}

/**
 * Generate a JWT token for the given username
 */
export function generateJWTToken(username: string): string {
  const payload = {
    username: username,
    exp: Math.floor(Date.now() / 1000) + (JWT_EXPIRATION_HOURS * 3600),
    iat: Math.floor(Date.now() / 1000),
  };
  
  return jwt.sign(payload, JWT_SECRET_KEY, { algorithm: JWT_ALGORITHM });
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWTToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY, { algorithms: [JWT_ALGORITHM] }) as JWTPayload;
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractTokenFromHeader(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware to require authentication for API routes
 */
export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: JWTPayload) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'No authorization token provided' });
    }
    
    const payload = verifyJWTToken(token);
    
    if (!payload) {
      return res.status(401).json({ authenticated: false, error: 'Invalid or expired token' });
    }
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ authenticated: false, error: 'Token expired' });
    }
    
    // Call the handler with authenticated user
    return handler(req, res, payload);
  };
}

/**
 * Login handler for API routes
 */
export async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Check credentials (in production, use proper authentication)
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateJWTToken(username);
      
      return res.status(200).json({
        success: true,
        token: token,
        username: username,
        expiresIn: JWT_EXPIRATION_HOURS * 3600, // seconds
      });
    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Verify token handler for API routes
 */
export async function handleVerify(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const token = extractTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({ authenticated: false, error: 'No authorization token provided' });
  }
  
  const payload = verifyJWTToken(token);
  
  if (!payload) {
    return res.status(401).json({ authenticated: false, error: 'Invalid or expired token' });
  }
  
  return res.status(200).json({
    authenticated: true,
    username: payload.username,
  });
}

/**
 * Logout handler for API routes
 */
export async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // For JWT, logout is handled client-side by removing the token
  // This endpoint just confirms the logout action
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}