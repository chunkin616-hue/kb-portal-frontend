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

export default function Articles() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchArticles();
    }
  }, [isAuthenticated]);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`/api/articles`, {
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
        setArticles(data);
      }
    } catch (e) {
      console.error('Error fetching articles:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = searchQuery === '' || 
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === '' || article.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <title>Articles - KB Portal</title>
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
          <h2>Articles</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <Link href="/articles/new" className="btn">New Article</Link>
          </div>
          
          {dataLoading ? (
            <p className="loading">Loading...</p>
          ) : filteredArticles.length === 0 ? (
            <p>No articles found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Tags</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <Link href={`/articles/${article.id}`}>{escapeHtml(article.title) || 'Untitled'}</Link>
                    </td>
                    <td>{article.author || '-'}</td>
                    <td>
                      <span className={`status ${article.status || 'draft'}`}>
                        {article.status || 'draft'}
                      </span>
                    </td>
                    <td>{article.viewCount || 0}</td>
                    <td>{article.tags || '-'}</td>
                    <td>{formatDate(article.updatedAt)}</td>
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
