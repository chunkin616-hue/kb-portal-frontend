import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AuthGuard from '@/components/AuthGuard';
import { sanitizeInput } from '@/lib/sanitize';

interface FormErrors {
  name?: string;
  description?: string;
}

export default function NewCategory() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    parentId: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Name validation
    const name = form.name.trim();
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }
    
    // Description validation (optional)
    if (form.description) {
      const descCheck = sanitizeInput(form.description);
      if (descCheck !== form.description) {
        newErrors.description = 'Description contains potentially unsafe characters';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    const parentId = form.parentId ? parseInt(form.parentId) : null;
    const sanitizedName = sanitizeInput(form.name);
    const sanitizedDescription = sanitizeInput(form.description);
    
    // GraphQL mutation with variables
    const mutation = `mutation CreateCategory(
      $name: String!,
      $description: String,
      $parentId: Int
    ) {
      createCategory(
        name: $name,
        description: $description,
        parentId: $parentId
      ) {
        category {
          id
          name
        }
      }
    }`;
    
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: mutation,
          variables: {
            name: sanitizedName,
            description: sanitizedDescription,
            parentId: parentId
          }
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        alert('Error creating category: ' + data.errors[0].message);
        return;
      }
      
      if (data.data?.createCategory) {
        router.push('/categories');
      }
    } catch (e) {
      console.error('Error creating category:', e);
      alert('Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>New Category - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1>📚 KB Portal</h1>
        <div>
          <Link href="/categories" className="btn">Back to Categories</Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <h2>Create New Category</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                required
                minLength={2}
                maxLength={100}
                placeholder="Enter category name"
                className={errors.name ? 'error-input' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                rows={5}
                placeholder="Enter category description..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontFamily: 'inherit' }}
                className={errors.description ? 'error-input' : ''}
              />
              {errors.description && <span className="error-text">{errors.description}</span>}
            </div>
            
            <div className="form-group">
              <label>Parent Category (Optional)</label>
              <input
                type="number"
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                placeholder="Parent category ID"
                min="1"
              />
              <small style={{ color: '#7f8c8d', display: 'block', marginTop: '5px' }}>
                Leave empty for top-level category
              </small>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creating...' : 'Create Category'}
              </button>
              <Link href="/categories" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .header {
          background: white;
          padding: 15px 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header h1 {
          color: #2c3e50;
          font-size: 20px;
        }
        
        .container {
          max-width: 900px;
          margin: 30px auto;
          padding: 0 20px;
        }
        
        .card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .card h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 18px;
        }
        
        .btn {
          padding: 10px 20px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
        
        .btn:hover {
          background: #2980b9;
        }
        
        .btn:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: #95a5a6;
        }
        
        .btn-secondary:hover {
          background: #7f8c8d;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .error-input {
          border-color: #e74c3c !important;
        }
        
        .error-text {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }
        
        small {
          font-size: 12px;
        }
      `}</style>
    </AuthGuard>
  );
}