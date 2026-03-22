import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetTags(req, res);
        break;
      case 'POST':
        await handleCreateTag(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Tags API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetTags(req: NextApiRequest, res: NextApiResponse) {
  const sql = `
    SELECT 
      id, name, description, created_at as "createdAt"
    FROM kb_tags
    ORDER BY name
  `;
  
  const result = await query(sql);
  
  res.status(200).json(result.rows);
}

async function handleCreateTag(req: NextApiRequest, res: NextApiResponse) {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Check if tag already exists
  const checkResult = await query('SELECT id FROM kb_tags WHERE name = $1', [name]);
  
  if (checkResult.rows.length > 0) {
    return res.status(409).json({ error: 'Tag with this name already exists' });
  }
  
  const sql = `
    INSERT INTO kb_tags 
      (name, description, created_at)
    VALUES ($1, $2, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
    RETURNING 
      id, name, description, created_at as "createdAt"
  `;
  
  const params = [
    name,
    description || '',
  ];
  
  const result = await query(sql, params);
  
  res.status(201).json(result.rows[0]);
}

export default requireAuth(handler);