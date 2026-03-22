import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    // Test database connection
    const dbResult = await query('SELECT 1 as test');
    
    res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      port: process.env.PORT || 3003,
      database: dbResult.rows.length > 0 ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      version: '1.0.0',
      port: process.env.PORT || 3003,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}