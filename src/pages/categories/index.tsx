import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const query = `query {
        allCategories {
          edges {
            node {
              id
              name
              description
              parentId
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
      
      if (data.data?.allCategories?.edges) {
        setCategories(data.data.allCategories.edges.map((edge: any) => edge.node));
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mutation = `mutation {
      createCategory(name: "${newCategory.name}", description: "${newCategory.description}") {
        category {
          id
          name
        }
      }
    }`;
    
    try {
      const response = await fetch('http://192.168.140.149:5003/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation }),
      });
      
      const data = await response.json();
      
      if (data.data?.createCategory) {
        setNewCategory({ name: '', description: '' });
        setShowForm(false);
        fetchCategories();
      }
    } catch (e) {
      console.error('Error creating category:', e);
    }
  };

  return (
    <>
      <Head>
        <title>Categories - KB Portal</title>
      </Head>
      
      <div className="header">
        <h1><Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>📚 KB Portal</Link></h1>
        <div>
          <Link href="/" className="btn">Dashboard</Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '30px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Categories</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn">
              {showForm ? 'Cancel' : 'New Category'}
            </button>
          </div>
          
          {showForm && (
            <form onSubmit={handleCreateCategory} style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '5px' }}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn">Create Category</button>
            </form>
          )}
          
          {loading ? (
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
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '-'}</td>
                    <td>{category.parentId || '-'}</td>
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
