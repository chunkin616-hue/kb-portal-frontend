import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

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

const API_BASE_URL = 'http://192.168.140.149:5003';

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
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
      const numericId = decodeId(id);
      const response = await fetch(`${API_BASE_URL}/api/articles?id=${numericId}`, {
        credentials: 'include',
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const art = data[0];
        setArticle(art);
        setEditForm({
          title: art.title || '',
          content: art.content || '',
          status: art.status || 'draft',
          tags: art.tags || '',
        });
      }
    } catch (e) {
      console.error('Error fetching article:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mutation = `mutation {
      updateArticle(
        id: decodeId(id),
        title: "${editForm.title}",
        content: "${editForm.content.replace(/"/g, '\\"')}",
        status: "${editForm.status}",
        tags: "${editForm.tags}"
      ) {
        article {
          id
          title
        }
      }
    }`;
    
    try {
      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: mutation }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.data?.updateArticle) {
        setIsEditing(false);
        fetchArticle();
      }
    } catch (e) {
      console.error('Error updating article:', e);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    const mutation = `mutation {
      deleteArticle(id: decodeId(id)) {
        success
      }
    }`;
    
    try {
      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: mutation }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.data?.deleteArticle?.success) {
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
        <title>{article.title || 'Article'} - KB Portal</title>
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
                <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{article.title || 'Untitled'}</h1>
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
                <button onClick={handleDelete} className="btn btn-danger" style={{ marginLeft: '10px' }}>Delete</button>
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
                    {tag.trim()}
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
    </>
  );
}
