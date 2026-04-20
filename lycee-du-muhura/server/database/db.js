const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'school.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create users table for authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      photo TEXT,
      age INTEGER,
      grade TEXT,
      class TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      enrollment_date TEXT,
      guardian TEXT,
      guardian_phone TEXT,
      status TEXT DEFAULT 'Active',
      gpa TEXT,
      skills TEXT,
      experiences TEXT,
      education_background TEXT,
      project_link TEXT,
      languages TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add new columns to existing students table (if missing)
  const columnsToAdd = [
    { name: 'skills', type: 'TEXT' },
    { name: 'experiences', type: 'TEXT' },
    { name: 'education_background', type: 'TEXT' },
    { name: 'project_link', type: 'TEXT' },
    { name: 'languages', type: 'TEXT' }
  ];

  columnsToAdd.forEach(({ name, type }) => {
    db.run(`ALTER TABLE students ADD COLUMN ${name} ${type}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.log(`Note: Column ${name} may already exist`);
      }
    });
  });

  // Create courses table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create alumni table for graduated students
  db.run(`
    CREATE TABLE IF NOT EXISTS alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      photo TEXT,
      graduation_year INTEGER,
      course_studied TEXT,
      current_position TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      bio TEXT,
      achievements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample alumni data
  db.get("SELECT COUNT(*) as count FROM alumni", (err, row) => {
    if (row && row.count === 0) {
      const sampleAlumni = [
        ['Jean Mugabo', '2019', 'Software Development', 'Senior Developer', 'Rwanda Tech Ltd', 'jean.mugabo@email.com', '+250 78 123 4567', 'Graduated with honors, specialized in web development.'],
        ['Marie Uwase', '2020', 'Networking', 'Network Administrator', 'Bank of Kigali', 'marie.uwase@email.com', '+250 78 234 5678', 'CCNA certified, manages enterprise networks.'],
        ['Patrick Ndayisaba', '2018', 'Accounting', 'Financial Analyst', 'KPMG Rwanda', 'patrick.ndayi@email.com', '+250 78 345 6789', 'CPA certified, expert in financial reporting.']
      ];
      
      const stmt = db.prepare(`INSERT INTO alumni 
        (name, graduation_year, course_studied, current_position, company, email, phone, bio) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      sampleAlumni.forEach(alumnus => stmt.run(alumnus));
      stmt.finalize();
      console.log('Sample alumni data inserted');
    }
  });

  // Insert default admin user (password: admin123)
  db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
    if (!row) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ['admin', hashedPassword, 'admin']
      );
    }
  });

  console.log('Database initialized successfully');
});

module.exports = db;
