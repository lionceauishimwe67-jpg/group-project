-- Unified Smart School Bell System Database Schema
-- Merges Time System and Smart Bell React into single schema

-- Users table (admin authentication)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table
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
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  capacity INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Timetable entries (schedules)
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
);

-- Special days (holidays, events, modified schedules)
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
);

-- Bell logs (track all bell rings)
CREATE TABLE IF NOT EXISTS bell_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bell_type TEXT NOT NULL,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  triggered_by TEXT DEFAULT 'system',
  reason TEXT,
  schedule_id INTEGER,
  FOREIGN KEY (schedule_id) REFERENCES timetable(id) ON DELETE SET NULL
);

-- Devices (ESP32 and other bell devices)
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
);

-- Device heartbeats
CREATE TABLE IF NOT EXISTS device_heartbeats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,
  heartbeat_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT,
  battery_level INTEGER,
  signal_strength INTEGER,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Teacher check-ins
CREATE TABLE IF NOT EXISTS teacher_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  timetable_id INTEGER NOT NULL,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  check_out_time DATETIME,
  location TEXT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
);

-- Notifications
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
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL UNIQUE,
  notification_enabled INTEGER DEFAULT 1,
  notification_advance_minutes INTEGER DEFAULT 5,
  device_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Announcements
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
);

-- Display configurations
CREATE TABLE IF NOT EXISTS display_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id TEXT NOT NULL UNIQUE,
  config JSON,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System state (for bell triggering)
CREATE TABLE IF NOT EXISTS system_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable(day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_time ON timetable(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bell_logs_time ON bell_logs(triggered_at);
CREATE INDEX IF NOT EXISTS idx_device_heartbeats_time ON device_heartbeats(heartbeat_time);
CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_checkins_time ON teacher_checkins(check_in_time);

-- Insert default system state
INSERT OR IGNORE INTO system_state (key, value) VALUES 
  ('manual_ring', 'false'),
  ('current_session', 'null'),
  ('next_bell_time', 'null');

-- Seed classes
INSERT OR IGNORE INTO classes (name, level) VALUES ('L3NIT', 'L3');
INSERT OR IGNORE INTO classes (name, level) VALUES ('L3SWD', 'L3');
INSERT OR IGNORE INTO classes (name, level) VALUES ('L3FAD', 'L3');
INSERT OR IGNORE INTO classes (name, level) VALUES ('S4ACC', 'S4');
INSERT OR IGNORE INTO classes (name, level) VALUES ('L4NIT', 'L4');
INSERT OR IGNORE INTO classes (name, level) VALUES ('L4SWD', 'L4');
INSERT OR IGNORE INTO classes (name, level) VALUES ('L4FAD', 'L4');
INSERT OR IGNORE INTO classes (name, level) VALUES ('S5ACC', 'S5');

-- Smart Timetable System Extensions

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
