import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation - accept any credentials for now
    if (form.username && form.password) {
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('kb_token', 'demo-token');
      localStorage.setItem('kb_user', JSON.stringify({
        id: '1',
        username: form.username,
        email: `${form.username}@example.com`
      }));
      router.push('/');
    } else {
      setError('Please enter username and password');
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
