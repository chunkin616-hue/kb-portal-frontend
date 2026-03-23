import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

interface Stats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  archivedArticles: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
}

export default function Stats() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    archivedArticles: 0,
    totalCategories: 0,
    totalTags: 0,
    totalViews: 0,
  });
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
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/stats`, {
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
      
      if (!response.ok) {
        console.error('Failed to fetch stats:', response.status);
        return;
      }
      
      const data = await response.json();
      setStats({
        totalArticles: data.totalArticles || 0,
        publishedArticles: data.publishedArticles || 0,
        draftArticles: data.draftArticles || 0,
        archivedArticles: data.archivedArticles || 0,
        totalCategories: data.totalCategories || 0,
        totalTags: data.totalTags || 0,
        totalViews: data.totalViews || 0,
      });
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setDataLoading(false);
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

  const statCards = [
    { label: 'Total Articles', value: stats.totalArticles, icon: '📄', color: '#3498db' },
    { label: 'Published', value: stats.publishedArticles, icon: '✅', color: '#27ae60' },
    { label: 'Drafts', value: stats.draftArticles, icon: '📝', color: '#f39c12' },
    { label: 'Archived', value: stats.archivedArticles, icon: '📦', color: '#95a5a6' },
    { label: 'Categories', value: stats.totalCategories, icon: '📁', color: '#9b59b6' },
    { label: 'Tags', value: stats.totalTags, icon: '🏷️', color: '#e74c3c' },
    { label: 'Total Views', value: stats.totalViews, icon: '👁️', color: '#1abc9c' },
  ];

  return (
    <>
      <Head>
        <title>Statistics - KB Portal</title>
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
          <div style={{ marginBottom: '20px' }}>
            <h2>System Statistics</h2>
            <p style={{ color: '#666', marginTop: '5px' }}>
              Overview of your Knowledge Base portal
            </p>
          </div>
          
          {dataLoading ? (
            <p className="loading">Loading...</p>
          ) : (
            <>
              <div className="stats">
                {statCards.map((card) => (
                  <div key={card.label} className="stat-card">
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>{card.icon}</div>
                    <h3 style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>{card.label}</h3>
                    <div className="number" style={{ fontSize: '36px', color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
                <h3 style={{ marginBottom: '15px' }}>Content Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Article Status Breakdown</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '8px', background: '#ecf0f1', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${stats.totalArticles > 0 ? (stats.publishedArticles / stats.totalArticles * 100) : 0}%`, 
                          height: '100%', 
                          background: '#27ae60' 
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {stats.totalArticles > 0 ? Math.round(stats.publishedArticles / stats.totalArticles * 100) : 0}% published
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Articles per Category</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                      {stats.totalCategories > 0 ? (stats.totalArticles / stats.totalCategories).toFixed(1) : '0'}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>avg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Tags per Article</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {stats.totalArticles > 0 ? (stats.totalTags / stats.totalArticles).toFixed(1) : '0'}
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666', marginLeft: '5px' }}>avg</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
