import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }
  
  const articleId = parseInt(id);
  
  if (isNaN(articleId)) {
    return res.status(400).json({ error: 'Invalid article ID' });
  }
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGetArticle(req, res, articleId);
        break;
      case 'PUT':
        await handleUpdateArticle(req, res, articleId);
        break;
      case 'DELETE':
        await handleDeleteArticle(req, res, articleId);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Article API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetArticle(req: NextApiRequest, res: NextApiResponse, articleId: number) {
  const sql = `
    SELECT 
      a.id, a.title, a.content, a.author, a.status, a.tags, 
      a.view_count as "viewCount", a.category_id as "categoryId",
      a.created_at as "createdAt", a.updated_at as "updatedAt",
      c.name as "categoryName"
    FROM kb_articles a
    LEFT JOIN kb_categories c ON a.category_id = c.id
    WHERE a.id = $1
  `;
  
  const result = await query(sql, [articleId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // Increment view count
  await query(
    'UPDATE kb_articles SET view_count = view_count + 1 WHERE id = $1',
    [articleId]
  );
  
  res.status(200).json(result.rows[0]);
}

async function handleUpdateArticle(req: NextApiRequest, res: NextApiResponse, articleId: number) {
  const { title, content, author, status, tags, categoryId, revisionNote } = req.body;
  
  // First, get the current article to create a revision
  const currentArticle = await query(
    'SELECT title, content, author FROM kb_articles WHERE id = $1',
    [articleId]
  );
  
  if (currentArticle.rows.length === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // Create revision before updating
  const revisionSql = `
    INSERT INTO kb_article_revisions 
      (article_id, title, content, author, revision_note, created_at)
    VALUES ($1, $2, $3, $4, $5, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
  `;
  
  await query(revisionSql, [
    articleId,
    currentArticle.rows[0].title,
    currentArticle.rows[0].content,
    currentArticle.rows[0].author,
    revisionNote || 'Updated',
  ]);
  
  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (title !== undefined) {
    updates.push(`title = $${paramIndex}`);
    params.push(title);
    paramIndex++;
  }
  
  if (content !== undefined) {
    updates.push(`content = $${paramIndex}`);
    params.push(content);
    paramIndex++;
  }
  
  if (author !== undefined) {
    updates.push(`author = $${paramIndex}`);
    params.push(author);
    paramIndex++;
  }
  
  if (status !== undefined) {
    updates.push(`status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  
  if (tags !== undefined) {
    updates.push(`tags = $${paramIndex}`);
    params.push(tags);
    paramIndex++;
  }
  
  if (categoryId !== undefined) {
    updates.push(`category_id = $${paramIndex}`);
    params.push(categoryId);
    paramIndex++;
  }
  
  // Always update the updated_at timestamp
  updates.push(`updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')`);
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  params.push(articleId);
  
  const updateSql = `
    UPDATE kb_articles 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING 
      id, title, content, author, status, tags, 
      view_count as "viewCount", category_id as "categoryId",
      created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  const result = await query(updateSql, params);
  
  res.status(200).json(result.rows[0]);
}

async function handleDeleteArticle(req: NextApiRequest, res: NextApiResponse, articleId: number) {
  // Check if article exists
  const checkResult = await query('SELECT id FROM kb_articles WHERE id = $1', [articleId]);
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  
  // Delete revisions first (due to foreign key constraint)
  await query('DELETE FROM kb_article_revisions WHERE article_id = $1', [articleId]);
  
  // Delete the article
  await query('DELETE FROM kb_articles WHERE id = $1', [articleId]);
  
  res.status(204).end();
}

export default requireAuth(handler);