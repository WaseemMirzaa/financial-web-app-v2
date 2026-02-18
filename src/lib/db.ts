import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'financial_app',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 20,
};

const globalForDb = globalThis as unknown as { dbPool: mysql.Pool };
const pool = globalForDb.dbPool ?? mysql.createPool(poolConfig);
if (process.env.NODE_ENV !== 'production') globalForDb.dbPool = pool;

export default pool;
