import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Calendar, Bell, LogOut, BookText, FileText, User, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import apiService from '../services/api';
import BookReader from '../components/BookReader';
import Timetable from '../components/Timetable';
import Notifications from '../components/Notifications';
import authService from '../services/authService';
import { useSessionHighlighter } from '../hooks/useSessionHighlighter';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';

function StudentPortal() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [gpa, setGpa] = useState(0);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookReader, setShowBookReader] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  
  // Hooks
  const { currentSession, nextSession, isBreakTime } = useSessionHighlighter(timetable);
  const { notificationSettings, updateSettings } = useNotificationScheduler(timetable);

  useEffect(() => {
    checkAuth();
    loadStudentData();
    loadTimetable();
  }, []);

  const checkAuth = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getUser();
    if (user && user.role !== 'student') {
      navigate('/unauthorized');
    }
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const storedData = localStorage.getItem('studentData');
      if (!storedData || storedData === 'undefined') {
        const currentUser = authService.getUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        const data = await apiService.request(`/api/students/${currentUser.id}`);
        localStorage.setItem('studentData', JSON.stringify(data.student));
        setStudent(data.student);
      } else {
        setStudent(JSON.parse(storedData));
      }
      // Load additional data
      if (student) {
        await Promise.all([
          loadGrades(student.id),
          loadAttendance(student.id),
          loadEvents(),
          loadNotifications(student.id),
          loadBooks(student.class)
        ]);
      }
    } catch (err) {
      console.error('Error loading student data:', err);
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async (studentId) => {
    try {
      const data = await apiService.request(`/api/students/${studentId}/grades`);
      setGrades(data.grades || []);
      calculateGPA(data.grades || []);
    } catch (err) {
      // Demo data if API not ready
      const demoGrades = [
        { course: 'Mathematics', grade: 'A', score: 85, term: 'Term 1' },
        { course: 'Software Development', grade: 'A+', score: 92, term: 'Term 1' },
        { course: 'Database Management', grade: 'B+', score: 78, term: 'Term 1' },
        { course: 'Network Administration', grade: 'A', score: 88, term: 'Term 1' }
      ];
      setGrades(demoGrades);
      calculateGPA(demoGrades);
    }
  };

  const loadAttendance = async (studentId) => {
    try {
      const data = await apiService.request(`/api/students/${studentId}/attendance`);
      setAttendance(data.attendance || []);
    } catch (err) {
      // Demo data
      setAttendance([
        { date: '2024-01-15', status: 'present', course: 'Software Development' },
        { date: '2024-01-16', status: 'present', course: 'Mathematics' },
        { date: '2024-01-17', status: 'absent', course: 'Database Management' },
        { date: '2024-01-18', status: 'present', course: 'Network Administration' }
      ]);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await apiService.request('/api/events');
      setEvents(data.events || []);
    } catch (err) {
      // Demo data
      setEvents([
        { id: 1, title: 'Final Exams Begin', date: '2024-02-15', type: 'exam', description: 'End of semester examinations' },
        { id: 2, title: 'Career Day', date: '2024-02-20', type: 'event', description: 'Meet with industry professionals' },
        { id: 3, title: 'Graduation Ceremony', date: '2024-03-10', type: 'ceremony', description: 'Annual graduation ceremony' }
      ]);
    }
  };

  const loadNotifications = async (studentId) => {
    try {
      const data = await apiService.request(`/api/students/${studentId}/notifications`);
      setNotifications(data.notifications || []);
    } catch (err) {
      // Demo notifications
      setNotifications([
        { id: 1, title: 'New Grade Posted', message: 'Your Software Development grade has been updated', date: '2024-01-20', read: false },
        { id: 2, title: 'Exam Schedule', message: 'Final exam schedule is now available', date: '2024-01-18', read: true },
        { id: 3, title: 'Fee Payment', message: 'Please pay your remaining balance', date: '2024-01-15', read: true }
      ]);
    }
  };

  const loadBooks = async (studentClass) => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();
      setAvailableBooks(data.books?.filter(b => b.class === studentClass) || []);
    } catch (err) {
      console.error('Error loading books:', err);
    }
  };

  const calculateGPA = (gradesData) => {
    if (!gradesData || gradesData.length === 0) return;
    
    const gradePoints = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0.0
    };
    
    let totalPoints = 0;
    gradesData.forEach(g => {
      totalPoints += gradePoints[g.grade] || 0;
    });
    
    setGpa((totalPoints / gradesData.length).toFixed(2));
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const loadTimetable = async () => {
    try {
      setTimetableLoading(true);
      if (student && student.class) {
        const data = await apiService.request('/api/timetable', 'GET', null, { 
          classFilter: student.class 
        });
        setTimetable(data.timetable || []);
      }
    } catch (err) {
      console.error('Error loading timetable:', err);
    } finally {
      setTimetableLoading(false);
    }
  };

  const getAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present').length;
    return Math.round((present / attendance.length) * 100);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read).length;
  };

  if (loading) return <div className="loading">Loading your portal...</div>;

  if (!student) return <div className="loading">Please login first</div>;

  return (
    <div className="page student-portal">
      {/* Header */}
      <div className="portal-header">
        <div className="student-profile">
          <div className="student-avatar">
            {student.photo ? (
              <img src={student.photo} alt={student.name} />
            ) : (
              <span className="avatar-initial">{student.name?.charAt(0)}</span>
            )}
          </div>
          <div className="student-info">
            <h2>Welcome, {student.name}</h2>
            <p className="student-id">Login: {student.studentId} | ID: {student.id} | Class: {student.class}</p>
          </div>
        </div>
        <div className="portal-actions">
          <Notifications />
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Session Status Bar */}
      {(currentSession || nextSession || isBreakTime) && (
        <div className={`session-status-bar ${isBreakTime ? 'break' : currentSession ? 'active' : 'upcoming'}`}>
          <div className="status-content">
            {isBreakTime ? (
              <>
                <Clock size={18} />
                <span>Break Time - Next: {nextSession?.subject} at {nextSession?.startTime}</span>
              </>
            ) : currentSession ? (
              <>
                <CheckCircle size={18} />
                <span>Now: {currentSession.subject} ({currentSession.startTime} - {currentSession.endTime})</span>
              </>
            ) : (
              <>
                <Bell size={18} />
                <span>Upcoming: {nextSession?.subject} at {nextSession?.startTime}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="portal-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'grades' ? 'active' : ''}
          onClick={() => setActiveTab('grades')}
        >
          📚 Grades
        </button>
        <button 
          className={activeTab === 'attendance' ? 'active' : ''}
          onClick={() => setActiveTab('attendance')}
        >
          📅 Attendance
        </button>
        <button 
          className={activeTab === 'timetable' ? 'active' : ''}
          onClick={() => setActiveTab('timetable')}
        >
          🗓️ Timetable
        </button>
        <button 
          className={activeTab === 'books' ? 'active' : ''}
          onClick={() => setActiveTab('books')}
        >
          � Books
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          🎉 Events
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card gpa-card">
              <div className="stat-icon">🎯</div>
              <h3>Current GPA</h3>
              <p className="stat-number">{gpa}</p>
              <span className="stat-label">Out of 4.0</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <h3>Courses</h3>
              <p className="stat-number">{grades.length}</p>
              <span className="stat-label">This Semester</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <h3>Attendance</h3>
              <p className="stat-number">{getAttendancePercentage()}%</p>
              <span className="stat-label">Present Rate</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔔</div>
              <h3>Notifications</h3>
              <p className="stat-number">{getUnreadNotifications()}</p>
              <span className="stat-label">Unread</span>
            </div>
          </div>

          {/* Recent Grades & Events */}
          <div className="dashboard-grid">
            <div className="dashboard-section">
              <h3>📚 Recent Grades</h3>
              <div className="grades-list">
                {grades.slice(0, 4).map((grade, index) => (
                  <div key={index} className="grade-item">
                    <div className="grade-course">{grade.course}</div>
                    <div className={`grade-badge ${grade.grade?.startsWith('A') ? 'excellent' : grade.grade?.startsWith('B') ? 'good' : 'average'}`}>
                      {grade.grade || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('grades')} className="view-all-btn">
                View All Grades →
              </button>
            </div>

            <div className="dashboard-section">
              <h3>📅 Upcoming Events</h3>
              <div className="events-list">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className={`event-item ${event.type}`}>
                    <div className="event-date">
                      <span className="date-day">{new Date(event.date).getDate()}</span>
                      <span className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <p>{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('events')} className="view-all-btn">
                View All Events →
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-section full-width">
            <h3>🔔 Recent Notifications</h3>
            <div className="notifications-list">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                  <div className="notification-dot"></div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-date">{notification.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <div className="grades-content">
          <div className="gpa-display">
            <div className="gpa-circle">
              <span className="gpa-value">{gpa}</span>
              <span className="gpa-label">GPA</span>
            </div>
            <div className="gpa-info">
              <h3>Academic Performance</h3>
              <p>Based on {grades.length} courses this semester</p>
            </div>
          </div>
          
          <div className="grades-table-container">
            <table className="grades-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Term</th>
                  <th>Score (%)</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade, index) => (
                  <tr key={index}>
                    <td>{grade.course}</td>
                    <td>{grade.term}</td>
                    <td>{grade.score}%</td>
                    <td>
                      <span className={`grade-tag ${grade.grade?.startsWith('A') ? 'excellent' : grade.grade?.startsWith('B') ? 'good' : 'average'}`}>
                        {grade.grade || 'N/A'}
                      </span>
                    </td>
                    <td>{grade.score >= 50 ? '✅ Pass' : '❌ Fail'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="attendance-content">
          <div className="attendance-summary">
            <div className="attendance-stat">
              <div className="stat-circle present">
                <span>{attendance.filter(a => a.status === 'present').length}</span>
              </div>
              <label>Present</label>
            </div>
            <div className="attendance-stat">
              <div className="stat-circle absent">
                <span>{attendance.filter(a => a.status === 'absent').length}</span>
              </div>
              <label>Absent</label>
            </div>
            <div className="attendance-stat">
              <div className="stat-circle total">
                <span>{attendance.length}</span>
              </div>
              <label>Total Days</label>
            </div>
          </div>

          <div className="attendance-list">
            <h3>Attendance History</h3>
            {attendance.map((record, index) => (
              <div key={index} className={`attendance-item ${record.status}`}>
                <div className="attendance-date">
                  <span className="date-icon">📅</span>
                  {record.date}
                </div>
                <div className="attendance-course">{record.course}</div>
                <div className={`attendance-status ${record.status}`}>
                  {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <div className="timetable-content">
          <Timetable 
            classFilter={student?.class}
            teachers={[]}
            subjects={[]}
            readOnly={true}
          />
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="courses-content">
          <h3>My Enrolled Courses</h3>
          <div className="student-courses-grid">
            {grades.map((grade, index) => (
              <div key={index} className="student-course-card">
                <div className="course-header">
                  <span className="course-icon">📚</span>
                  <h4>{grade.course}</h4>
                </div>
                <div className="course-grade">
                  <span className="grade-label">Current Grade</span>
                  <span className={`grade-value ${grade.grade?.startsWith('A') ? 'excellent' : grade.grade?.startsWith('B') ? 'good' : 'average'}`}>
                    {grade.grade || 'N/A'}
                  </span>
                </div>
                <div className="course-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${grade.score}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{grade.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="events-content">
          <h3>School Events & Announcements</h3>
          <div className="events-timeline">
            {events.map((event) => (
              <div key={event.id} className={`timeline-item ${event.type}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="event-header">
                    <span className={`event-type-badge ${event.type}`}>
                      {event.type === 'exam' ? '📝 Exam' : event.type === 'ceremony' ? '🎓 Ceremony' : '📢 Event'}
                    </span>
                    <span className="event-date-full">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="books-section">
          <h2><BookOpen size={24} /> My Digital Library</h2>
          <p className="section-desc">Access your course materials and e-books</p>
          
          <div className="books-grid">
            {availableBooks.length === 0 ? (
              <div className="no-books">
                <p>No books available for your class yet.</p>
              </div>
            ) : (
              availableBooks.map((book, index) => (
                <div key={book._id || index} className="book-card" onClick={() => {
                  setSelectedBook(book);
                  setShowBookReader(true);
                }}>
                  <div className="book-cover">
                    <BookOpen size={48} />
                    <span className="subject-tag">{book.subject}</span>
                  </div>
                  <div className="book-info">
                    <h4>{book.title}</h4>
                    <p className="author">by {book.author}</p>
                    <p className="class">Class: {book.class}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Book Reader Modal */}
      {showBookReader && selectedBook && (
        <BookReader 
          book={selectedBook} 
          onClose={() => {
            setShowBookReader(false);
            setSelectedBook(null);
          }} 
        />
      )}
    </div>
  );
};

export default StudentPortal;
