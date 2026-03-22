import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetCategories(req, res);
        break;
      case 'POST':
        await handleCreateCategory(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Categories API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetCategories(req: NextApiRequest, res: NextApiResponse) {
  const sql = `
    SELECT 
      id, name, description, parent_id as "parentId",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM kb_categories
    ORDER BY name
  `;
  
  const result = await query(sql);
  
  res.status(200).json(result.rows);
}

async function handleCreateCategory(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, parentId } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const sql = `
    INSERT INTO kb_categories 
      (name, description, parent_id, created_at, updated_at)
    VALUES ($1, $2, $3, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
    RETURNING 
      id, name, description, parent_id as "parentId",
      created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  const params = [
    name,
    description || '',
    parentId || null,
  ];
  
  const result = await query(sql, params);
  
  res.status(201).json(result.rows[0]);
}

export default requireAuth(handler);