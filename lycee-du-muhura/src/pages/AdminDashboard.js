import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import TeacherManagement from '../components/TeacherManagement';
import ParentManagement from '../components/ParentManagement';
import EventManagement from '../components/EventManagement';

function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [alumni, setAlumni] = useState([]);
  const [alumniStats, setAlumniStats] = useState(null);
  const [editingAlumnus, setEditingAlumnus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, studentsData, alumniData, alumniStatsData] = await Promise.all([
        apiService.getStudentStats(),
        apiService.getStudents(),
        apiService.getAlumni(),
        apiService.getAlumniStats()
      ]);
      setStats(statsData);
      setStudents(studentsData.students);
      setAlumni(alumniData.alumni);
      setAlumniStats(alumniStatsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      await apiService.deleteStudent(id);
      loadData();
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  const handleDeleteAlumnus = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alumnus?')) {
      return;
    }
    
    try {
      await apiService.deleteAlumnus(id);
      loadData();
    } catch (err) {
      setError('Failed to delete alumnus');
    }
  };

  const handleEditAlumnus = (alumnus) => {
    setEditingAlumnus(alumnus);
    setActiveTab('add-alumni');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <span className="admin-user">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'teachers' ? 'active' : ''}
          onClick={() => setActiveTab('teachers')}
        >
          Teachers
        </button>
        <button
          className={activeTab === 'parents' ? 'active' : ''}
          onClick={() => setActiveTab('parents')}
        >
          Parents
        </button>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Manage Students
        </button>
        <button 
          className={activeTab === 'add-student' ? 'active' : ''}
          onClick={() => setActiveTab('add-student')}
        >
          Add Student
        </button>
        <button 
          className={activeTab === 'alumni' ? 'active' : ''}
          onClick={() => setActiveTab('alumni')}
        >
          Manage Alumni
        </button>
        <button 
          className={activeTab === 'add-alumni' ? 'active' : ''}
          onClick={() => {
            setEditingAlumnus(null);
            setActiveTab('add-alumni');
          }}
        >
          Add Alumni
        </button>
        <button 
          className={activeTab === 'teachers' ? 'active' : ''}
          onClick={() => setActiveTab('teachers')}
        >
          Manage Teachers
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'overview' && stats && (
        <div className="dashboard-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.totalStudents}</p>
            </div>
            <div className="stat-card">
              <h3>Active Students</h3>
              <p className="stat-number">{stats.activeStudents}</p>
            </div>
            <div className="stat-card">
              <h3>Classes</h3>
              <p className="stat-number">{stats.byClass?.length || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Alumni</h3>
              <p className="stat-number">{alumniStats?.totalAlumni || 0}</p>
            </div>
          </div>

          <div className="stats-sections">
            <div className="stats-section">
              <h3>Students by Class</h3>
              <ul className="stats-list">
                {stats.byClass?.map((item, index) => (
                  <li key={index}>
                    <span>{item.class}</span>
                    <span className="count">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="stats-section">
              <h3>Students by Grade</h3>
              <ul className="stats-list">
                {stats.byGrade?.map((item, index) => (
                  <li key={index}>
                    <span>{item.grade}</span>
                    <span className="count">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="students-management">
          <h2>Student Management</h2>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.class}</td>
                    <td>
                      <span className={`status-badge ${student.status?.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/edit-student/${student.id}`} className="edit-btn">
                        Edit
                      </Link>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'add-student' && (
        <StudentForm onSuccess={() => {
          loadData();
          setActiveTab('students');
        }} />
      )}

      {activeTab === 'alumni' && (
        <div className="alumni-management">
          <h2>Alumni Management</h2>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Graduation Year</th>
                  <th>Course</th>
                  <th>Company</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alumni.map(alumnus => (
                  <tr key={alumnus.id}>
                    <td>{alumnus.id}</td>
                    <td>{alumnus.name}</td>
                    <td>{alumnus.graduation_year}</td>
                    <td>{alumnus.course_studied}</td>
                    <td>{alumnus.company}</td>
                    <td>
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditAlumnus(alumnus)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteAlumnus(alumnus.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'add-alumni' && (
        <AlumniForm 
          onSuccess={() => {
            loadData();
            setActiveTab('alumni');
            setEditingAlumnus(null);
          }} 
          initialData={editingAlumnus}
        />
      )}

      {activeTab === 'teachers' && (
        <TeacherManagement />
      )}

      {activeTab === 'parents' && (
        <ParentManagement />
      )}

      {activeTab === 'events' && (
        <EventManagement />
      )}
    </div>
  );
}

function StudentForm({ onSuccess, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    photo: '',
    age: '',
    grade: '',
    class: '',
    email: '',
    phone: '',
    address: '',
    enrollment_date: '',
    guardian: '',
    guardian_phone: '',
    status: 'Active',
    gpa: '',
    skills: '',
    experiences: '',
    education_background: '',
    project_link: '',
    languages: '',
    graduation_year: '',
    current_position: '',
    company: '',
    bio: '',
    achievements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoPath = formData.photo;

      // Upload photo if a file was selected
      if (selectedFile) {
        const uploadResult = await apiService.uploadPhoto(selectedFile);
        photoPath = uploadResult.photoPath;
      }

      const studentData = {
        ...formData,
        photo: photoPath
      };

      if (initialData) {
        await apiService.updateStudent(initialData.id, studentData);
      } else {
        await apiService.createStudent(studentData);
      }
      onSuccess();
    } catch (err) {
      alert('Error saving student: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-form">
      <h2>{initialData ? 'Edit Student' : 'Add New Student'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Photo Upload Section */}
          <div className="form-group full-width photo-upload-section">
            <label>Student Photo</label>
            <div className="photo-upload-container">
              {(previewUrl || formData.photo) ? (
                <div className="photo-preview">
                  <img 
                    src={previewUrl || formData.photo} 
                    alt="Student preview" 
                    className="preview-image"
                  />
                  <button 
                    type="button" 
                    className="remove-photo-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setFormData(prev => ({ ...prev, photo: '' }));
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p>Click to upload student photo</p>
                  <span className="upload-hint">JPG, PNG (Max 5MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={handleFileChange}
                className="file-input"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="file-input-label">
                {selectedFile ? 'Change Photo' : 'Choose Photo'}
              </label>
              <p className="upload-hint-extended">JPG, PNG, GIF, WebP, HEIC (Max 5MB)</p>
            </div>
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Class</label>
            <input 
              name="class" 
              value={formData.class} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Grade</label>
            <input 
              name="grade" 
              value={formData.grade} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input 
              name="age" 
              type="number"
              value={formData.age} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Guardian</label>
            <input 
              name="guardian" 
              value={formData.guardian} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Guardian Phone</label>
            <input 
              name="guardian_phone" 
              value={formData.guardian_phone} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Graduated">Graduated</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div className="form-group">
            <label>GPA</label>
            <input 
              name="gpa" 
              value={formData.gpa} 
              onChange={handleChange} 
            />
          </div>

          {/* New Fields Section */}
          <div className="form-group full-width" style={{marginTop: '20px', borderTop: '2px solid #87CEEB', paddingTop: '20px'}}>
            <h3 style={{color: '#1E3A5F', marginBottom: '15px'}}>🎓 Skills & Experience Information</h3>
          </div>

          <div className="form-group">
            <label>Skills</label>
            <input 
              name="skills" 
              value={formData.skills} 
              onChange={handleChange} 
              placeholder="e.g., React, Node.js, Python"
            />
          </div>
          <div className="form-group">
            <label>Experience</label>
            <input 
              name="experiences" 
              value={formData.experiences} 
              onChange={handleChange} 
              placeholder="e.g., Intern at XYZ Company"
            />
          </div>
          <div className="form-group full-width">
            <label>Education Background</label>
            <textarea 
              name="education_background" 
              value={formData.education_background} 
              onChange={handleChange} 
              placeholder="e.g., High School: Lycée du Muhura"
              rows="2"
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit'}}
            />
          </div>
          <div className="form-group">
            <label>Project Link (GitHub/Portfolio)</label>
            <input 
              name="project_link" 
              value={formData.project_link} 
              onChange={handleChange} 
              placeholder="https://github.com/username"
            />
          </div>
          <div className="form-group">
            <label>Languages Spoken</label>
            <input 
              name="languages" 
              value={formData.languages} 
              onChange={handleChange} 
              placeholder="e.g., Kinyarwanda, English, French"
            />
          </div>

          {/* Alumni Fields Section - Only show if status is Graduated or Inactive */}
          {(formData.status === 'Graduated' || formData.status === 'Inactive') && (
            <>
              <div className="form-group full-width" style={{marginTop: '20px', borderTop: '2px solid #FFD700', paddingTop: '20px'}}>
                <h3 style={{color: '#1E3A5F', marginBottom: '15px'}}>🎓 Alumni Information (Auto-saved to Alumni)</h3>
              </div>

              <div className="form-group">
                <label>Graduation Year</label>
                <input 
                  name="graduation_year" 
                  type="number"
                  value={formData.graduation_year} 
                  onChange={handleChange} 
                  placeholder="e.g., 2024"
                />
              </div>
              <div className="form-group">
                <label>Current Position</label>
                <input 
                  name="current_position" 
                  value={formData.current_position} 
                  onChange={handleChange} 
                  placeholder="e.g., Software Developer"
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input 
                  name="company" 
                  value={formData.company} 
                  onChange={handleChange} 
                  placeholder="e.g., Rwanda Tech Ltd"
                />
              </div>
              <div className="form-group full-width">
                <label>Bio / Description</label>
                <textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  placeholder="e.g., Graduated with honors in Software Development"
                  rows="2"
                  style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit'}}
                />
              </div>
              <div className="form-group full-width">
                <label>Achievements</label>
                <textarea 
                  name="achievements" 
                  value={formData.achievements} 
                  onChange={handleChange} 
                  placeholder="e.g., Best Student Award, Internship at Google"
                  rows="2"
                  style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit'}}
                />
              </div>
            </>
          )}
        </div>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Saving...' : (initialData ? 'Update Student' : 'Add Student')}
        </button>
      </form>
    </div>
  );
}

function AlumniForm({ onSuccess, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    photo: '',
    graduation_year: '',
    course_studied: '',
    current_position: '',
    company: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoPath = formData.photo;

      // Upload photo if a file was selected
      if (selectedFile) {
        const uploadResult = await apiService.uploadPhoto(selectedFile);
        photoPath = uploadResult.photoPath;
      }

      const alumniData = {
        ...formData,
        photo: photoPath
      };

      if (initialData) {
        await apiService.updateAlumnus(initialData.id, alumniData);
      } else {
        await apiService.createAlumnus(alumniData);
      }
      onSuccess();
    } catch (err) {
      alert('Error saving alumnus: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-form">
      <h2>{initialData ? 'Edit Alumni' : 'Add New Alumni'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Photo Upload Section */}
          <div className="form-group full-width photo-upload-section">
            <label>Alumni Photo</label>
            <div className="photo-upload-container">
              {(previewUrl || formData.photo) ? (
                <div className="photo-preview">
                  <img 
                    src={previewUrl || formData.photo} 
                    alt="Alumni preview" 
                    className="preview-image"
                  />
                  <button 
                    type="button" 
                    className="remove-photo-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setFormData(prev => ({ ...prev, photo: '' }));
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📷</div>
                  <p>Click to upload alumni photo</p>
                  <span className="upload-hint">JPG, PNG (Max 5MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={handleFileChange}
                className="file-input"
                id="alumni-photo-upload"
              />
              <label htmlFor="alumni-photo-upload" className="file-input-label">
                {selectedFile ? 'Change Photo' : 'Choose Photo'}
              </label>
              <p className="upload-hint-extended">JPG, PNG, GIF, WebP, HEIC (Max 5MB)</p>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Graduation Year *</label>
            <input 
              name="graduation_year" 
              type="number"
              value={formData.graduation_year} 
              onChange={handleChange}
              min="1980"
              max="2030"
              required 
            />
          </div>
          <div className="form-group">
            <label>Course Studied</label>
            <input 
              name="course_studied" 
              value={formData.course_studied} 
              onChange={handleChange}
              placeholder="e.g., Software Development"
            />
          </div>
          <div className="form-group">
            <label>Current Position</label>
            <input 
              name="current_position" 
              value={formData.current_position} 
              onChange={handleChange}
              placeholder="e.g., Software Developer"
            />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input 
              name="company" 
              value={formData.company} 
              onChange={handleChange}
              placeholder="e.g., Rwanda Tech Ltd"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              name="email" 
              type="email"
              value={formData.email} 
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
            />
          </div>
          <div className="form-group full-width">
            <label>Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange}
              placeholder="Brief description about the alumnus"
              rows="3"
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit'}}
            />
          </div>
        </div>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Saving...' : (initialData ? 'Update Alumni' : 'Add Alumni')}
        </button>
      </form>
    </div>
  );
}

export default AdminDashboard;
