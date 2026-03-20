import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

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

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const query = `query {
        allArticles(first: 100) {
          edges {
            node {
              id
              title
              content
              author
              status
              tags
              viewCount
              categoryId
              createdAt
              updatedAt
            }
          }
        }
      }`;
      
      const response = await fetch('http://192.168.140.149:5003/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      
      if (data.data?.allArticles?.edges) {
        setArticles(data.data.allArticles.edges.map((edge: any) => edge.node));
      }
    } catch (e) {
      console.error('Error fetching articles:', e);
    } finally {
      setLoading(false);
    }
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

  return (
    <>
      <Head>
        <title>Articles - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
        <div>
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
          
          {loading ? (
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
                      <Link href={`/articles/${article.id}`}>{article.title || 'Untitled'}</Link>
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
