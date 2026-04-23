CREATE TABLE IF NOT EXISTS teacher_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  timetable_id INTEGER,
  check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  check_out_time DATETIME,
  status TEXT DEFAULT 'present',
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (timetable_id) REFERENCES timetable(id)
);
