import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

interface Stats {
  totalArticles: number;
  publishedArticles: number;
  totalCategories: number;
  totalTags: number;
}

interface Article {
  id: number;
  title: string;
  author: string;
  status: string;
  updatedAt: string;
  categoryId: number | null;
}

const API_BASE_URL = 'http://localhost:5004';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout, checkAuthentication } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    publishedArticles: 0,
    totalCategories: 0,
    totalTags: 0,
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchRecentArticles();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const query = `query {
        allArticles { edges { node { id status } } }
        allCategories { edges { node { id } } }
        allTags { edges { node { id } } }
      }`;
      
      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.data) {
        const articlesEdges = data.data.allArticles?.edges || [];
        const categoriesEdges = data.data.allCategories?.edges || [];
        const tagsEdges = data.data.allTags?.edges || [];
        
        // Count published articles
        const publishedCount = articlesEdges.filter((edge: any) => edge.node.status === 'published').length;
        
        setStats({
          totalArticles: articlesEdges.length,
          totalCategories: categoriesEdges.length,
          totalTags: tagsEdges.length,
          publishedArticles: publishedCount,
        });
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchRecentArticles = async () => {
    try {
      const query = `query {
        allArticles(first: 5) {
          edges {
            node {
              id
              title
              author
              status
              updatedAt
              categoryId
            }
          }
        }
      }`;
      
      const response = await fetch(`${API_BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      const data = await response.json();
      
      if (data.data?.allArticles?.edges) {
        setArticles(data.data.allArticles.edges.map((edge: any) => edge.node));
      }
    } catch (e) {
      console.error('Error fetching articles:', e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
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
        <title>KB Portal - Knowledge Base Management</title>
      </Head>
      
      <div className="header">
        <h1>📚 KB Portal</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.username || 'Admin'}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#e74c3c' }}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="stats">
          <div className="stat-card">
            <h3>Total Articles</h3>
            <div className="number">{dataLoading ? '-' : stats.totalArticles}</div>
          </div>
          <div className="stat-card">
            <h3>Published</h3>
            <div className="number">{dataLoading ? '-' : stats.publishedArticles}</div>
          </div>
          <div className="stat-card">
            <h3>Categories</h3>
            <div className="number">{dataLoading ? '-' : stats.totalCategories}</div>
          </div>
          <div className="stat-card">
            <h3>Tags</h3>
            <div className="number">{dataLoading ? '-' : stats.totalTags}</div>
          </div>
        </div>
        
        <div className="card">
          <h2>Quick Actions</h2>
          <Link href="http://localhost:5004/graphql" target="_blank" className="btn">
            <i className="fas fa-code"></i> GraphQL Playground
          </Link>
          <Link href="/articles" className="btn" style={{ marginLeft: '10px' }}>
            <i className="fas fa-list"></i> Browse Articles
          </Link>
          <Link href="/categories" className="btn" style={{ marginLeft: '10px' }}>
            <i className="fas fa-folder"></i> Categories
          </Link>
        </div>
        
        <div className="card">
          <h2>Recent Articles</h2>
          {articles.length === 0 ? (
            <p className="loading">No articles yet. Create your first article!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>{article.title || 'Untitled'}</td>
                    <td>{article.categoryId || '-'}</td>
                    <td>{article.author || '-'}</td>
                    <td>
                      <span className={`status ${article.status || 'draft'}`}>
                        {article.status || 'draft'}
                      </span>
                    </td>
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
