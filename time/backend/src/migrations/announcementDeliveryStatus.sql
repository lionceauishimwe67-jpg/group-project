-- Announcement Delivery Status Tracking
-- Tracks when teachers receive, deliver, and read announcements

CREATE TABLE IF NOT EXISTS announcement_delivery_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  UNIQUE(announcement_id, teacher_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcement_delivery_announcement ON announcement_delivery_status(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_delivery_teacher ON announcement_delivery_status(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcement_delivery_status ON announcement_delivery_status(status);
