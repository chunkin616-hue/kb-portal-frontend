import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

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

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    status: 'draft',
    tags: '',
  });

  // Redirect to login if not authenticated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchArticle();
      fetchCategories();
    }
  }, [id, isAuthenticated]);

  // Decode base64 GraphQL ID to numeric
  const decodeId = (id: string | string[] | undefined): number => {
    if (!id) return 0;
    if (Array.isArray(id)) id = id[0];
    try {
      // GraphQL uses base64 encoding: "ArticleObject:1" -> "QXJ0aWNsZU9iamVjdDox"
      const decoded = Buffer.from(id, 'base64').toString();
      const parts = decoded.split(':');
      return parseInt(parts[parts.length - 1], 10);
    } catch {
      return parseInt(id, 10);
    }
  };

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
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
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
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        setIsEditing(false);
        fetchArticle();
      }
    } catch (e) {
      console.error('Error updating article:', e);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
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
      
      // Handle 204 No Content (successful deletion)
      if (response.status === 204) {
        console.log('Article deleted successfully!');
        router.push('/articles');
        return;
      }
      
      // Handle other responses
      const data = await response.json();
      
      if (data && data.success) {
        console.log('Article deleted successfully!');
        router.push('/articles');
      }
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
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
        <title>{escapeHtml(article.title) || 'Article'} - KB Portal</title>
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
        {isEditing ? (
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
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={10}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                />
              </div>
              <button type="submit" className="btn">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{escapeHtml(article.title) || 'Untitled'}</h1>
                <div style={{ color: '#7f8c8d', fontSize: '14px' }}>
                  <span>By {article.author || 'Unknown'}</span>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span>Updated: {formatDate(article.updatedAt)}</span>
                  <span style={{ margin: '0 10px' }}>|</span>
                  <span className={`status ${article.status || 'draft'}`}>{article.status || 'draft'}</span>
                </div>
              </div>
              <div>
                <button onClick={() => setIsEditing(true)} className="btn">Edit</button>
                <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger" style={{ marginLeft: '10px' }}>Delete</button>
              </div>
            </div>
            
            {article.tags && (
              <div style={{ marginBottom: '20px' }}>
                {article.tags.split(',').map((tag, i) => (
                  <span key={i} style={{ 
                    display: 'inline-block', 
                    background: '#e2e3e5', 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    marginRight: '5px'
                  }}>
                    {escapeHtml(tag.trim())}
                  </span>
                ))}
              </div>
            )}
            
            <div style={{ 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '5px',
              whiteSpace: 'pre-wrap',
              minHeight: '200px'
            }}>
              {article.content || 'No content yet.'}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h2 style={{
              margin: '0 0 12px',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
            }}>
              確認刪除
            </h2>
            <p style={{
              margin: '0 0 24px',
              fontSize: '15px',
              color: '#6b7280',
              lineHeight: '1.5',
            }}>
              你確定要刪除呢篇文章嗎？
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
