import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

interface Category {
  id: number;
  name: string;
}

// Use Next.js API routes (same origin)
const API_BASE_URL = '';

export default function NewArticle() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    status: 'draft',
    tags: '',
    author: 'admin',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        setCategories(data);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryId = form.categoryId ? parseInt(form.categoryId) : null;
    
    try {
      const response = await fetch(`/api/articles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          categoryId: categoryId,
          author: form.author,
          status: form.status,
          tags: form.tags,
        }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data && data.id) {
        router.push(`/articles/${data.id}`);
      }
    } catch (e) {
      console.error('Error creating article:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>New Article - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.username || 'Admin'}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#e74c3c', marginRight: '10px' }}>
            Logout
          </button>
          <Link href="/articles" className="btn">Back to Articles</Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <h2>Create New Article</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Enter article title"
              />
            </div>
            
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={15}
                placeholder="Write your article content here..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              {loading ? (
                <p>Loading categories...</p>
              ) : (
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="tutorial, how-to, setup"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn">Create Article</button>
              <Link href="/articles" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
