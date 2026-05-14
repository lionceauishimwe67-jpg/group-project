import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

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
  
  // Run full schema from migrations file if available, otherwise inline
  const schemaPath = path.join(__dirname, '../../migrations/unifiedSchema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schema);
  } else {
    // Inline critical tables (fallback)
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        school TEXT,
        teaching_schedule TEXT,
        subjects TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        location TEXT,
        capacity INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS timetable (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        teacher_id INTEGER,
        classroom_id INTEGER,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled',
        teacher_checked_in INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS special_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'holiday',
        description TEXT,
        modified_schedule TEXT,
        is_bell_enabled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS bell_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bell_type TEXT NOT NULL,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        triggered_by TEXT DEFAULT 'system',
        reason TEXT,
        schedule_id INTEGER,
        FOREIGN KEY (schedule_id) REFERENCES timetable(id) ON DELETE SET NULL
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        device_type TEXT DEFAULT 'esp32',
        device_id TEXT UNIQUE,
        ip_address TEXT,
        last_seen DATETIME,
        status TEXT DEFAULT 'offline',
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS device_heartbeats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        heartbeat_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT,
        battery_level INTEGER,
        signal_strength INTEGER,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS teacher_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        timetable_id INTEGER NOT NULL,
        check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        check_out_time DATETIME,
        location TEXT,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
        FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        status TEXT DEFAULT 'pending',
        sent_via TEXT,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL UNIQUE,
        notification_enabled INTEGER DEFAULT 1,
        notification_advance_minutes INTEGER DEFAULT 5,
        device_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        image_url TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        start_date DATETIME,
        end_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS display_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display_id TEXT NOT NULL UNIQUE,
        config TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS system_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Default system state
    await db.run(`INSERT OR IGNORE INTO system_state (key, value) VALUES ('manual_ring', 'false')`);
    await db.run(`INSERT OR IGNORE INTO system_state (key, value) VALUES ('current_session', 'null')`);
    await db.run(`INSERT OR IGNORE INTO system_state (key, value) VALUES ('next_bell_time', 'null')`);
    await ensureEmailNotificationColumns(db);
    // Seed classes
    const seedClasses = [
      ['L3NIT', 'L3'], ['L3SWD', 'L3'], ['L3FAD', 'L3'],
      ['S4ACC', 'S4'],
      ['L4NIT', 'L4'], ['L4SWD', 'L4'], ['L4FAD', 'L4'],
      ['S5ACC', 'S5']
    ];
    for (const [name, level] of seedClasses) {
      await db.run(`INSERT OR IGNORE INTO classes (name, level) VALUES (?, ?)`, [name, level]);
    }
    // Indexes
    await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day_of_week)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_time ON timetable(start_time, end_time)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable(class_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_bell_logs_time ON bell_logs(triggered_at)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_device_heartbeats_time ON device_heartbeats(heartbeat_time)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON notifications(teacher_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_teacher_checkins_time ON teacher_checkins(check_in_time)`);
  }

  console.log('SQLite database initialized successfully');

  // --- Smart Timetable System tables (safeguard migration) ---
  await db.run(`
    CREATE TABLE IF NOT EXISTS chronogram_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      extracted_data TEXT,
      analysis_status TEXT DEFAULT 'pending',
      analysis_result TEXT,
      validation_errors TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await db.run(`
    CREATE TABLE IF NOT EXISTS timetable_generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      chronogram_upload_id INTEGER,
      generated_by INTEGER,
      generation_config TEXT,
      validation_status TEXT DEFAULT 'pending',
      validation_errors TEXT,
      generated_timetable TEXT,
      conflicts TEXT,
      is_active INTEGER DEFAULT 1,
      is_current INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (chronogram_upload_id) REFERENCES chronogram_uploads(id) ON DELETE SET NULL,
      FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  await db.run(`
    CREATE TABLE IF NOT EXISTS teacher_constraints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
      start_time TEXT,
      end_time TEXT,
      is_available INTEGER DEFAULT 1,
      max_periods_per_day INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )
  `);
  await db.run(`
    CREATE TABLE IF NOT EXISTS subject_priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL UNIQUE,
      priority_level INTEGER DEFAULT 5 CHECK (priority_level >= 1 AND priority_level <= 10),
      is_core INTEGER DEFAULT 0,
      max_periods_per_day INTEGER DEFAULT 3,
      min_periods_per_week INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    )
  `);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_chronogram_uploads_status ON chronogram_uploads(analysis_status)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_generations_class ON timetable_generations(class_id)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_generations_current ON timetable_generations(is_current)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_teacher_constraints_teacher ON teacher_constraints(teacher_id)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_subject_priorities_level ON subject_priorities(priority_level)`);
  await ensureEmailNotificationColumns(db);

  // Ensure seed classes exist (safe to run every time due to INSERT OR IGNORE)
  const seedClasses = [
    ['L3NIT', 'L3'], ['L3SWD', 'L3'], ['L3FAD', 'L3'],
    ['S4ACC', 'S4'],
    ['L4NIT', 'L4'], ['L4SWD', 'L4'], ['L4FAD', 'L4'],
    ['S5ACC', 'S5']
  ];
  for (const [name, level] of seedClasses) {
    await db.run(`INSERT OR IGNORE INTO classes (name, level) VALUES (?, ?)`, [name, level]);
  }

  return db;
};

const ensureEmailNotificationColumns = async (database: Database<sqlite3.Database, sqlite3.Statement>) => {
  const teacherColumns = await database.all(`PRAGMA table_info(teachers)`);
  const hasTeacherColumn = (name: string) => teacherColumns.some((column: any) => column.name === name);

  if (!hasTeacherColumn('notification_enabled')) {
    await database.run(`ALTER TABLE teachers ADD COLUMN notification_enabled INTEGER DEFAULT 1`);
  }
  if (!hasTeacherColumn('notification_advance_minutes')) {
    await database.run(`ALTER TABLE teachers ADD COLUMN notification_advance_minutes INTEGER DEFAULT 5`);
  }
  if (!hasTeacherColumn('device_token')) {
    await database.run(`ALTER TABLE teachers ADD COLUMN device_token TEXT`);
  }
  if (!hasTeacherColumn('sms_notification_enabled')) {
    await database.run(`ALTER TABLE teachers ADD COLUMN sms_notification_enabled INTEGER DEFAULT 1`);
  }

  const notificationColumns = await database.all(`PRAGMA table_info(notifications)`);
  const hasNotificationColumn = (name: string) => notificationColumns.some((column: any) => column.name === name);

  if (!hasNotificationColumn('timetable_id')) {
    await database.run(`ALTER TABLE notifications ADD COLUMN timetable_id INTEGER`);
  }
  if (!hasNotificationColumn('error_message')) {
    await database.run(`ALTER TABLE notifications ADD COLUMN error_message TEXT`);
  }
  if (!hasNotificationColumn('sent_via')) {
    await database.run(`ALTER TABLE notifications ADD COLUMN sent_via TEXT DEFAULT 'push'`);
  }
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
