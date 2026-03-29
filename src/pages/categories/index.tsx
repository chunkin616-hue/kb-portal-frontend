import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/lib/authContext';
import ConfirmModal from '@/components/ConfirmModal';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  createdAt?: string;
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; categoryId: number | null }>({ show: false, categoryId: null });

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
    setError('');
    
    try {
      const response = await fetch(`/api/categories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kb_jwt_token') || ''}`,
        },
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim()
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
        setError(errorData.error || 'Failed to create category');
      }
    } catch (e) {
      console.error('Error creating category:', e);
      setError('Failed to create category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditForm({ name: category.name, description: category.description || '' });
    setError('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setError('');
    
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
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
      
      // Handle unauthorized
      if (response.status === 401) {
        logout();
        return;
      }
      
      if (response.ok) {
        setEditingCategory(null);
        setEditForm({ name: '', description: '' });
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update category');
      }
    } catch (e) {
      console.error('Error updating category:', e);
      setError('Failed to update category');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditForm({ name: '', description: '' });
    setError('');
  };

  const handleDeleteCategory = async () => {
    const categoryId = deleteModal.categoryId;
    if (!categoryId) return;
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
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
      
      if (response.ok || response.status === 204) {
        fetchCategories();
      } else {
        const errorData = await response.json();
        console.error(errorData.error || 'Failed to delete category');
      }
    } catch (e) {
      console.error('Error deleting category:', e);
      console.error('Failed to delete category');
    } finally {
      setDeleteModal({ show: false, categoryId: null });
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
            <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn">
              {showForm ? 'Cancel' : 'New Category'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateCategory} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Programming, DevOps, Documentation"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Optional description"
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{escapeHtml(category.name)}</td>
                    <td>{escapeHtml(category.description) || '-'}</td>
                    <td>{category.parentId || '-'}</td>
                    <td>
                      <button 
                        onClick={() => handleEditCategory(category)} 
                        className="btn"
                        style={{ background: '#3498db', marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteModal({ show: true, categoryId: category.id })} 
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
        {editingCategory && (
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
              <h3>Edit Category</h3>
              <form onSubmit={handleUpdateCategory}>
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
                  <button type="submit" className="btn">Update Category</button>
                  <button type="button" onClick={handleCancelEdit} className="btn" style={{ background: '#95a5a6' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        show={deleteModal.show}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteModal({ show: false, categoryId: null })}
        danger
      />
    </>
  );
}
