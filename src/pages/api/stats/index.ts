import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/apiAuth';
import { query } from '@/lib/db';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    // Get all stats in parallel
    const [
      articlesResult,
      categoriesResult,
      tagsResult,
      publishedResult,
      viewsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM kb_articles'),
      query('SELECT COUNT(*) FROM kb_categories'),
      query('SELECT COUNT(*) FROM kb_tags'),
      query('SELECT COUNT(*) FROM kb_articles WHERE status = $1', ['published']),
      query('SELECT COALESCE(SUM(view_count), 0) FROM kb_articles')
    ]);
    
    const stats = {
      totalArticles: parseInt(articlesResult.rows[0].count),
      totalCategories: parseInt(categoriesResult.rows[0].count),
      totalTags: parseInt(tagsResult.rows[0].count),
      publishedArticles: parseInt(publishedResult.rows[0].count),
      draftArticles: parseInt(articlesResult.rows[0].count) - parseInt(publishedResult.rows[0].count),
      totalViews: parseInt(viewsResult.rows[0].coalesce),
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);