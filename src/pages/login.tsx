import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { login, getStoredUser } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if already logged in
  if (typeof window !== 'undefined') {
    const user = getStoredUser();
    if (user) {
      router.push('/');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Authenticate with backend
    const result = await login(form.username, form.password);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - KB Portal</title>
      </Head>
      
      <div className="login-container">
        <div className="login-box">
          <h1>📚 KB Portal</h1>
          <h2>Login</h2>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/">Back to Dashboard</Link>
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
        }
        
        .login-box {
          background: var(--card-bg);
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        
        .login-box h1 {
          text-align: center;
          color: var(--secondary);
          margin-bottom: 10px;
        }
        
        .login-box h2 {
          text-align: center;
          color: var(--text-light);
          margin-bottom: 30px;
          font-size: 18px;
        }
      `}</style>
    </>
  );
}
