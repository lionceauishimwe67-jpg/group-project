import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// Initialize database connection
export const initDatabase = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (db) return db;
  
  db = await open({
    filename: path.resolve(DB_PATH),
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');
  
  // Create teachers table
  await db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      school TEXT,
      teaching_schedule TEXT,
      subjects TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('SQLite database connected successfully');
  return db;
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await initDatabase();
    await database.get('SELECT 1');
    console.log('Database connection verified');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// Execute query helper (for SELECT)
export const query = async <T>(sql: string, params?: any[]): Promise<T> => {
  const database = await initDatabase();
  
  // Convert MySQL ? placeholders to SQLite $1, $2, etc.
  let sqliteSql = sql;
  if (params && params.length > 0) {
    let index = 0;
    sqliteSql = sql.replace(/\?/g, () => {
      index++;
      return `$${index}`;
    });
  }
  
  // Convert MySQL LIMIT ?,? to SQLite LIMIT ? OFFSET ?
  sqliteSql = sqliteSql.replace(/LIMIT \$(\d+)\s*,\s*\$(\d+)/g, 'LIMIT $2 OFFSET $1');
  
  const results = await database.all(sqliteSql, params || []);
  return results as T;
};

// Execute single row query
export const queryOne = async <T>(sql: string, params?: any[]): Promise<T | undefined> => {
  const database = await initDatabase();
  
  // Convert MySQL ? placeholders to SQLite $1, $2, etc.
  let sqliteSql = sql;
  if (params && params.length > 0) {
    let index = 0;
    sqliteSql = sql.replace(/\?/g, () => {
      index++;
      return `$${index}`;
    });
  }
  
  const result = await database.get(sqliteSql, params || []);
  return result as T | undefined;
};

// Execute run query (INSERT, UPDATE, DELETE)
export const run = async (sql: string, params?: any[]): Promise<{ lastID: number; changes: number }> => {
  const database = await initDatabase();
  
  // Convert MySQL ? placeholders to SQLite $1, $2, etc.
  let sqliteSql = sql;
  if (params && params.length > 0) {
    let index = 0;
    sqliteSql = sql.replace(/\?/g, () => {
      index++;
      return `$${index}`;
    });
  }
  
  const result = await database.run(sqliteSql, params || []);
  return {
    lastID: result.lastID || 0,
    changes: result.changes || 0
  };
};

// Transaction helper
export const withTransaction = async <T>(callback: (db: Database<sqlite3.Database, sqlite3.Statement>) => Promise<T>): Promise<T> => {
  const database = await initDatabase();
  
  await database.run('BEGIN TRANSACTION');
  
  try {
    const result = await callback(database);
    await database.run('COMMIT');
    return result;
  } catch (error) {
    await database.run('ROLLBACK');
    throw error;
  }
};

// Get database instance
export const getDb = async () => {
  return await initDatabase();
};

export default { initDatabase, testConnection, query, queryOne, run, withTransaction, getDb };
