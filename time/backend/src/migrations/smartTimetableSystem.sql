-- Smart School Timetable System Schema Extensions
-- Adds chronogram uploads, timetable generation history, and AI analysis results

-- Chronogram uploads table
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
);

-- Timetable generation history
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
);

-- Teacher availability / constraints
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
);

-- Subject priorities for AI scheduling
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
);

-- Indexes for smart timetable queries
CREATE INDEX IF NOT EXISTS idx_chronogram_uploads_status ON chronogram_uploads(analysis_status);
CREATE INDEX IF NOT EXISTS idx_timetable_generations_class ON timetable_generations(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_generations_current ON timetable_generations(is_current);
CREATE INDEX IF NOT EXISTS idx_teacher_constraints_teacher ON teacher_constraints(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_priorities_level ON subject_priorities(priority_level);

-- Seed default subject priorities for core subjects
INSERT OR IGNORE INTO subject_priorities (subject_id, priority_level, is_core, max_periods_per_day, min_periods_per_week)
SELECT id, 10, 1, 3, 5 FROM subjects WHERE name LIKE '%math%' OR name LIKE '%english%' OR name LIKE '%science%' OR name LIKE '%physics%' OR name LIKE '%chemistry%' OR name LIKE '%biology%';

INSERT OR IGNORE INTO subject_priorities (subject_id, priority_level, is_core, max_periods_per_day, min_periods_per_week)
SELECT id, 8, 1, 3, 4 FROM subjects WHERE name LIKE '%history%' OR name LIKE '%geography%' OR name LIKE '%computer%' OR name LIKE '%ICT%';

INSERT OR IGNORE INTO subject_priorities (subject_id, priority_level, is_core, max_periods_per_day, min_periods_per_week)
SELECT id, 5, 0, 2, 2 FROM subjects WHERE name NOT LIKE '%math%' AND name NOT LIKE '%english%' AND name NOT LIKE '%science%' AND name NOT LIKE '%physics%' AND name NOT LIKE '%chemistry%' AND name NOT LIKE '%biology%' AND name NOT LIKE '%history%' AND name NOT LIKE '%geography%' AND name NOT LIKE '%computer%' AND name NOT LIKE '%ICT%';
