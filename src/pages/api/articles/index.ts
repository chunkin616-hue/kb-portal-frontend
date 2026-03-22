import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetArticles(req, res);
        break;
      case 'POST':
        await handleCreateArticle(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Articles API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetArticles(req: NextApiRequest, res: NextApiResponse) {
  const { search, category, status } = req.query;
  
  let sql = `
    SELECT 
      a.id, a.title, a.content, a.author, a.status, a.tags, 
      a.view_count as "viewCount", a.category_id as "categoryId",
      a.created_at as "createdAt", a.updated_at as "updatedAt",
      c.name as "categoryName"
    FROM kb_articles a
    LEFT JOIN kb_categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (search) {
    sql += ` AND (a.title ILIKE $${params.length + 1} OR a.content ILIKE $${params.length + 1})`;
    params.push(`%${search}%`);
  }
  
  if (category) {
    sql += ` AND a.category_id = $${params.length + 1}`;
    params.push(parseInt(category as string));
  }
  
  if (status) {
    sql += ` AND a.status = $${params.length + 1}`;
    params.push(status);
  }
  
  sql += ` ORDER BY a.updated_at DESC`;
  
  const result = await query(sql, params);
  
  res.status(200).json(result.rows);
}

async function handleCreateArticle(req: NextApiRequest, res: NextApiResponse) {
  const { title, content, author, status, tags, categoryId } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const sql = `
    INSERT INTO kb_articles 
      (title, content, author, status, tags, category_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'), TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
    RETURNING 
      id, title, content, author, status, tags, 
      view_count as "viewCount", category_id as "categoryId",
      created_at as "createdAt", updated_at as "updatedAt"
  `;
  
  const params = [
    title,
    content || '',
    author || 'admin',
    status || 'draft',
    tags || '',
    categoryId || null,
  ];
  
  const result = await query(sql, params);
  
  // Create initial revision
  const revisionSql = `
    INSERT INTO kb_article_revisions 
      (article_id, title, content, author, revision_note, created_at)
    VALUES ($1, $2, $3, $4, $5, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
  `;
  
  await query(revisionSql, [
    result.rows[0].id,
    title,
    content || '',
    author || 'admin',
    'Initial creation',
  ]);
  
  res.status(201).json(result.rows[0]);
}

export default requireAuth(handler);