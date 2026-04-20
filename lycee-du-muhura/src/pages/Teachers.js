import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Award,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  Star
} from 'lucide-react';
import apiService from '../services/api';
import './Teachers.css';

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const departments = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Geography',
    'Computer Science',
    'Physical Education',
    'Arts'
  ];

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await apiService.request('/api/teachers', 'GET');
      setTeachers(data.teachers || mockTeachers);
    } catch (err) {
      setTeachers(mockTeachers);
    } finally {
      setLoading(false);
    }
  };

  const mockTeachers = [
    {
      id: 1,
      name: 'Dr. Jean Paul Mugabo',
      subject: 'Mathematics',
      department: 'Mathematics',
      email: 'jp.mugabo@lyceemuhura.rw',
      phone: '+250 788 123 456',
      qualification: 'Ph.D. in Mathematics',
      experience: '15 years',
      photo: null,
      bio: 'Expert in calculus and algebra with a passion for making mathematics accessible to all students.',
      achievements: ['Best Teacher Award 2023', 'Published 10 research papers'],
      courses: ['Advanced Calculus', 'Linear Algebra', 'Statistics']
    },
    {
      id: 2,
      name: 'Marie Claire Uwimana',
      subject: 'Physics',
      department: 'Physics',
      email: 'mc.uwimana@lyceemuhura.rw',
      phone: '+250 788 234 567',
      qualification: 'M.Sc. in Physics',
      experience: '12 years',
      photo: null,
      bio: 'Dedicated physics educator with expertise in mechanics and thermodynamics.',
      achievements: ['Innovation in Teaching 2022'],
      courses: ['Mechanics', 'Thermodynamics', 'Quantum Physics']
    },
    {
      id: 3,
      name: 'Emmanuel Ndayisaba',
      subject: 'Chemistry',
      department: 'Chemistry',
      email: 'e.ndayisaba@lyceemuhura.rw',
      phone: '+250 788 345 678',
      qualification: 'M.Sc. in Chemistry',
      experience: '10 years',
      photo: null,
      bio: 'Chemistry specialist with focus on organic and inorganic chemistry.',
      achievements: ['Lab Safety Certification'],
      courses: ['Organic Chemistry', 'Inorganic Chemistry', 'Lab Techniques']
    },
    {
      id: 4,
      name: 'Anne Marie Kanimba',
      subject: 'English',
      department: 'English',
      email: 'am.kanimba@lyceemuhura.rw',
      phone: '+250 788 456 789',
      qualification: 'M.A. in English Literature',
      experience: '18 years',
      photo: null,
      bio: 'Passionate about literature and language arts with extensive teaching experience.',
      achievements: ['Literary Excellence Award', 'Curriculum Developer'],
      courses: ['English Literature', 'Creative Writing', 'Grammar']
    },
    {
      id: 5,
      name: 'Pierre Celestin Nsengiyumva',
      subject: 'Computer Science',
      department: 'Computer Science',
      email: 'pc.nsengiyumva@lyceemuhura.rw',
      phone: '+250 788 567 890',
      qualification: 'B.Sc. in Computer Science',
      experience: '8 years',
      photo: null,
      bio: 'Tech-savvy educator teaching programming and computer fundamentals.',
      achievements: ['Coding Competition Mentor', 'Tech Innovation Award'],
      courses: ['Programming', 'Database Systems', 'Web Development']
    },
    {
      id: 6,
      name: 'Claudette Nyirabashyitsi',
      subject: 'Biology',
      department: 'Biology',
      email: 'c.nyirabashyitsi@lyceemuhura.rw',
      phone: '+250 788 678 901',
      qualification: 'M.Sc. in Biology',
      experience: '14 years',
      photo: null,
      bio: 'Biologist with expertise in genetics and environmental science.',
      achievements: ['Research Grant Recipient', 'Science Fair Judge'],
      courses: ['Genetics', 'Ecology', 'Anatomy']
    }
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || teacher.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="teachers-page">
        <div className="loading">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="teachers-page">
      {/* Hero Section */}
      <div className="teachers-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <GraduationCap size={20} />
            <span>Our Faculty</span>
          </div>
          <h1>Meet Our Dedicated Teachers</h1>
          <p>Experienced educators committed to excellence in teaching and student success</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{teachers.length}</span>
              <span className="stat-label">Teachers</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{teachers.reduce((sum, t) => sum + parseInt(t.experience) || 0, 0)}</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{departments.length}</span>
              <span className="stat-label">Departments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="teachers-filter">
        <div className="filter-container">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search teachers by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="department-filter">
            <Filter size={18} />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="teachers-container">
        <div className="teachers-grid">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="teacher-card" onClick={() => setSelectedTeacher(teacher)}>
              <div className="teacher-photo">
                {teacher.photo ? (
                  <img src={teacher.photo} alt={teacher.name} />
                ) : (
                  <div className="photo-placeholder">
                    <span>{teacher.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                )}
                <div className="teacher-badge">
                  <Star size={14} fill="currentColor" />
                </div>
              </div>
              
              <div className="teacher-info">
                <h3>{teacher.name}</h3>
                <p className="teacher-subject">{teacher.subject}</p>
                <p className="teacher-department">{teacher.department}</p>
                
                <div className="teacher-meta">
                  <span className="meta-item">
                    <Award size={14} />
                    {teacher.qualification}
                  </span>
                  <span className="meta-item">
                    <Calendar size={14} />
                    {teacher.experience}
                  </span>
                </div>
                
                <div className="teacher-courses">
                  <span>Courses:</span>
                  <div className="course-tags">
                    {teacher.courses.slice(0, 2).map((course, idx) => (
                      <span key={idx} className="course-tag">{course}</span>
                    ))}
                    {teacher.courses.length > 2 && (
                      <span className="course-tag more">+{teacher.courses.length - 2}</span>
                    )}
                  </div>
                </div>
                
                <button className="view-profile-btn">
                  View Profile <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Teacher Profile</h2>
              <button onClick={() => setSelectedTeacher(null)} className="close-btn">
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="modal-photo">
                {selectedTeacher.photo ? (
                  <img src={selectedTeacher.photo} alt={selectedTeacher.name} />
                ) : (
                  <div className="photo-placeholder large">
                    <span>{selectedTeacher.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                )}
              </div>
              
              <div className="modal-details">
                <h3>{selectedTeacher.name}</h3>
                <p className="modal-subject">{selectedTeacher.subject}</p>
                <p className="modal-bio">{selectedTeacher.bio}</p>
                
                <div className="modal-meta">
                  <div className="meta-row">
                    <span className="meta-label">
                      <Award size={16} /> Qualification:
                    </span>
                    <span className="meta-value">{selectedTeacher.qualification}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">
                      <Calendar size={16} /> Experience:
                    </span>
                    <span className="meta-value">{selectedTeacher.experience}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">
                      <MapPin size={16} /> Department:
                    </span>
                    <span className="meta-value">{selectedTeacher.department}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">
                      <Mail size={16} /> Email:
                    </span>
                    <span className="meta-value">{selectedTeacher.email}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">
                      <Phone size={16} /> Phone:
                    </span>
                    <span className="meta-value">{selectedTeacher.phone}</span>
                  </div>
                </div>
                
                <div className="modal-section">
                  <h4>Courses Taught</h4>
                  <div className="course-list">
                    {selectedTeacher.courses.map((course, idx) => (
                      <span key={idx} className="course-badge">
                        <BookOpen size={14} />
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="modal-section">
                  <h4>Achievements</h4>
                  <div className="achievement-list">
                    {selectedTeacher.achievements.map((achievement, idx) => (
                      <div key={idx} className="achievement-item">
                        <Star size={16} fill="currentColor" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;
