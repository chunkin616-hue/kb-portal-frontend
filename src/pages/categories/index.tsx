import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
}

// Use Next.js API routes (same origin)
const API_BASE_URL = '';

// Helper function to escape HTML to prevent XSS
const escapeHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export default function Categories() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

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
      
      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        setCategories(data);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/categories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description
        }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        setShowForm(false);
        fetchCategories();
      } else {
        const errorData = await response.json();
        console.error('Error creating category:', errorData.error);
      }
    } catch (e) {
      console.error('Error creating category:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Show loading while checking auth
  if (loading) {
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
        <title>Categories - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.username || 'Admin'}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#e74c3c', marginRight: '10px' }}>
            Logout
          </button>
          <Link href="/" className="btn">Dashboard</Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Categories</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn">
              {showForm ? 'Cancel' : 'New Category'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateCategory} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn">Create Category</button>
            </form>
          )}
          
          {dataLoading ? (
            <p className="loading">Loading...</p>
          ) : categories.length === 0 ? (
            <p>No categories yet. Create your first category!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Parent ID</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{escapeHtml(category.name)}</td>
                    <td>{escapeHtml(category.description) || '-'}</td>
                    <td>{category.parentId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
