import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, Calendar, LogOut, GraduationCap, Plus, Edit2, Trash2, Save, X, Search, Filter, FileText, BarChart3, Clock } from 'lucide-react';
import './TeacherDashboard.css';
import authService from '../services/authService';
import Timetable from '../components/Timetable';
import Notifications from '../components/Notifications';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showEditGradeModal, setShowEditGradeModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    class: 'S4'
  });
  
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    courseId: '',
    score: 0,
    term: 'Term 1',
    remarks: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    subject: '',
    description: '',
    content: '',
    class: 'S4',
    fileUrl: ''
  });
  
  const [noteForm, setNoteForm] = useState({
    title: '',
    subject: '',
    content: '',
    class: 'S4'
  });

  useEffect(() => {
    const teacherData = localStorage.getItem('user');
    if (!teacherData) {
      navigate('/teacher-login');
      return;
    }
    try {
      const parsed = JSON.parse(teacherData);
      if (parsed.role !== 'teacher') {
        navigate('/login');
        return;
      }
      setTeacher(parsed);
      loadTeacherData(parsed);
    } catch (err) {
      navigate('/teacher-login');
    }
  }, [navigate]);

  const loadTeacherData = async (teacherData) => {
    try {
      setLoading(true);
      // Load students
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      setStudents(studentsData.students || []);

      // Load courses
      const coursesRes = await fetch('/api/courses');
      const coursesData = await coursesRes.json();
      // Filter courses by teacher's subjects
      const myCourses = (coursesData.courses || []).filter(c => 
        teacherData.subjects?.some(s => c.name?.toLowerCase().includes(s.toLowerCase()))
      );
      setCourses(myCourses);
      
      // Load grades
      const gradesRes = await fetch('/api/grades');
      const gradesData = await gradesRes.json();
      setGrades(gradesData.grades || []);
      
      // Load books
      const booksRes = await fetch('/api/books');
      const booksData = await booksRes.json();
      setBooks(booksData.books || []);
      
      // Load notes
      const notesRes = await fetch('/api/notes');
      const notesData = await notesRes.json();
      setNotes(notesData.notes || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Course Management Functions
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses([...courses, data.course]);
        setShowCourseModal(false);
        setCourseForm({ name: '', code: '', description: '', credits: 3, class: 'S4' });
        alert('Course added successfully!');
      }
    } catch (err) {
      console.error('Error adding course:', err);
      alert('Failed to add course');
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(courses.map(c => c._id === selectedCourse._id ? data.course : c));
        setShowEditCourseModal(false);
        setSelectedCourse(null);
        alert('Course updated successfully!');
      }
    } catch (err) {
      console.error('Error updating course:', err);
      alert('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setCourses(courses.filter(c => c._id !== courseId));
        alert('Course deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course');
    }
  };

  // Grade Management Functions
  const handleAddGrade = async (e) => {
    e.preventDefault();
    try {
      const gradeData = {
        ...gradeForm,
        grade: calculateGrade(gradeForm.score)
      };
      
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrades([...grades, data.grade]);
        setShowGradeModal(false);
        setGradeForm({ studentId: '', courseId: '', score: 0, term: 'Term 1', remarks: '' });
        alert('Grade added successfully!');
      }
    } catch (err) {
      console.error('Error adding grade:', err);
      alert('Failed to add grade');
    }
  };

  const handleEditGrade = async (e) => {
    e.preventDefault();
    try {
      const gradeData = {
        ...gradeForm,
        grade: calculateGrade(gradeForm.score)
      };
      
      const response = await fetch(`/api/grades/${selectedGrade._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setGrades(grades.map(g => g._id === selectedGrade._id ? data.grade : g));
        setShowEditGradeModal(false);
        setSelectedGrade(null);
        alert('Grade updated successfully!');
      }
    } catch (err) {
      console.error('Error updating grade:', err);
      alert('Failed to update grade');
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      const response = await fetch(`/api/grades/${gradeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setGrades(grades.filter(g => g._id !== gradeId));
        alert('Grade deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting grade:', err);
      alert('Failed to delete grade');
    }
  };

  const calculateGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const openEditCourse = (course) => {
    setSelectedCourse(course);
    setCourseForm({
      name: course.name,
      code: course.code,
      description: course.description || '',
      credits: course.credits,
      class: course.class
    });
    setShowEditCourseModal(true);
  };

  const openEditGrade = (grade) => {
    setSelectedGrade(grade);
    setGradeForm({
      studentId: grade.studentId,
      courseId: grade.courseId,
      score: grade.score,
      term: grade.term,
      remarks: grade.remarks || ''
    });
    setShowEditGradeModal(true);
  };

  // Book Management Functions
  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...bookForm, teacherId: teacher?.username})
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks([...books, data.book]);
        setShowBookModal(false);
        setBookForm({ title: '', author: '', subject: '', description: '', content: '', class: 'S4', fileUrl: '' });
        alert('Book uploaded successfully!');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      alert('Failed to upload book');
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/books/${selectedBook._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks(books.map(b => b._id === selectedBook._id ? data.book : b));
        setShowEditBookModal(false);
        setSelectedBook(null);
        alert('Book updated successfully!');
      }
    } catch (err) {
      console.error('Error updating book:', err);
      alert('Failed to update book');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setBooks(books.filter(b => b._id !== bookId));
        alert('Book deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('Failed to delete book');
    }
  };

  const openEditBook = (book) => {
    setSelectedBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      subject: book.subject,
      description: book.description,
      content: book.content,
      class: book.class,
      fileUrl: book.fileUrl || ''
    });
    setShowEditBookModal(true);
  };

  // Notes Management Functions (Simple)
  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...noteForm, teacherId: teacher?.username})
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes([...notes, data.note]);
        setShowNoteModal(false);
        setNoteForm({ title: '', subject: '', content: '', class: 'S4' });
        alert('Note created successfully!');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to create note');
    }
  };

  const handleEditNote = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/notes/${selectedNote._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(notes.map(n => n._id === selectedNote._id ? data.note : n));
        setShowEditNoteModal(false);
        setSelectedNote(null);
        alert('Note updated successfully!');
      }
    } catch (err) {
      console.error('Error updating note:', err);
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNotes(notes.filter(n => n._id !== noteId));
        alert('Note deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  };

  const openEditNote = (note) => {
    setSelectedNote(note);
    setNoteForm({
      title: note.title,
      subject: note.subject,
      content: note.content,
      class: note.class
    });
    setShowEditNoteModal(true);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="teacher-dashboard">
      {/* Sidebar */}
      <aside className="teacher-sidebar">
        <div className="teacher-profile">
          <div className="teacher-avatar">
            {teacher.name?.charAt(0).toUpperCase()}
          </div>
          <h3>{teacher.name}</h3>
          <p className="teacher-role">Teacher</p>
          <p className="teacher-dept">{teacher.department}</p>
          <div className="teacher-subjects">
            {teacher.subjects?.map((subject, idx) => (
              <span key={idx} className="subject-tag">{subject}</span>
            ))}
          </div>
        </div>

        <nav className="teacher-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <BookOpen size={18} /> Overview
          </button>
          <button 
            className={activeTab === 'students' ? 'active' : ''}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} /> My Students
          </button>
          <button 
            className={activeTab === 'courses' ? 'active' : ''}
            onClick={() => setActiveTab('courses')}
          >
            <BookOpen size={18} /> My Courses
          </button>
          <button 
            className={activeTab === 'grades' ? 'active' : ''}
            onClick={() => setActiveTab('grades')}
          >
            <Award size={18} /> Grades
          </button>
          <button 
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar size={18} /> Attendance
          </button>
          <button 
            className={activeTab === 'books' ? 'active' : ''}
            onClick={() => setActiveTab('books')}
          >
            <BookOpen size={18} /> My Books
          </button>
          <button 
            className={activeTab === 'notes' ? 'active' : ''}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={18} /> My Notes
          </button>
          <button 
            className={activeTab === 'timetable' ? 'active' : ''}
            onClick={() => setActiveTab('timetable')}
          >
            <Clock size={18} /> Timetable
          </button>
          <button 
            className="reports-link"
            onClick={() => navigate('/reports')}
          >
            <BarChart3 size={18} /> Reports
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="teacher-main">
        {activeTab === 'overview' && (
          <div className="teacher-overview">
            <h1>Welcome, {teacher.name}!</h1>
            <p className="teacher-login-id">Login: {teacher.username} | {teacher.subjects?.join(', ')}</p>
            <div className="stats-grid">
              <div className="stat-card">
                <Users size={32} />
                <h3>{students.length}</h3>
                <p>Total Students</p>
              </div>
              <div className="stat-card">
                <BookOpen size={32} />
                <h3>{courses.length}</h3>
                <p>My Courses</p>
              </div>
              <div className="stat-card">
                <GraduationCap size={32} />
                <h3>{teacher.subjects?.length || 0}</h3>
                <p>Subjects</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="teacher-students">
            <h2>My Students</h2>
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Class</th>
                    <th>Email</th>
                    <th>GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id || student.id}>
                      <td>{student.name}</td>
                      <td>{student.studentId}</td>
                      <td>{student.class}</td>
                      <td>{student.email}</td>
                      <td>{student.gpa || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="teacher-courses">
            <div className="section-header">
              <h2>My Courses</h2>
              <button className="btn-add" onClick={() => setShowCourseModal(true)}>
                <Plus size={18} /> Add Course
              </button>
            </div>
            
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="courses-table-container">
              <table className="courses-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Class</th>
                    <th>Credits</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.filter(c => 
                    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(course => (
                    <tr key={course._id}>
                      <td>{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.class}</td>
                      <td>{course.credits}</td>
                      <td>{course.description?.substring(0, 50)}...</td>
                      <td className="actions">
                        <button className="btn-edit" onClick={() => openEditCourse(course)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteCourse(course._id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="teacher-grades">
            <div className="section-header">
              <h2>Manage Grades</h2>
              <button className="btn-add" onClick={() => setShowGradeModal(true)}>
                <Plus size={18} /> Add Grade
              </button>
            </div>
            
            <div className="grades-table-container">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Term</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(grade => (
                    <tr key={grade._id}>
                      <td>{students.find(s => s.studentId === grade.studentId)?.name || grade.studentId}</td>
                      <td>{courses.find(c => c._id === grade.courseId)?.name || grade.courseId}</td>
                      <td>{grade.score}%</td>
                      <td>
                        <span className={`grade-badge ${grade.grade?.startsWith('A') ? 'excellent' : grade.grade?.startsWith('B') ? 'good' : 'average'}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td>{grade.term}</td>
                      <td>{grade.remarks}</td>
                      <td className="actions">
                        <button className="btn-edit" onClick={() => openEditGrade(grade)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteGrade(grade._id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="teacher-attendance">
            <h2>Attendance Management</h2>
            <div className="attendance-filters">
              <select className="filter-select">
                <option>Select Class</option>
                <option>S4</option>
                <option>S5</option>
                <option>S6</option>
              </select>
              <input type="date" className="date-picker" />
              <button className="btn-primary">Mark Attendance</button>
            </div>
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>
                      <td>
                        <select className="status-select">
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                      <td><input type="text" placeholder="Remarks..." className="remarks-input" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn-save-attendance">
              <Save size={18} /> Save Attendance
            </button>
          </div>
        )}

        {/* My Books Tab */}
        {activeTab === 'books' && (
          <div className="teacher-books">
            <div className="section-header">
              <h2>My Books</h2>
              <button className="btn-add" onClick={() => setShowBookModal(true)}>
                <Plus size={18} /> Upload Book
              </button>
            </div>
            
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="books-table-container">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.filter(b => 
                    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.author?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map(book => (
                    <tr key={book._id}>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.subject}</td>
                      <td>{book.class}</td>
                      <td>{book.views || 0}</td>
                      <td className="actions">
                        <button className="btn-edit" onClick={() => openEditBook(book)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteBook(book._id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="teacher-timetable">
            <Timetable
              classFilter={teacher?.class || ''}
              teachers={[{ _id: '1', name: 'Teacher One' }, { _id: '2', name: 'Teacher Two' }]}
              subjects={['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science']}
            />
          </div>
        )}

        {/* My Notes Tab */}
        {activeTab === 'notes' && (
          <div className="teacher-notes">
            <div className="section-header">
              <h2>My Notes</h2>
              <button className="btn-add" onClick={() => setShowNoteModal(true)}>
                <Plus size={18} /> Write Note
              </button>
            </div>
            
            <div className="notes-grid">
              {notes.length === 0 ? (
                <div className="no-notes">
                  <p>No notes yet. Click "Write Note" to create one.</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note._id} className="note-card">
                    <div className="note-header">
                      <h4>{note.title}</h4>
                      <span className="subject-badge">{note.subject}</span>
                    </div>
                    <p className="note-class">Class: {note.class}</p>
                    <p className="note-preview">{note.content?.substring(0, 100)}...</p>
                    <div className="note-actions">
                      <button className="btn-edit" onClick={() => openEditNote(note)}>
                        <Edit2 size={16} /> Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteNote(note._id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Course</h3>
              <button className="btn-close" onClick={() => setShowCourseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="modal-form">
              <div className="form-group">
                <label>Course Name</label>
                <input 
                  type="text" 
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course Code</label>
                <input 
                  type="text" 
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class</label>
                  <select 
                    value={courseForm.class}
                    onChange={(e) => setCourseForm({...courseForm, class: e.target.value})}
                  >
                    <option>S4</option>
                    <option>S5</option>
                    <option>S6</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input 
                    type="number" 
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} /> Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Course</h3>
              <button className="btn-close" onClick={() => setShowEditCourseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditCourse} className="modal-form">
              <div className="form-group">
                <label>Course Name</label>
                <input 
                  type="text" 
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course Code</label>
                <input 
                  type="text" 
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({...courseForm, code: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class</label>
                  <select 
                    value={courseForm.class}
                    onChange={(e) => setCourseForm({...courseForm, class: e.target.value})}
                  >
                    <option>S4</option>
                    <option>S5</option>
                    <option>S6</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Credits</label>
                  <input 
                    type="number" 
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({...courseForm, credits: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} /> Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Grade Modal */}
      {showGradeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Grade</h3>
              <button className="btn-close" onClick={() => setShowGradeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddGrade} className="modal-form">
              <div className="form-group">
                <label>Student</label>
                <select 
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm({...gradeForm, studentId: e.target.value})}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select 
                  value={gradeForm.courseId}
                  onChange={(e) => setGradeForm({...gradeForm, courseId: e.target.value})}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Score (%)</label>
                  <input 
                    type="number" 
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({...gradeForm, score: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Term</label>
                  <select 
                    value={gradeForm.term}
                    onChange={(e) => setGradeForm({...gradeForm, term: e.target.value})}
                  >
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea 
                  value={gradeForm.remarks}
                  onChange={(e) => setGradeForm({...gradeForm, remarks: e.target.value})}
                  rows="2"
                  placeholder="Optional remarks..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowGradeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} /> Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditGradeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Grade</h3>
              <button className="btn-close" onClick={() => setShowEditGradeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditGrade} className="modal-form">
              <div className="form-group">
                <label>Student</label>
                <select 
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm({...gradeForm, studentId: e.target.value})}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Course</label>
                <select 
                  value={gradeForm.courseId}
                  onChange={(e) => setGradeForm({...gradeForm, courseId: e.target.value})}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Score (%)</label>
                  <input 
                    type="number" 
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({...gradeForm, score: parseInt(e.target.value)})}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Term</label>
                  <select 
                    value={gradeForm.term}
                    onChange={(e) => setGradeForm({...gradeForm, term: e.target.value})}
                  >
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea 
                  value={gradeForm.remarks}
                  onChange={(e) => setGradeForm({...gradeForm, remarks: e.target.value})}
                  rows="2"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditGradeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <Save size={16} /> Update Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Write New Note</h3>
              <button className="btn-close" onClick={() => setShowNoteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddNote} className="modal-form">
              <div className="form-group">
                <label>Note Title</label>
                <input type="text" value={noteForm.title}
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select value={noteForm.subject}
                    onChange={(e) => setNoteForm({...noteForm, subject: e.target.value})}>
                    <option value="">Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Biology</option>
                    <option>English</option>
                    <option>History</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select value={noteForm.class}
                    onChange={(e) => setNoteForm({...noteForm, class: e.target.value})}>
                    <option>S4</option>
                    <option>S5</option>
                    <option>S6</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Note Content</label>
                <textarea value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} 
                  rows="10" required 
                  placeholder="Write your note here... Students will be able to read this." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNoteModal(false)}>Cancel</button>
                <button type="submit" className="btn-save"><Save size={16} /> Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Note</h3>
              <button className="btn-close" onClick={() => setShowEditNoteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditNote} className="modal-form">
              <div className="form-group">
                <label>Note Title</label>
                <input type="text" value={noteForm.title}
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select value={noteForm.subject}
                    onChange={(e) => setNoteForm({...noteForm, subject: e.target.value})}>
                    <option value="">Select Subject</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Biology</option>
                    <option>English</option>
                    <option>History</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Class</label>
                  <select value={noteForm.class}
                    onChange={(e) => setNoteForm({...noteForm, class: e.target.value})}>
                    <option>S4</option>
                    <option>S5</option>
                    <option>S6</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Note Content</label>
                <textarea value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} 
                  rows="10" required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditNoteModal(false)}>Cancel</button>
                <button type="submit" className="btn-save"><Save size={16} /> Update Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
