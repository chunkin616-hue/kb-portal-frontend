// PostgreSQL database connection for Next.js API routes
import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'kb_portal',
  user: process.env.DB_USER || 'kenchan',
  password: process.env.DB_PASSWORD || 'ken123456',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Test the connection
    pool.on('connect', () => {
      console.log('✅ PostgreSQL pool connected');
    });
    
    pool.on('error', (err) => {
      console.error('❌ PostgreSQL pool error:', err);
      pool = null;
    });
  }
  
  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Executed query in ${duration}ms: ${text.substring(0, 100)}...`);
    return res;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  try {
    // Check if tables exist
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('kb_categories', 'kb_articles', 'kb_tags', 'kb_article_revisions')
    `);
    
    if (tablesCheck.rows.length === 0) {
      console.log('🔄 Creating database tables...');
      
      // Create categories table
      await query(`
        CREATE TABLE IF NOT EXISTS kb_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          parent_id INTEGER REFERENCES kb_categories(id),
          created_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
          updated_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `);
      
      // Create articles table
      await query(`
        CREATE TABLE IF NOT EXISTS kb_articles (
          id SERIAL PRIMARY KEY,
          title VARCHAR NOT NULL,
          content TEXT,
          category_id INTEGER REFERENCES kb_categories(id),
          author VARCHAR,
          status VARCHAR DEFAULT 'draft',
          view_count INTEGER DEFAULT 0,
          tags VARCHAR,
          created_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
          updated_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `);
      
      // Create tags table
      await query(`
        CREATE TABLE IF NOT EXISTS kb_tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR UNIQUE NOT NULL,
          description TEXT,
          created_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `);
      
      // Create article revisions table
      await query(`
        CREATE TABLE IF NOT EXISTS kb_article_revisions (
          id SERIAL PRIMARY KEY,
          article_id INTEGER REFERENCES kb_articles(id),
          title VARCHAR,
          content TEXT,
          author VARCHAR,
          revision_note VARCHAR,
          created_at VARCHAR DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
        )
      `);
      
      console.log('✅ Database tables created successfully!');
    } else {
      console.log('✅ Database tables already exist');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Close the pool (for cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 PostgreSQL pool closed');
  }
}