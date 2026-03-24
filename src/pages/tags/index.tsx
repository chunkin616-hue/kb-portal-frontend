import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';

interface Tag {
  id: number;
  name: string;
  description: string;
  createdAt: string;
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

export default function Tags() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTags();
    }
  }, [isAuthenticated]);

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/tags`, {
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
        console.error('Failed to fetch tags:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        setTags(data);
      }
    } catch (e) {
      console.error('Error fetching tags:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/tags`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          name: newTag.name,
          description: newTag.description
        }),
      });
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setNewTag({ name: '', description: '' });
        setShowForm(false);
        fetchTags();
      } else {
        const errorData = await response.json();
        console.error('Error creating tag:', errorData.error);
        alert('Error creating tag: ' + (errorData.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error creating tag:', e);
    }
  };

  const handleDeleteClick = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;
    
    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
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
        setShowDeleteModal(false);
        setTagToDelete(null);
        fetchTags();
        return;
      }
      
      // Handle other error responses
      const errorData = await response.json();
      setDeleteError(errorData.error || 'Failed to delete tag');
      
    } catch (e) {
      console.error('Error deleting tag:', e);
      setDeleteError('Failed to delete tag. Please try again.');
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
        <title>Tags - KB Portal</title>
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
            <h2>Tags</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn">
              {showForm ? 'Cancel' : 'New Tag'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateTag} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn">Create Tag</button>
            </form>
          )}
          
          {dataLoading ? (
            <p className="loading">Loading...</p>
          ) : tags.length === 0 ? (
            <p>No tags yet. Create your first tag!</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.id}</td>
                    <td>{escapeHtml(tag.name)}</td>
                    <td>{escapeHtml(tag.description) || '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteClick(tag)} 
                        className="btn btn-danger"
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tagToDelete && (
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
              你確定要刪除「{escapeHtml(tagToDelete.name)}」這個標籤嗎？
            </p>
            {deleteError && (
              <p style={{
                margin: '0 0 16px',
                fontSize: '14px',
                color: '#dc2626',
              }}>
                {deleteError}
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTagToDelete(null);
                  setDeleteError('');
                }}
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
