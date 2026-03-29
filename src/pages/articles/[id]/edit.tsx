import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';
import ConfirmModal from '@/components/ConfirmModal';

interface Category {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  status: string;
  tags: string;
  viewCount: number;
  categoryId: number | null;
  createdAt: string;
  updatedAt: string;
}

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

export default function ArticleEdit() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    status: 'draft',
    tags: '',
  });
  const [deleteModal, setDeleteModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (router.isReady && isAuthenticated && id) {
      fetchArticle();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id, isAuthenticated]);

  const fetchArticle = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.status === 404) {
        console.error('Article not found');
        router.push('/articles');
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        setArticle(data);
        setEditForm({
          title: data.title || '',
          content: data.content || '',
          categoryId: data.categoryId?.toString() || '',
          status: data.status || 'draft',
          tags: data.tags || '',
        });
      }
    } catch (e) {
      console.error('Error fetching article:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/categories`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
      });
      
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
      setCategoriesLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const categoryId = editForm.categoryId ? parseInt(editForm.categoryId) : null;
    
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          categoryId: categoryId,
          status: editForm.status,
          tags: editForm.tags,
        }),
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        console.log('Article updated successfully!');
        router.push(`/articles/${id}`);
      }
    } catch (e) {
      console.error('Error updating article:', e);
      console.error('Failed to update article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.status === 204) {
        console.log('Article deleted successfully!');
        router.push('/articles');
        return;
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        console.log('Article deleted successfully!');
        router.push('/articles');
      }
    } catch (e) {
      console.error('Error deleting article:', e);
    } finally {
      setDeleteModal(false);
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

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading... - KB Portal</title>
        </Head>
        <div className="loading">Loading...</div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Head>
          <title>Not Found - KB Portal</title>
        </Head>
        <div className="header">
          <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
          <div>
            <button onClick={handleLogout} className="btn" style={{ background: '#e74c3c', marginRight: '10px' }}>
              Logout
            </button>
            <Link href="/" className="btn">Dashboard</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: '30px' }}>
          <div className="card">
            <h2>Article Not Found</h2>
            <Link href="/articles">Back to Articles</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Edit: {escapeHtml(article.title) || 'Article'} - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.username || 'Admin'}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#e74c3c', marginRight: '10px' }}>
            Logout
          </button>
          <Link href={`/articles/${id}`} className="btn">Back to Article</Link>
          <Link href="/articles" className="btn" style={{ marginLeft: '10px' }}>Articles List</Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <h2>Edit Article</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
            </div>
            
            <div className="form-group">
              <label>Content</label>
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={15}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontFamily: 'monospace' }}
              />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              {categoriesLoading ? (
                <p>Loading categories...</p>
              ) : (
                <select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href={`/articles/${id}`} className="btn btn-secondary">
                Cancel
              </Link>
              <button 
                type="button" 
                onClick={() => setDeleteModal(true)} 
                className="btn btn-danger" 
                style={{ marginLeft: 'auto' }}
              >
                Delete Article
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        show={deleteModal}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
        danger
      />
    </>
  );
}
