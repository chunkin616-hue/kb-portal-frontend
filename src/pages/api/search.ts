import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const searchTerm = `%${q.trim()}%`;

    const sql = `
      SELECT 
        a.id, a.title, a.content, a.author, a.status, a.tags, 
        a.view_count as "viewCount", a.category_id as "categoryId",
        a.created_at as "createdAt", a.updated_at as "updatedAt",
        c.name as "categoryName"
      FROM kb_articles a
      LEFT JOIN kb_categories c ON a.category_id = c.id
      WHERE (a.title ILIKE $1 OR a.content ILIKE $1)
      ORDER BY a.updated_at DESC
      LIMIT 50
    `;

    const result = await query(sql, [searchTerm]);

    // Sanitize content and escape title for XSS prevention
    const sanitizedRows = result.rows.map((row: any) => ({
      ...row,
      title: String(row.title == null ? '' : row.title).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c] ?? '')),
      content: DOMPurify.sanitize(row.content || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
    }));

    res.status(200).json({
      query: q,
      count: sanitizedRows.length,
      results: sanitizedRows,
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);
