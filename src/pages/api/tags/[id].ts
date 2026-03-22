import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  const tagId = parseInt(id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGetTag(req, res, tagId);
        break;
      case 'DELETE':
        await handleDeleteTag(req, res, tagId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Tag API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetTag(req: NextApiRequest, res: NextApiResponse, tagId: number) {
  const sql = `
    SELECT 
      id, name, description, created_at as "createdAt"
    FROM kb_tags
    WHERE id = $1
  `;
  
  const result = await query(sql, [tagId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  
  res.status(200).json(result.rows[0]);
}

async function handleDeleteTag(req: NextApiRequest, res: NextApiResponse, tagId: number) {
  // Check if tag exists
  const checkResult = await query('SELECT id FROM kb_tags WHERE id = $1', [tagId]);
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Tag not found' });
  }
  
  // Delete the tag
  await query('DELETE FROM kb_tags WHERE id = $1', [tagId]);
  
  res.status(204).end();
}

export default requireAuth(handler);