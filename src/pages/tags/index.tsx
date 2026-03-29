import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';
import ConfirmModal from '@/components/ConfirmModal';

interface Tag {
  id: number;
  name: string;
  description: string;
  createdAt: string;
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

export default function Tags() {
  const router = useRouter();
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; tagId: number | null }>({ show: false, tagId: null });

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
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (!response.ok) {
        console.error('Failed to fetch tags:', response.status);
        return;
      }
      
      const data = await response.json();
      setTags(data);
    } catch (e) {
      console.error('Error fetching tags:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`/api/tags`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          name: newTag.name.trim(),
          description: newTag.description.trim()
        }),
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        setNewTag({ name: '', description: '' });
        setShowForm(false);
        fetchTags();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create tag');
      }
    } catch (e) {
      console.error('Error creating tag:', e);
      setError('Failed to create tag');
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setEditForm({ name: tag.name, description: tag.description || '' });
    setError('');
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    setError('');
    
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim()
        }),
      });
      
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        setEditingTag(null);
        setEditForm({ name: '', description: '' });
        fetchTags();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update tag');
      }
    } catch (e) {
      console.error('Error updating tag:', e);
      setError('Failed to update tag');
    }
  };

  const handleDeleteTag = async () => {
    const tagId = deleteModal.tagId;
    if (!tagId) return;
    
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
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
      
      if (response.ok || response.status === 204) {
        fetchTags();
      } else {
        const errorData = await response.json();
        console.error(errorData.error || 'Failed to delete tag');
      }
    } catch (e) {
      console.error('Error deleting tag:', e);
      console.error('Failed to delete tag');
    } finally {
      setDeleteModal({ show: false, tagId: null });
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditForm({ name: '', description: '' });
    setError('');
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatDate = (dateStr: string | undefined | null) => {
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
            <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn">
              {showForm ? 'Cancel' : 'New Tag'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateTag} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="e.g., Python, API, Tutorial"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  placeholder="Optional description"
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
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.id}</td>
                    <td>{escapeHtml(tag.name)}</td>
                    <td>{escapeHtml(tag.description) || '-'}</td>
                    <td>{formatDate(tag.createdAt)}</td>
                    <td>
                      <button 
                        onClick={() => handleEditTag(tag)} 
                        className="btn"
                        style={{ background: '#3498db', marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteModal({ show: true, tagId: tag.id })} 
                        className="btn"
                        style={{ background: '#e74c3c', padding: '5px 10px', fontSize: '12px' }}
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
        
        {/* Edit Modal */}
        {editingTag && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
              <h3>Edit Tag</h3>
              <form onSubmit={handleUpdateTag}>
                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn">Update Tag</button>
                  <button type="button" onClick={handleCancelEdit} className="btn" style={{ background: '#95a5a6' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={deleteModal.show}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteTag}
        onCancel={() => setDeleteModal({ show: false, tagId: null })}
        danger
      />
    </>
  );
}
