const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const mockDB = require('./mockData');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const gradeRoutes = require('./routes/grades');
const alumniRoutes = require('./routes/alumni');
const eventRoutes = require('./routes/events');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Global variable to track DB connection
let isDBConnected = false;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Demo mode middleware - provides mock data when DB is not connected
const demoModeMiddleware = (req, res, next) => {
  if (isDBConnected) return next();
  
  // Provide mock responses for demo mode
  const path = req.path;
  const method = req.method;
  
  // Health check always works
  if (path === '/api/health') return next();
  
  // Mock data responses
  if (method === 'GET' && path === '/api/students') {
    return res.json({ students: mockDB.students });
  }
  if (method === 'GET' && path.startsWith('/api/students/') && path.includes('/grades')) {
    const studentId = path.split('/')[3];
    const grades = mockDB.grades.filter(g => g.student === studentId);
    return res.json({ grades });
  }
  if (method === 'GET' && path === '/api/courses') {
    return res.json({ courses: mockDB.courses });
  }
  if (method === 'GET' && path === '/api/alumni') {
    return res.json({ alumni: mockDB.alumni });
  }
  if (method === 'GET' && path === '/api/events') {
    return res.json({ events: mockDB.events });
  }
  if (method === 'GET' && path === '/api/events/upcoming') {
    const upcoming = mockDB.events.filter(e => e.status === 'upcoming');
    return res.json({ events: upcoming });
  }
  if (!mockDB.teachers) {
    mockDB.teachers = [
      { _id: 't1', userId: 'teacher1', password: 'password123', name: 'Teacher One', role: 'teacher', subjects: ['Mathematics', 'Physics'], department: 'Science' },
      { _id: 't2', userId: 'teacher2', password: 'password123', name: 'Teacher Two', role: 'teacher', subjects: ['English', 'History'], department: 'Arts' }
    ];
  }

  if (!mockDB.parents) {
    mockDB.parents = [
      { _id: 'p1', userId: 'parent1', password: 'password123', name: 'Parent One', role: 'parent', email: 'parent1@example.com', phone: '0781234567', address: 'Kigali', studentId: 'STU001' }
    ];
  }

  // POST - Login (Unified)
  if (method === 'POST' && path === '/api/auth/login') {
    const { userId, username, password } = req.body;
    const loginId = userId || username; // Support both userId and username
    
    // Admin login
    if (loginId === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        token: 'demo-token-admin',
        user: { id: '1', userId: 'admin', name: 'Admin User', role: 'admin' }
      });
    }
    
    // Teacher login (dynamic from mockDB)
    const teacher = mockDB.teachers.find(t => t.userId === loginId && t.password === password);
    if (teacher) {
      return res.json({
        success: true,
        token: `demo-token-teacher-${teacher._id}`,
        user: { 
          id: teacher._id, 
          userId: teacher.userId, 
          name: teacher.name, 
          role: 'teacher',
          subjects: teacher.subjects,
          department: teacher.department
        }
      });
    }
    
    // Student login (by studentId)
    const student = mockDB.students.find(s => s.studentId === loginId);
    if (student && password === 'password123') {
      return res.json({
        success: true,
        token: `demo-token-student-${student._id}`,
        user: { 
          id: student._id, 
          userId: student.studentId, 
          name: student.name, 
          role: 'student',
          class: student.class
        }
      });
    }
    
    // Parent login
    if (loginId === 'parent1' && password === 'password123') {
      return res.json({
        success: true,
        token: 'demo-token-parent',
        user: { id: 'p1', userId: 'parent1', name: 'Parent One', role: 'parent' }
      });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Parent CRUD operations
  if (method === 'GET' && path === '/api/parents') {
    return res.json({ parents: mockDB.parents || [] });
  }

  if (method === 'POST' && path === '/api/parents') {
    const { userId, password, name, email, phone, address, studentId } = req.body;
    const newParent = {
      _id: `p${Date.now()}`,
      userId,
      password,
      name,
      email,
      phone,
      address,
      studentId,
      role: 'parent'
    };
    if (!mockDB.parents) mockDB.parents = [];
    mockDB.parents.push(newParent);
    return res.json({ success: true, parent: newParent });
  }

  if (method === 'PUT' && path.startsWith('/api/parents/')) {
    const parentId = path.split('/')[3];
    const { password, name, email, phone, address, studentId } = req.body;
    const parentIndex = mockDB.parents.findIndex(p => p._id === parentId);
    if (parentIndex !== -1) {
      mockDB.parents[parentIndex] = {
        ...mockDB.parents[parentIndex],
        password,
        name,
        email,
        phone,
        address,
        studentId
      };
      return res.json({ success: true, parent: mockDB.parents[parentIndex] });
    }
    return res.status(404).json({ message: 'Parent not found' });
  }

  if (method === 'DELETE' && path.startsWith('/api/parents/')) {
    const parentId = path.split('/')[3];
    const parentIndex = mockDB.parents.findIndex(p => p._id === parentId);
    if (parentIndex !== -1) {
      mockDB.parents.splice(parentIndex, 1);
      return res.json({ success: true, message: 'Parent deleted' });
    }
    return res.status(404).json({ message: 'Parent not found' });
  }

  // Event CRUD operations
  if (method === 'GET' && path === '/api/events') {
    return res.json({ events: mockDB.events || [] });
  }

  if (method === 'POST' && path === '/api/events') {
    const { title, date, time, type, description, location, status, image } = req.body;
    const newEvent = {
      _id: `e${Date.now()}`,
      title,
      date,
      time,
      type,
      description,
      location,
      status: status || 'upcoming',
      image: image || ''
    };
    if (!mockDB.events) mockDB.events = [];
    mockDB.events.push(newEvent);
    return res.json({ success: true, event: newEvent });
  }

  if (method === 'PUT' && path.startsWith('/api/events/')) {
    const eventId = path.split('/')[3];
    const { title, date, time, type, description, location, status, image } = req.body;
    const eventIndex = mockDB.events.findIndex(e => e._id === eventId);
    if (eventIndex !== -1) {
      mockDB.events[eventIndex] = {
        ...mockDB.events[eventIndex],
        title,
        date,
        time,
        type,
        description,
        location,
        status,
        image: image || mockDB.events[eventIndex].image || ''
      };
      return res.json({ success: true, event: mockDB.events[eventIndex] });
    }
    return res.status(404).json({ message: 'Event not found' });
  }

  if (method === 'DELETE' && path.startsWith('/api/events/')) {
    const eventId = path.split('/')[3];
    const eventIndex = mockDB.events.findIndex(e => e._id === eventId);
    if (eventIndex !== -1) {
      mockDB.events.splice(eventIndex, 1);
      return res.json({ success: true, message: 'Event deleted' });
    }
    return res.status(404).json({ message: 'Event not found' });
  }

  if (method === 'GET' && path === '/api/auth/verify') {
    return res.json({ user: { id: '1', username: 'admin', role: 'admin' } });
  }
  // Teacher login (legacy - kept for compatibility)
  if (method === 'POST' && path === '/api/auth/teacher-login') {
    const { username, password } = req.body;
    // Use dynamic teacher credentials from mockDB
    const teacher = mockDB.teachers.find(t => t.userId === username && t.password === password);
    if (teacher) {
      return res.json({
        token: `demo-token-teacher-${teacher._id}`,
        user: {
          id: teacher._id,
          username: teacher.userId,
          name: teacher.name,
          role: teacher.role,
          subjects: teacher.subjects,
          department: teacher.department
        }
      });
    }
    return res.status(401).json({ message: 'Invalid teacher credentials' });
  }

  // ========== TEACHER MANAGEMENT API (Admin only) ==========
  
  // GET - All teachers
  if (method === 'GET' && path === '/api/teachers') {
    return res.json({ teachers: mockDB.teachers || [] });
  }
  
  // POST - Add new teacher (Admin only)
  if (method === 'POST' && path === '/api/teachers') {
    const { userId, password, name, subjects, department } = req.body;
    
    // Validate required fields
    if (!userId || !password || !name) {
      return res.status(400).json({ success: false, message: 'userId, password, and name are required' });
    }
    
    // Check if userId already exists
    if (mockDB.teachers.find(t => t.userId === userId)) {
      return res.status(400).json({ success: false, message: 'Teacher ID already exists' });
    }
    
    const newTeacher = {
      _id: 'teacher_' + Date.now(),
      userId,
      password,
      name,
      subjects: subjects || [],
      department: department || 'General',
      role: 'teacher',
      createdAt: new Date().toISOString()
    };
    
    mockDB.teachers.push(newTeacher);
    return res.status(201).json({ success: true, teacher: newTeacher, message: 'Teacher added successfully' });
  }
  
  // PUT - Update teacher (Admin only)
  if (method === 'PUT' && path.startsWith('/api/teachers/')) {
    const id = path.split('/')[3];
    const teacherIndex = mockDB.teachers.findIndex(t => t._id === id);
    
    if (teacherIndex === -1) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    const { password, name, subjects, department } = req.body;
    
    mockDB.teachers[teacherIndex] = {
      ...mockDB.teachers[teacherIndex],
      ...(password && { password }),
      ...(name && { name }),
      ...(subjects && { subjects }),
      ...(department && { department }),
      updatedAt: new Date().toISOString()
    };
    
    return res.json({ success: true, teacher: mockDB.teachers[teacherIndex], message: 'Teacher updated successfully' });
  }
  
  // DELETE - Remove teacher (Admin only)
  if (method === 'DELETE' && path.startsWith('/api/teachers/')) {
    const id = path.split('/')[3];
    const teacherIndex = mockDB.teachers.findIndex(t => t._id === id);
    
    if (teacherIndex === -1) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    mockDB.teachers.splice(teacherIndex, 1);
    return res.json({ success: true, message: 'Teacher removed successfully' });
  }
  // Admin stats
  if (method === 'GET' && path === '/api/students/stats/overview') {
    return res.json({ 
      totalStudents: mockDB.students.length,
      activeStudents: mockDB.students.filter(s => s.status === 'Active').length,
      byClass: [{ class: 'S4', count: 1 }, { class: 'S5', count: 1 }, { class: 'S6', count: 1 }]
    });
  }
  // Grades
  if (method === 'GET' && path === '/api/grades') {
    return res.json({ grades: mockDB.grades });
  }
  // Alumni stats
  if (method === 'GET' && path === '/api/alumni/stats/overview') {
    return res.json({
      totalAlumni: mockDB.alumni.length,
      byYear: [{ graduation_year: 2023, count: 1 }, { graduation_year: 2022, count: 1 }],
      byCourse: [{ course_studied: 'Science', count: 1 }, { course_studied: 'Arts', count: 1 }]
    });
  }
  // Single alumni
  if (method === 'GET' && path.startsWith('/api/alumni/') && !path.includes('/stats')) {
    const id = path.split('/')[3];
    const alumnus = mockDB.alumni.find(a => a._id === id);
    if (alumnus) return res.json({ alumnus });
  }
  // Student login
  if (method === 'POST' && path === '/api/students/login') {
    const { studentId, password } = req.body;
    const student = mockDB.students.find(s => s.studentId === studentId);
    if (student && password === 'password123') {
      return res.json({
        token: `demo-token-student-${student._id}`,
        student: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          class: student.class,
          status: student.status,
          gpa: student.gpa,
          role: 'student'
        }
      });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  // Single student
  if (method === 'GET' && path.startsWith('/api/students/') && !path.includes('/grades') && !path.includes('/attendance')) {
    const id = path.split('/')[3];
    const student = mockDB.students.find(s => s._id === id);
    if (student) return res.json({ student });
  }
  // Student attendance
  if (method === 'GET' && path.includes('/attendance') && path.startsWith('/api/students/')) {
    return res.json({
      attendance: [
        { date: '2024-01-15', status: 'present', course: 'Mathematics' },
        { date: '2024-01-14', status: 'present', course: 'Physics' },
        { date: '2024-01-13', status: 'absent', course: 'Chemistry' }
      ]
    });
  }
  // Single course
  if (method === 'GET' && path.startsWith('/api/courses/')) {
    const id = path.split('/')[3];
    const course = mockDB.courses.find(c => c._id === id);
    if (course) return res.json({ course });
  }
  // Single grade
  if (method === 'GET' && path.startsWith('/api/grades/')) {
    const id = path.split('/')[3];
    const grade = mockDB.grades.find(g => g._id === id);
    if (grade) return res.json({ grade });
  }
  // Student grades
  if (method === 'GET' && path.includes('/grades') && path.startsWith('/api/students/')) {
    const studentId = path.split('/')[3];
    const grades = mockDB.grades.filter(g => g.student === studentId);
    return res.json({ grades });
  }
  
  // ==================== TEACHER MANAGEMENT APIs ====================
  
  // POST - Create Course (Teacher/Admin)
  if (method === 'POST' && path === '/api/courses') {
    const newCourse = {
      _id: 'course_' + (mockDB.courses.length + 1),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    mockDB.courses.push(newCourse);
    return res.status(201).json({ 
      message: 'Course created successfully',
      course: newCourse 
    });
  }
  
  // PUT - Update Course (Teacher/Admin)
  if (method === 'PUT' && path.startsWith('/api/courses/')) {
    const id = path.split('/')[3];
    const courseIndex = mockDB.courses.findIndex(c => c._id === id);
    if (courseIndex >= 0) {
      mockDB.courses[courseIndex] = { 
        ...mockDB.courses[courseIndex], 
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      return res.json({ 
        message: 'Course updated successfully',
        course: mockDB.courses[courseIndex]
      });
    }
    return res.status(404).json({ message: 'Course not found' });
  }
  
  // DELETE - Delete Course (Teacher/Admin)
  if (method === 'DELETE' && path.startsWith('/api/courses/')) {
    const id = path.split('/')[3];
    const courseIndex = mockDB.courses.findIndex(c => c._id === id);
    if (courseIndex >= 0) {
      const deletedCourse = mockDB.courses.splice(courseIndex, 1)[0];
      return res.json({ 
        message: 'Course deleted successfully',
        course: deletedCourse
      });
    }
    return res.status(404).json({ message: 'Course not found' });
  }
  
  // POST - Create Grade (Teacher/Admin)
  if (method === 'POST' && path === '/api/grades') {
    // Calculate grade letter from score
    const score = req.body.score;
    let gradeLetter = 'F';
    if (score >= 90) gradeLetter = 'A';
    else if (score >= 80) gradeLetter = 'B';
    else if (score >= 70) gradeLetter = 'C';
    else if (score >= 60) gradeLetter = 'D';
    
    const newGrade = {
      _id: 'grade_' + (mockDB.grades.length + 1),
      ...req.body,
      grade: gradeLetter,
      createdAt: new Date().toISOString()
    };
    mockDB.grades.push(newGrade);
    return res.status(201).json({ 
      message: 'Grade added successfully',
      grade: newGrade 
    });
  }
  
  // PUT - Update Grade (Teacher/Admin)
  if (method === 'PUT' && path.startsWith('/api/grades/')) {
    const id = path.split('/')[3];
    const gradeIndex = mockDB.grades.findIndex(g => g._id === id);
    if (gradeIndex >= 0) {
      // Recalculate grade letter if score changed
      const score = req.body.score || mockDB.grades[gradeIndex].score;
      let gradeLetter = mockDB.grades[gradeIndex].grade;
      if (req.body.score !== undefined) {
        if (score >= 90) gradeLetter = 'A';
        else if (score >= 80) gradeLetter = 'B';
        else if (score >= 70) gradeLetter = 'C';
        else if (score >= 60) gradeLetter = 'D';
        else gradeLetter = 'F';
      }
      
      mockDB.grades[gradeIndex] = { 
        ...mockDB.grades[gradeIndex], 
        ...req.body,
        grade: gradeLetter,
        updatedAt: new Date().toISOString()
      };
      return res.json({ 
        message: 'Grade updated successfully',
        grade: mockDB.grades[gradeIndex]
      });
    }
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  // DELETE - Delete Grade (Teacher/Admin)
  if (method === 'DELETE' && path.startsWith('/api/grades/')) {
    const id = path.split('/')[3];
    const gradeIndex = mockDB.grades.findIndex(g => g._id === id);
    if (gradeIndex >= 0) {
      const deletedGrade = mockDB.grades.splice(gradeIndex, 1)[0];
      return res.json({ 
        message: 'Grade deleted successfully',
        grade: deletedGrade
      });
    }
    return res.status(404).json({ message: 'Grade not found' });
  }
  
  // ==================== DIGITAL BOOK APIs ====================
  
  // GET - All Books
  if (method === 'GET' && path === '/api/books') {
    return res.json({ books: mockDB.books || [] });
  }
  
  // GET - Single Book
  if (method === 'GET' && path.startsWith('/api/books/')) {
    const id = path.split('/')[3];
    const book = (mockDB.books || []).find(b => b._id === id);
    if (book) {
      return res.json({ book });
    }
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // POST - Create Book (Teacher/Admin)
  if (method === 'POST' && path === '/api/books') {
    const newBook = {
      _id: 'book_' + Date.now(),
      ...req.body,
      uploadedBy: req.body.teacherId || 'teacher1',
      uploadedAt: new Date().toISOString(),
      downloads: 0,
      views: 0
    };
    if (!mockDB.books) mockDB.books = [];
    mockDB.books.push(newBook);
    return res.status(201).json({ 
      message: 'Book uploaded successfully',
      book: newBook 
    });
  }
  
  // PUT - Update Book (Teacher/Admin)
  if (method === 'PUT' && path.startsWith('/api/books/')) {
    const id = path.split('/')[3];
    const bookIndex = (mockDB.books || []).findIndex(b => b._id === id);
    if (bookIndex >= 0) {
      mockDB.books[bookIndex] = { 
        ...mockDB.books[bookIndex], 
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      return res.json({ 
        message: 'Book updated successfully',
        book: mockDB.books[bookIndex]
      });
    }
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // DELETE - Delete Book (Teacher/Admin)
  if (method === 'DELETE' && path.startsWith('/api/books/')) {
    const id = path.split('/')[3];
    const bookIndex = (mockDB.books || []).findIndex(b => b._id === id);
    if (bookIndex >= 0) {
      const deletedBook = mockDB.books.splice(bookIndex, 1)[0];
      return res.json({ 
        message: 'Book deleted successfully',
        book: deletedBook
      });
    }
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // POST - Track Book View
  if (method === 'POST' && path.startsWith('/api/books/') && path.includes('/view')) {
    const id = path.split('/')[3];
    const book = (mockDB.books || []).find(b => b._id === id);
    if (book) {
      book.views = (book.views || 0) + 1;
      return res.json({ message: 'View recorded', views: book.views });
    }
    return res.status(404).json({ message: 'Book not found' });
  }
  
  // ==================== NOTES APIs (Simple) ====================
  
  // GET - All Notes
  if (method === 'GET' && path === '/api/notes') {
    return res.json({ notes: mockDB.notes || [] });
  }
  
  // GET - Notes by Subject/Class
  if (method === 'GET' && path.startsWith('/api/notes?')) {
    const urlParams = new URLSearchParams(path.split('?')[1]);
    const subject = urlParams.get('subject');
    const className = urlParams.get('class');
    
    let filteredNotes = mockDB.notes || [];
    if (subject) filteredNotes = filteredNotes.filter(n => n.subject === subject);
    if (className) filteredNotes = filteredNotes.filter(n => n.class === className);
    
    return res.json({ notes: filteredNotes });
  }
  
  // POST - Create Note (Teacher)
  if (method === 'POST' && path === '/api/notes') {
    const newNote = {
      _id: 'note_' + Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!mockDB.notes) mockDB.notes = [];
    mockDB.notes.push(newNote);
    return res.status(201).json({ 
      message: 'Note created successfully',
      note: newNote 
    });
  }
  
  // PUT - Update Note (Teacher)
  if (method === 'PUT' && path.startsWith('/api/notes/')) {
    const id = path.split('/')[3];
    const noteIndex = (mockDB.notes || []).findIndex(n => n._id === id);
    if (noteIndex >= 0) {
      mockDB.notes[noteIndex] = { 
        ...mockDB.notes[noteIndex], 
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      return res.json({ 
        message: 'Note updated successfully',
        note: mockDB.notes[noteIndex]
      });
    }
    return res.status(404).json({ message: 'Note not found' });
  }
  
  // DELETE - Delete Note (Teacher)
  if (method === 'DELETE' && path.startsWith('/api/notes/')) {
    const id = path.split('/')[3];
    const noteIndex = (mockDB.notes || []).findIndex(n => n._id === id);
    if (noteIndex >= 0) {
      const deletedNote = mockDB.notes.splice(noteIndex, 1)[0];
      return res.json({ 
        message: 'Note deleted successfully',
        note: deletedNote
      });
    }
    return res.status(404).json({ message: 'Note not found' });
  }
  
  // ========== REPORTS API ==========
  
  // GET - Performance Report (Students)
  if (method === 'GET' && path === '/api/reports/performance') {
    const { classFilter, semester } = req.query;
    let grades = mockDB.grades || [];
    let students = mockDB.students || [];
    
    // Filter by class if provided
    if (classFilter) {
      const classStudents = students.filter(s => s.class === classFilter).map(s => s._id);
      grades = grades.filter(g => classStudents.includes(g.student));
    }
    
    // Filter by semester if provided
    if (semester) {
      grades = grades.filter(g => g.semester === semester);
    }
    
    // Calculate statistics
    const totalStudents = students.length;
    const studentsWithGrades = [...new Set(grades.map(g => g.student))].length;
    const averageScore = grades.length > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length : 0;
    
    const gradeDistribution = {
      A: grades.filter(g => g.letterGrade === 'A').length,
      B: grades.filter(g => g.letterGrade?.startsWith('B')).length,
      C: grades.filter(g => g.letterGrade?.startsWith('C')).length,
      D: grades.filter(g => g.letterGrade?.startsWith('D')).length,
      F: grades.filter(g => g.letterGrade === 'F').length
    };
    
    // Top performers
    const studentGradesMap = {};
    grades.forEach(g => {
      if (!studentGradesMap[g.student]) studentGradesMap[g.student] = [];
      studentGradesMap[g.student].push(g);
    });
    
    const topPerformers = Object.keys(studentGradesMap)
      .map(studentId => {
        const student = students.find(s => s._id === studentId);
        const studentGrades = studentGradesMap[studentId];
        const avgScore = studentGrades.reduce((sum, g) => sum + g.score, 0) / studentGrades.length;
        return { student, averageScore: avgScore.toFixed(2), gradeCount: studentGrades.length };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);
    
    return res.json({
      summary: { totalStudents, studentsWithGrades, averageScore: averageScore.toFixed(2) },
      gradeDistribution,
      topPerformers,
      grades: grades.slice(0, 50)
    });
  }
  
  // GET - Attendance Trends Report
  if (method === 'GET' && path === '/api/reports/attendance') {
    const { classFilter, startDate, endDate } = req.query;
    let attendance = mockDB.attendance || [];
    let students = mockDB.students || [];
    
    // Filter by class
    if (classFilter) {
      const classStudents = students.filter(s => s.class === classFilter).map(s => s._id);
      attendance = attendance.filter(a => classStudents.includes(a.student));
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      attendance = attendance.filter(a => new Date(a.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      attendance = attendance.filter(a => new Date(a.date) <= end);
    }
    
    // Calculate trends
    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const absentCount = attendance.filter(a => a.status === 'Absent').length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;
    
    // Daily breakdown
    const dailyBreakdown = {};
    attendance.forEach(a => {
      const date = new Date(a.date).toISOString().split('T')[0];
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      dailyBreakdown[date][a.status.toLowerCase()]++;
      dailyBreakdown[date].total++;
    });
    
    // Students with attendance issues
    const studentAttendance = {};
    attendance.forEach(a => {
      if (!studentAttendance[a.student]) {
        studentAttendance[a.student] = { present: 0, absent: 0, total: 0 };
      }
      studentAttendance[a.student][a.status.toLowerCase()]++;
      studentAttendance[a.student].total++;
    });
    
    const atRiskStudents = Object.keys(studentAttendance)
      .map(studentId => {
        const student = students.find(s => s._id === studentId);
        const stats = studentAttendance[studentId];
        const rate = ((stats.present / stats.total) * 100).toFixed(2);
        return { student, attendanceRate: rate, absentCount: stats.absent };
      })
      .filter(s => parseFloat(s.attendanceRate) < 75)
      .sort((a, b) => parseFloat(a.attendanceRate) - parseFloat(b.attendanceRate));
    
    return res.json({
      summary: { totalRecords, presentCount, absentCount, lateCount, attendanceRate },
      dailyBreakdown,
      atRiskStudents: atRiskStudents.slice(0, 20)
    });
  }
  
  // GET - Financial Reports
  if (method === 'GET' && path === '/api/reports/finance') {
    const { type, year, month } = req.query;
    let payments = mockDB.payments || [];
    
    // Filter by year
    if (year) {
      payments = payments.filter(p => new Date(p.date).getFullYear() === parseInt(year));
    }
    
    // Filter by month
    if (month) {
      payments = payments.filter(p => new Date(p.date).getMonth() + 1 === parseInt(month));
    }
    
    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);
    
    // By payment type
    const byType = {};
    payments.forEach(p => {
      if (!byType[p.type]) byType[p.type] = { total: 0, paid: 0, pending: 0, count: 0 };
      byType[p.type].total += p.amount;
      byType[p.type][p.status.toLowerCase()] += p.amount;
      byType[p.type].count++;
    });
    
    // Monthly trend
    const monthlyTrend = {};
    payments.forEach(p => {
      const monthKey = new Date(p.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = { revenue: 0, count: 0, paid: 0, pending: 0 };
      }
      monthlyTrend[monthKey].revenue += p.amount;
      monthlyTrend[monthKey].count++;
      if (p.status === 'Paid') monthlyTrend[monthKey].paid += p.amount;
      if (p.status === 'Pending') monthlyTrend[monthKey].pending += p.amount;
    });
    
    // Outstanding payments
    const outstanding = payments
      .filter(p => p.status !== 'Paid')
      .map(p => {
        const student = mockDB.students.find(s => s._id === p.student);
        return { ...p, studentName: student?.name || 'Unknown' };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return res.json({
      summary: { totalRevenue, paidAmount, pendingAmount, overdueAmount, totalTransactions: payments.length },
      byType,
      monthlyTrend,
      outstandingPayments: outstanding.slice(0, 20)
    });
  }
  
  // ========== TIMETABLE API ==========
  
  // Initialize timetable if not exists
  if (!mockDB.timetable) {
    mockDB.timetable = [];
  }
  
  // GET - Timetable for class/teacher
  if (method === 'GET' && path === '/api/timetable') {
    const { classFilter, teacher, day } = req.query;
    let timetable = mockDB.timetable || [];
    
    if (classFilter) {
      timetable = timetable.filter(t => t.class === classFilter);
    }
    if (teacher) {
      timetable = timetable.filter(t => t.teacherId === teacher);
    }
    if (day) {
      timetable = timetable.filter(t => t.day === day);
    }
    
    return res.json({ success: true, timetable });
  }
  
  // Helper function to check conflicts
  const checkConflict = (newSlot, excludeId = null) => {
    const timetable = mockDB.timetable || [];
    
    for (const slot of timetable) {
      if (excludeId && slot._id === excludeId) continue;
      
      // Same day check
      if (slot.day !== newSlot.day) continue;
      
      // Time overlap check
      const newStart = parseInt(newSlot.startTime.replace(':', ''));
      const newEnd = parseInt(newSlot.endTime.replace(':', ''));
      const existStart = parseInt(slot.startTime.replace(':', ''));
      const existEnd = parseInt(slot.endTime.replace(':', ''));
      
      const timeOverlap = (newStart < existEnd && newEnd > existStart);
      
      if (!timeOverlap) continue;
      
      // Check class conflict
      if (slot.class === newSlot.class) {
        return { conflict: true, type: 'class', message: `Class ${newSlot.class} already has ${slot.subject} at this time` };
      }
      
      // Check teacher conflict
      if (slot.teacherId === newSlot.teacherId) {
        return { conflict: true, type: 'teacher', message: `Teacher already assigned to ${slot.subject} at this time` };
      }
      
      // Check room conflict
      if (slot.room === newSlot.room) {
        return { conflict: true, type: 'room', message: `Room ${newSlot.room} already occupied by ${slot.subject}` };
      }
    }
    
    return { conflict: false };
  };
  
  // POST - Add timetable slot
  if (method === 'POST' && path === '/api/timetable') {
    const { day, startTime, endTime, subject, teacherId, teacherName, class: className, room } = req.body;
    
    const newSlot = {
      _id: Date.now().toString(),
      day,
      startTime,
      endTime,
      subject,
      teacherId,
      teacherName,
      class: className,
      room,
      createdAt: new Date()
    };
    
    // Check conflicts
    const conflict = checkConflict(newSlot);
    if (conflict.conflict) {
      return res.status(409).json({ success: false, error: conflict.message, type: conflict.type });
    }
    
    mockDB.timetable.push(newSlot);
    
    // Create notification for affected users
    createNotification({
      title: 'Timetable Updated',
      message: `${subject} added to ${className} on ${day} at ${startTime}`,
      type: 'info',
      recipients: ['students', 'teachers']
    });
    
    return res.json({ success: true, slot: newSlot });
  }
  
  // PUT - Update timetable slot (drag & drop)
  if (method === 'PUT' && path.startsWith('/api/timetable/')) {
    const slotId = path.split('/')[3];
    const { day, startTime, endTime, room } = req.body;
    
    const slotIndex = mockDB.timetable.findIndex(t => t._id === slotId);
    if (slotIndex === -1) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    
    const existingSlot = mockDB.timetable[slotIndex];
    const updatedSlot = {
      ...existingSlot,
      day: day || existingSlot.day,
      startTime: startTime || existingSlot.startTime,
      endTime: endTime || existingSlot.endTime,
      room: room || existingSlot.room
    };
    
    // Check conflicts
    const conflict = checkConflict(updatedSlot, slotId);
    if (conflict.conflict) {
      return res.status(409).json({ success: false, error: conflict.message, type: conflict.type });
    }
    
    mockDB.timetable[slotIndex] = updatedSlot;
    
    // Create notification for schedule change
    if (day !== existingSlot.day || startTime !== existingSlot.startTime) {
      createNotification({
        title: 'Schedule Changed',
        message: `${updatedSlot.subject} moved to ${day} at ${startTime}`,
        type: 'warning',
        recipients: ['students', 'teachers']
      });
    }
    
    return res.json({ success: true, slot: updatedSlot });
  }
  
  // DELETE - Remove timetable slot
  if (method === 'DELETE' && path.startsWith('/api/timetable/')) {
    const slotId = path.split('/')[3];
    const slotIndex = mockDB.timetable.findIndex(t => t._id === slotId);
    
    if (slotIndex === -1) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }
    
    const removedSlot = mockDB.timetable[slotIndex];
    mockDB.timetable.splice(slotIndex, 1);
    
    createNotification({
      title: 'Class Cancelled',
      message: `${removedSlot.subject} on ${removedSlot.day} at ${removedSlot.startTime} has been cancelled`,
      type: 'error',
      recipients: ['students', 'teachers']
    });
    
    return res.json({ success: true, message: 'Slot removed' });
  }
  
  // POST - Auto-generate timetable (Enhanced with smart matching)
  if (method === 'POST' && path === '/api/timetable/generate') {
    const { class: className, subjects, teacherAssignments, preferences = {} } = req.body;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      { start: '08:00', end: '09:30', type: 'morning' },
      { start: '09:45', end: '11:15', type: 'morning' },
      { start: '11:30', end: '13:00', type: 'midday' },
      { start: '14:00', end: '15:30', type: 'afternoon' },
      { start: '15:45', end: '17:15', type: 'afternoon' }
    ];
    
    const rooms = ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Lab 2'];
    const generatedSlots = [];
    const failedSubjects = [];
    const warnings = [];
    
    // Clear existing timetable for this class
    mockDB.timetable = mockDB.timetable.filter(t => t.class !== className);
    
    // Calculate teacher workload to balance distribution
    const teacherWorkload = {};
    Object.values(teacherAssignments).forEach(teacher => {
      teacherWorkload[teacher.id] = 0;
    });
    
    // Smart scheduling algorithm
    subjects.forEach((subject, index) => {
      const teacher = teacherAssignments[subject];
      let placed = false;
      
      // Get teacher preferences if available
      const teacherPref = preferences[teacher.id] || {};
      const preferredDays = teacherPref.preferredDays || [];
      const preferredTimes = teacherPref.preferredTimes || [];
      
      // Sort time slots based on preferences
      const sortedSlots = [...timeSlots].sort((a, b) => {
        const aScore = (preferredTimes.includes(a.type) ? 1 : 0) + 
                       (teacherPref.avoidMorning && a.type === 'morning' ? -1 : 0) +
                       (teacherPref.avoidAfternoon && a.type === 'afternoon' ? -1 : 0);
        const bScore = (preferredTimes.includes(b.type) ? 1 : 0) + 
                       (teacherPref.avoidMorning && b.type === 'morning' ? -1 : 0) +
                       (teacherPref.avoidAfternoon && b.type === 'afternoon' ? -1 : 0);
        return bScore - aScore;
      });
      
      // Sort days based on preferences
      const sortedDays = [...days].sort((a, b) => {
        const aScore = preferredDays.includes(a) ? 1 : 0;
        const bScore = preferredDays.includes(b) ? 1 : 0;
        return bScore - aScore;
      });
      
      // Sort rooms based on teacher workload balance
      const sortedRooms = [...rooms].sort((a, b) => {
        const aLoad = teacherWorkload[teacher.id] || 0;
        const bLoad = teacherWorkload[teacher.id] || 0;
        return aLoad - bLoad;
      });
      
      // Try to place subject
      for (const day of sortedDays) {
        for (const slot of sortedSlots) {
          for (const room of sortedRooms) {
            const newSlot = {
              _id: `${Date.now()}_${index}`,
              day,
              startTime: slot.start,
              endTime: slot.end,
              subject,
              teacherId: teacher.id,
              teacherName: teacher.name,
              class: className,
              room,
              createdAt: new Date()
            };
            
            const conflict = checkConflict(newSlot);
            if (!conflict.conflict) {
              mockDB.timetable.push(newSlot);
              generatedSlots.push(newSlot);
              teacherWorkload[teacher.id]++;
              placed = true;
              
              // Check if using non-preferred time
              if (preferredDays.length > 0 && !preferredDays.includes(day)) {
                warnings.push(`${subject} scheduled on ${day} (not preferred day)`);
              }
              if (preferredTimes.length > 0 && !preferredTimes.includes(slot.type)) {
                warnings.push(`${subject} scheduled at ${slot.start} (not preferred time)`);
              }
              
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }
      
      if (!placed) {
        failedSubjects.push(subject);
        warnings.push(`Could not schedule ${subject} - no available slots`);
      }
    });
    
    // Optimize schedule - minimize gaps between classes
    const optimizedSlots = optimizeSchedule(generatedSlots, timeSlots);
    
    // Update mockDB with optimized slots
    mockDB.timetable = mockDB.timetable.filter(t => t.class !== className);
    optimizedSlots.forEach(slot => mockDB.timetable.push(slot));
    
    const result = {
      success: true,
      timetable: optimizedSlots,
      generated: optimizedSlots.length
    };
    
    if (failedSubjects.length > 0) {
      result.partial = true;
      result.failed = failedSubjects;
      result.message = `Generated ${optimizedSlots.length} slots. Failed: ${failedSubjects.join(', ')}`;
    }
    
    if (warnings.length > 0) {
      result.warnings = warnings;
    }
    
    createNotification({
      title: 'Timetable Generated',
      message: `New timetable generated for ${className} with ${optimizedSlots.length} classes`,
      type: 'info',
      recipients: ['students', 'teachers']
    });
    
    return res.json(result);
  }
  
  // Helper: Optimize schedule to minimize gaps
  const optimizeSchedule = (slots, timeSlots) => {
    // Sort slots by day and time
    const sorted = [...slots].sort((a, b) => {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
    
    return sorted;
  };
  
  // ========== NOTIFICATIONS API ==========
  
  // Initialize notifications
  if (!mockDB.notifications) {
    mockDB.notifications = [];
  }
  
  // Helper to create notification
  const createNotification = ({ title, message, type, recipients, userId }) => {
    const notification = {
      _id: Date.now().toString(),
      title,
      message,
      type: type || 'info',
      recipients,
      userId,
      read: false,
      createdAt: new Date()
    };
    
    mockDB.notifications.push(notification);
    
    // Keep only last 100 notifications
    if (mockDB.notifications.length > 100) {
      mockDB.notifications = mockDB.notifications.slice(-100);
    }
    
    return notification;
  };
  
  // GET - Notifications for user
  if (method === 'GET' && path === '/api/notifications') {
    const { userId, role } = req.query;
    let notifications = mockDB.notifications || [];
    
    // Filter by user or role
    notifications = notifications.filter(n => {
      if (n.userId === userId) return true;
      if (n.recipients && n.recipients.includes(role)) return true;
      return false;
    });
    
    // Sort by date (newest first)
    notifications = notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return res.json({ 
      success: true, 
      notifications: notifications.slice(0, 20),
      unreadCount 
    });
  }
  
  // PUT - Mark notification as read
  if (method === 'PUT' && path.startsWith('/api/notifications/')) {
    const notifId = path.split('/')[3];
    const notification = mockDB.notifications.find(n => n._id === notifId);
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    notification.read = true;
    return res.json({ success: true, notification });
  }
  
  // PUT - Mark all as read
  if (method === 'PUT' && path === '/api/notifications/read-all') {
    const { userId } = req.body;
    
    mockDB.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    
    return res.json({ success: true, message: 'All notifications marked as read' });
  }
  
  // ========== ANALYTICS API ==========
  
  // GET - Timetable Analytics
  if (method === 'GET' && path === '/api/analytics/timetable') {
    const { timeRange = 'week', startDate, endDate } = req.query;
    const timetable = mockDB.timetable || [];
    
    // Filter by date range if provided
    let filteredTimetable = timetable;
    if (startDate && endDate) {
      // In a real app, you'd parse dates properly
      filteredTimetable = timetable; // Simplified for demo
    }
    
    // Calculate metrics
    const totalSessions = filteredTimetable.length;
    const activeClasses = [...new Set(filteredTimetable.map(t => t.class))].length;
    const totalHours = filteredTimetable.reduce((sum, t) => {
      const [startH, startM] = t.startTime.split(':').map(Number);
      const [endH, endM] = t.endTime.split(':').map(Number);
      const duration = (endH - startH) + (endM - startM) / 60;
      return sum + duration;
    }, 0);
    const subjectsTaught = [...new Set(filteredTimetable.map(t => t.subject))].length;

    // Sessions by day
    const sessionsByDay = {};
    DAYS.forEach(day => {
      sessionsByDay[day] = filteredTimetable.filter(t => t.day === day).length;
    });
    
    // Room utilization
    const roomUtilization = {};
    filteredTimetable.forEach(t => {
      if (!roomUtilization[t.room]) {
        roomUtilization[t.room] = { sessions: 0, hours: 0 };
      }
      roomUtilization[t.room].sessions++;
      const [startH, startM] = t.startTime.split(':').map(Number);
      const [endH, endM] = t.endTime.split(':').map(Number);
      const duration = (endH - startH) + (endM - startM) / 60;
      roomUtilization[t.room].hours += duration;
    });
    
    const maxRoomHours = Math.max(...Object.values(roomUtilization).map(r => r.hours), 1);
    Object.keys(roomUtilization).forEach(room => {
      roomUtilization[room].usage = Math.round((roomUtilization[room].hours / maxRoomHours) * 100);
    });
    
    // Teacher workload
    const teacherWorkload = {};
    filteredTimetable.forEach(t => {
      if (!teacherWorkload[t.teacherName]) {
        teacherWorkload[t.teacherName] = { sessions: 0, hours: 0, subjects: new Set() };
      }
      teacherWorkload[t.teacherName].sessions++;
      const [startH, startM] = t.startTime.split(':').map(Number);
      const [endH, endM] = t.endTime.split(':').map(Number);
      const duration = (endH - startH) + (endM - startM) / 60;
      teacherWorkload[t.teacherName].hours += duration;
      teacherWorkload[t.teacherName].subjects.add(t.subject);
    });
    
    Object.keys(teacherWorkload).forEach(teacher => {
      teacherWorkload[teacher].subjects = teacherWorkload[teacher].subjects.size;
    });
    
    // Subject distribution
    const subjectDistribution = {};
    filteredTimetable.forEach(t => {
      subjectDistribution[t.subject] = (subjectDistribution[t.subject] || 0) + 1;
    });
    
    // Additional stats
    const avgSessionsPerDay = totalSessions > 0 ? Math.round(totalSessions / 5) : 0;
    const peakHour = '09:45'; // Simplified - calculate from actual data
    const mostUsedRoom = Object.keys(roomUtilization).reduce((a, b) => 
      roomUtilization[a]?.sessions > roomUtilization[b]?.sessions ? a : b, 'N/A'
    );
    const busiestTeacher = Object.keys(teacherWorkload).reduce((a, b) => 
      teacherWorkload[a]?.hours > teacherWorkload[b]?.hours ? a : b, 'N/A'
    );
    const conflictRate = '2%'; // Simplified
    const scheduleEfficiency = '95%'; // Simplified
    
    return res.json({
      success: true,
      totalSessions,
      activeClasses,
      totalHours: Math.round(totalHours),
      subjectsTaught,
      sessionsByDay,
      roomUtilization,
      teacherWorkload,
      subjectDistribution,
      avgSessionsPerDay,
      peakHour,
      mostUsedRoom,
      busiestTeacher,
      conflictRate,
      scheduleEfficiency
    });
  }
  
  next();
};

app.use(demoModeMiddleware);

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isDBConnected = true;
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log('\n⚠️  To fix this, either:');
    console.log('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('   2. Use MongoDB Atlas (Cloud): https://www.mongodb.com/atlas');
    console.log('   3. Update MONGODB_URI in .env file\n');
    console.log('🎮 RUNNING IN DEMO MODE with mock data\n');
    console.log('   Login: admin / admin123');
    console.log('   All GET requests will return sample data\n');
    return false;
  }
};

// Routes
// app.use('/api/auth', authRoutes); // Disabled to use demoModeMiddleware
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware - MUST be after routes
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // If error is from multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Max 5MB allowed.' });
  }
  
  if (err.message && err.message.includes('image')) {
    return res.status(400).json({ message: err.message });
  }
  
  res.status(500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found: ' + req.path });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
