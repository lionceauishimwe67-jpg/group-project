-- Sample Data for School Digital Timetable Display System

-- Classes (L3 SWD → L5 SWD, L3 CSA → L5 CSA, L3 NIT → L5 NIT, S3 ACC → S5 ACC)
INSERT INTO classes (name, level, stream) VALUES
('L3 SWD', 'L3', 'SWD'),
('L4 SWD', 'L4', 'SWD'),
('L5 SWD', 'L5', 'SWD'),
('L3 CSA', 'L3', 'CSA'),
('L4 CSA', 'L4', 'CSA'),
('L5 CSA', 'L5', 'CSA'),
('L3 NIT', 'L3', 'NIT'),
('L4 NIT', 'L4', 'NIT'),
('L5 NIT', 'L5', 'NIT'),
('S3 ACC', 'S3', 'ACC'),
('S4 ACC', 'S4', 'ACC'),
('S5 ACC', 'S5', 'ACC');

-- Teachers
INSERT INTO teachers (name, email, phone) VALUES
('John Smith', 'john.smith@school.edu', '+1234567890'),
('Sarah Johnson', 'sarah.johnson@school.edu', '+1234567891'),
('Michael Brown', 'michael.brown@school.edu', '+1234567892'),
('Emily Davis', 'emily.davis@school.edu', '+1234567893'),
('Robert Wilson', 'robert.wilson@school.edu', '+1234567894'),
('Jennifer Lee', 'jennifer.lee@school.edu', '+1234567895'),
('David Martinez', 'david.martinez@school.edu', '+1234567896'),
('Lisa Anderson', 'lisa.anderson@school.edu', '+1234567897'),
('James Taylor', 'james.taylor@school.edu', '+1234567898'),
('Maria Garcia', 'maria.garcia@school.edu', '+1234567899');

-- Classrooms
INSERT INTO classrooms (name, capacity, location) VALUES
('Room 101', 40, 'Block A - Ground Floor'),
('Room 102', 35, 'Block A - Ground Floor'),
('Room 103', 40, 'Block A - First Floor'),
('Room 104', 35, 'Block A - First Floor'),
('Room 201', 50, 'Block B - Ground Floor'),
('Room 202', 45, 'Block B - Ground Floor'),
('Computer Lab 1', 30, 'Block C - Ground Floor'),
('Computer Lab 2', 30, 'Block C - First Floor'),
('Science Lab', 25, 'Block D - Ground Floor'),
('Library Hall', 60, 'Main Building');

-- Subjects
INSERT INTO subjects (name, code) VALUES
('Mathematics', 'MATH'),
('English Language', 'ENG'),
('Physics', 'PHYS'),
('Chemistry', 'CHEM'),
('Biology', 'BIO'),
('Computer Science', 'CS'),
('Software Development', 'SWD'),
('Network Administration', 'NET'),
('Database Management', 'DBMS'),
('Web Development', 'WEB'),
('Accounting', 'ACC'),
('Business Studies', 'BUS'),
('Economics', 'ECON'),
('French', 'FR'),
('Swahili', 'SW');

-- Sample Timetable Entries (for Monday - day 1)
INSERT INTO timetable (class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_temporary, temporary_date) VALUES
-- L5 SWD Schedule (Monday)
(3, 7, 1, 7, '08:00', '10:00', 1, FALSE, NULL),
(3, 9, 2, 7, '10:30', '12:30', 1, FALSE, NULL),
(3, 10, 3, 8, '13:30', '15:30', 1, FALSE, NULL),

-- L5 CSA Schedule (Monday)
(6, 8, 4, 7, '08:00', '10:00', 1, FALSE, NULL),
(6, 7, 1, 8, '10:30', '12:30', 1, FALSE, NULL),
(6, 1, 2, 1, '13:30', '15:30', 1, FALSE, NULL),

-- L5 NIT Schedule (Monday)
(9, 8, 5, 7, '08:00', '10:00', 1, FALSE, NULL),
(9, 6, 6, 8, '10:30', '12:30', 1, FALSE, NULL),
(9, 7, 1, 7, '13:30', '15:30', 1, FALSE, NULL),

-- S5 ACC Schedule (Monday)
(12, 11, 7, 1, '08:00', '10:00', 1, FALSE, NULL),
(12, 12, 8, 2, '10:30', '12:30', 1, FALSE, NULL),
(12, 13, 9, 1, '13:30', '15:30', 1, FALSE, NULL),

-- Tuesday entries
(3, 10, 3, 8, '08:00', '10:00', 2, FALSE, NULL),
(6, 9, 2, 7, '08:00', '10:00', 2, FALSE, NULL),
(9, 6, 6, 8, '08:00', '10:00', 2, FALSE, NULL),
(12, 11, 7, 1, '08:00', '10:00', 2, FALSE, NULL);
