ALTER TABLE timetable ADD COLUMN status TEXT DEFAULT 'scheduled';
ALTER TABLE timetable ADD COLUMN teacher_checked_in INTEGER DEFAULT 0;
