import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const initDatabase = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    const dbExists = fs.existsSync(dbPath);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log(dbExists ? 'Database opened' : 'Database created');
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
    
    // Create tables
    await createTables(db);
    
    // Insert sample data
    await insertSampleData(db);
    
    // Create default admin user
    await createDefaultAdmin(db);
    
    await db.close();
    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

const createTables = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  // Core tables (SQLite version)
  await db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      level TEXT NOT NULL,
      stream TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  await db.run(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      capacity INTEGER,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      classroom_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      is_temporary INTEGER DEFAULT 0,
      temporary_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_time ON timetable(start_time, end_time)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_day_class ON timetable(day_of_week, class_id)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_timetable_temp ON timetable(is_temporary, temporary_date)`);

  await db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_path TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('All tables created successfully');
};

const insertSampleData = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  // Check if data already exists
  const existing = await db.get('SELECT COUNT(*) as count FROM classes');
  if (existing && existing.count > 0) {
    console.log('Sample data already exists, skipping...');
    return;
  }

  // Insert sample classes
  const classes = [
    ['L3 SWD', 'L3', 'SWD'], ['L4 SWD', 'L4', 'SWD'], ['L5 SWD', 'L5', 'SWD'],
    ['L3 CSA', 'L3', 'CSA'], ['L4 CSA', 'L4', 'CSA'], ['L5 CSA', 'L5', 'CSA'],
    ['L3 NIT', 'L3', 'NIT'], ['L4 NIT', 'L4', 'NIT'], ['L5 NIT', 'L5', 'NIT'],
    ['S3 ACC', 'S3', 'ACC'], ['S4 ACC', 'S4', 'ACC'], ['S5 ACC', 'S5', 'ACC']
  ];
  for (const cls of classes) {
    await db.run('INSERT INTO classes (name, level, stream) VALUES (?, ?, ?)', cls);
  }

  // Insert sample teachers
  const teachers = [
    ['John Smith', 'john.smith@school.edu', '+1234567890'],
    ['Sarah Johnson', 'sarah.johnson@school.edu', '+1234567891'],
    ['Michael Brown', 'michael.brown@school.edu', '+1234567892'],
    ['Emily Davis', 'emily.davis@school.edu', '+1234567893'],
    ['Robert Wilson', 'robert.wilson@school.edu', '+1234567894'],
    ['Jennifer Lee', 'jennifer.lee@school.edu', '+1234567895'],
    ['David Martinez', 'david.martinez@school.edu', '+1234567896'],
    ['Lisa Anderson', 'lisa.anderson@school.edu', '+1234567897'],
    ['James Taylor', 'james.taylor@school.edu', '+1234567898'],
    ['Maria Garcia', 'maria.garcia@school.edu', '+1234567899']
  ];
  for (const teacher of teachers) {
    await db.run('INSERT INTO teachers (name, email, phone) VALUES (?, ?, ?)', teacher);
  }

  // Insert sample classrooms
  const classrooms = [
    ['Room 101', 40, 'Block A - Ground Floor'],
    ['Room 102', 35, 'Block A - Ground Floor'],
    ['Room 103', 40, 'Block A - First Floor'],
    ['Room 104', 35, 'Block A - First Floor'],
    ['Room 201', 50, 'Block B - Ground Floor'],
    ['Room 202', 45, 'Block B - Ground Floor'],
    ['Computer Lab 1', 30, 'Block C - Ground Floor'],
    ['Computer Lab 2', 30, 'Block C - First Floor'],
    ['Science Lab', 25, 'Block D - Ground Floor'],
    ['Library Hall', 60, 'Main Building']
  ];
  for (const room of classrooms) {
    await db.run('INSERT INTO classrooms (name, capacity, location) VALUES (?, ?, ?)', room);
  }

  // Insert sample subjects
  const subjects = [
    ['Mathematics', 'MATH'], ['English Language', 'ENG'], ['Physics', 'PHYS'],
    ['Chemistry', 'CHEM'], ['Biology', 'BIO'], ['Computer Science', 'CS'],
    ['Software Development', 'SWD'], ['Network Administration', 'NET'],
    ['Database Management', 'DBMS'], ['Web Development', 'WEB'],
    ['Accounting', 'ACC'], ['Business Studies', 'BUS'],
    ['Economics', 'ECON'], ['French', 'FR'], ['Swahili', 'SW']
  ];
  for (const subj of subjects) {
    await db.run('INSERT INTO subjects (name, code) VALUES (?, ?)', subj);
  }

  // Note: Timetable entries are now managed manually by admin only
  // No automatic/static timetable entries are generated

  console.log('Sample data inserted successfully');
};

const createDefaultAdmin = async (db: Database<sqlite3.Database, sqlite3.Statement>) => {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  try {
    await db.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin', passwordHash, 'admin']
    );
    console.log('Default admin user created: username=admin, password=admin123');
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      console.log('Default admin user already exists');
    } else {
      throw err;
    }
  }
};

initDatabase();
