import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }
  
  const categoryId = parseInt(id);
  
  if (isNaN(categoryId)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGetCategory(req, res, categoryId);
        break;
      case 'PUT':
        await handleUpdateCategory(req, res, categoryId);
        break;
      case 'DELETE':
        await handleDeleteCategory(req, res, categoryId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Category API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetCategory(req: NextApiRequest, res: NextApiResponse, categoryId: number) {
  const sql = `
    SELECT 
      id, name, description, parent_id as "parentId",
      created_at as "createdAt", updated_at as "updatedAt"
    FROM kb_categories
    WHERE id = $1
  `;
  
  const result = await query(sql, [categoryId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  res.status(200).json(result.rows[0]);
}

async function handleUpdateCategory(req: NextApiRequest, res: NextApiResponse, categoryId: number) {
  const { name, description, parentId } = req.body;
  
  // Check if category exists
  const checkResult = await query('SELECT id FROM kb_categories WHERE id = $1', [categoryId]);
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    params.push(name);
    paramIndex++;
  }
  
  if (description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    params.push(description);
    paramIndex++;
  }
  
  if (parentId !== undefined) {
    updates.push(`parent_id = $${paramIndex}`);
    params.push(parentId);
    paramIndex++;
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')`);
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(categoryId);
  
  const updateSql = `
    UPDATE kb_categories 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING 
      id, name, description, parent_id as "parentId",
      created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  const result = await query(updateSql, params);
  
  res.status(200).json(result.rows[0]);
}

async function handleDeleteCategory(req: NextApiRequest, res: NextApiResponse, categoryId: number) {
  // Check if category exists
  const checkResult = await query('SELECT id FROM kb_categories WHERE id = $1', [categoryId]);
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // Check if category has articles
  const articlesResult = await query('SELECT COUNT(*) FROM kb_articles WHERE category_id = $1', [categoryId]);
  
  if (parseInt(articlesResult.rows[0].count) > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete category with articles. Please reassign or delete articles first.' 
    });
  }
  
  // Check if category has subcategories
  const subcategoriesResult = await query('SELECT COUNT(*) FROM kb_categories WHERE parent_id = $1', [categoryId]);
  
  if (parseInt(subcategoriesResult.rows[0].count) > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' 
    });
  }
  
  // Delete the category
  await query('DELETE FROM kb_categories WHERE id = $1', [categoryId]);
  
  res.status(204).end();
}

export default requireAuth(handler);