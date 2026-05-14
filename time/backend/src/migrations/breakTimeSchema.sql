-- Break Time Management and Dynamic Events Schema

-- Break times configuration (for different types of breaks)
CREATE TABLE IF NOT EXISTS break_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  break_type TEXT NOT NULL, -- 'morning', 'lunch', 'afternoon', 'custom'
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  days_of_week TEXT NOT NULL, -- JSON array of day numbers [1,2,3,4,5]
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic events (unplanned/urgent activities)
CREATE TABLE IF NOT EXISTS dynamic_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'assembly', 'meeting', 'emergency', 'special', 'custom'
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  affected_classes TEXT, -- JSON array of class IDs, null means all classes
  location TEXT,
  notify_teachers INTEGER DEFAULT 1,
  notify_students INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default break times
INSERT OR IGNORE INTO break_times (name, break_type, start_time, end_time, days_of_week) VALUES
('Morning Break', 'morning', '10:30', '10:45', '[1,2,3,4,5]'),
('Lunch Break', 'lunch', '12:00', '13:00', '[1,2,3,4,5]'),
('Afternoon Break', 'afternoon', '15:00', '15:15', '[1,2,3,4,5]');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_break_times_type ON break_times(break_type);
CREATE INDEX IF NOT EXISTS idx_break_times_active ON break_times(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_events_date ON dynamic_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_dynamic_events_status ON dynamic_events(status);
