/**
 * Whitebox unit tests for auth.ts
 * Tests JWT token generation, verification, and extraction logic
 */

// ---- Client-side localStorage auth helpers ----

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value }),
    removeItem: jest.fn((key: string) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ---- Mock server-side dependencies ----
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload: object, secret: string, opts: object) => 'mock.jwt.token'),
  verify: jest.fn((token: string, secret: string, opts: object) => ({
    username: 'testuser',
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  })),
}))

jest.mock('next', () => ({
  NextApiRequest: class {},
  NextApiResponse: class {},
}))

// Import after mocks
import {
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  generateJWTToken,
  verifyJWTToken,
  extractTokenFromHeader,
  JWT_SECRET_KEY,
  JWT_EXPIRATION_HOURS,
} from '../auth'

describe('Client-side auth helpers', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(getToken()).toBeNull()
    })

    it('should return token from localStorage when present', () => {
      localStorageMock.setItem('kb_jwt_token', 'abc123')
      expect(getToken()).toBe('abc123')
    })
  })

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      setToken('xyz789')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('kb_jwt_token', 'xyz789')
    })
  })

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      localStorageMock.setItem('kb_jwt_token', 'abc123')
      removeToken()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kb_jwt_token')
    })
  })

  describe('getStoredUser', () => {
    it('should return null when no user is stored', () => {
      expect(getStoredUser()).toBeNull()
    })

    it('should parse and return stored user object', () => {
      const user = { id: '1', username: 'admin' }
      localStorageMock.setItem('kb_user', JSON.stringify(user))
      expect(getStoredUser()).toEqual(user)
    })

    it('should return null for invalid JSON in storage', () => {
      localStorageMock.setItem('kb_user', 'not-valid-json')
      expect(getStoredUser()).toBeNull()
    })
  })
})

describe('Server-side JWT utilities (whitebox)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateJWTToken', () => {
    it('should call jwt.sign with correct parameters', () => {
      const jwt = require('jsonwebtoken')
      const token = generateJWTToken('admin')
      expect(jwt.sign).toHaveBeenCalled()
      const call = (jwt.sign as jest.Mock).mock.calls[0]
      expect(call[0].username).toBe('admin')
      expect(call[0].exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
      expect(call[1]).toBe(JWT_SECRET_KEY)
    })

    it('should set expiration to 24 hours', () => {
      const jwt = require('jsonwebtoken')
      generateJWTToken('testuser')
      const call = (jwt.sign as jest.Mock).mock.calls[0]
      const exp = call[0].exp
      const iat = call[0].iat
      expect(exp - iat).toBe(JWT_EXPIRATION_HOURS * 3600)
    })
  })

  describe('verifyJWTToken', () => {
    it('should return decoded payload when token is valid', () => {
      const result = verifyJWTToken('valid.token.here')
      expect(result).not.toBeNull()
      expect(result?.username).toBe('testuser')
    })

    it('should return null when token is invalid', () => {
      const jwt = require('jsonwebtoken')
      ;(jwt.verify as jest.Mock).mockImplementationOnce(() => { throw new Error('invalid') })
      expect(verifyJWTToken('bad.token')).toBeNull()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should return null when no authorization header', () => {
      const req = { headers: {} }
      expect(extractTokenFromHeader(req as any)).toBeNull()
    })

    it('should return null when authorization header is not Bearer format', () => {
      const req = { headers: { authorization: 'Basic abc123' } }
      expect(extractTokenFromHeader(req as any)).toBeNull()
    })

    it('should return null when authorization header has wrong number of parts', () => {
      const req = { headers: { authorization: 'Bearer' } }
      expect(extractTokenFromHeader(req as any)).toBeNull()
    })

    it('should extract token from valid Bearer header', () => {
      const req = { headers: { authorization: 'Bearer mytoken123' } }
      expect(extractTokenFromHeader(req as any)).toBe('mytoken123')
    })

    it('should be case-insensitive for Bearer keyword', () => {
      const req = { headers: { authorization: 'bearer mytoken456' } }
      expect(extractTokenFromHeader(req as any)).toBe('mytoken456')
    })
  })
})
