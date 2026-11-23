const { Pool } = require('pg');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let dbInstance = null;
let isPgLite = false;

async function initDatabase() {
  if (dbInstance) return dbInstance;

  const databaseUrl = process.env.DATABASE_URL;
  let connected = false;

  // Try standard PostgreSQL pool if DATABASE_URL is configured
  if (databaseUrl && process.env.USE_PGLITE !== 'true') {
    try {
      const isRemote =
        databaseUrl.includes('render.com') ||
        databaseUrl.includes('supabase') ||
        databaseUrl.includes('neon.tech') ||
        databaseUrl.includes('sslmode=require') ||
        (process.env.NODE_ENV === 'production' &&
          !databaseUrl.includes('localhost') &&
          !databaseUrl.includes('127.0.0.1') &&
          !databaseUrl.includes('@db:') &&
          !databaseUrl.includes('@postgres:'));

      const pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      });

      // Quick test query to verify connection
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      console.log(' Successfully connected to PostgreSQL Server via pg pool');
      dbInstance = {
        query: (text, params) => pool.query(text, params),
        pool,
      };
      connected = true;
    } catch (err) {
      console.warn('⚠️ Standard PostgreSQL server connection failed or timed out:', err.message);
      console.log('🔄 Falling back to in-process persistent PostgreSQL engine (PGlite)...');
    }
  }

  // Fallback or explicit PGlite
  if (!connected) {
    const dataDir = path.resolve(process.env.PG_DATA_DIR || './data/postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const pglite = new PGlite(dataDir);
    await pglite.waitReady;
    console.log(` PostgreSQL (PGlite v16) initialized at ${dataDir}`);
    isPgLite = true;

    dbInstance = {
      query: async (text, params = []) => {
        const res = await pglite.query(text, params);
        return {
          rows: res.rows || [],
          rowCount: res.affectedRows || (res.rows ? res.rows.length : 0),
        };
      },
      exec: (sql) => pglite.exec(sql),
      pglite,
    };
  }

  // Auto-run schema migration
  try {
    const schemaSqlPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      if (isPgLite) {
        await dbInstance.exec(schemaSql);
      } else {
        await dbInstance.query(schemaSql);
      }
      console.log(' Verified and applied database schema successfully.');
    }
  } catch (schemaErr) {
    console.error('Error applying schema:', schemaErr.message);
  }

  return dbInstance;
}

const query = async (text, params) => {
  if (!dbInstance) {
    await initDatabase();
  }
  return dbInstance.query(text, params);
};

module.exports = {
  initDatabase,
  query,
  getDbInstance: () => dbInstance,
};
