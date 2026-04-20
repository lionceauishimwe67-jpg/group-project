import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function StudentInfo() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [alumniInfo, setAlumniInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStudents();
      setStudents(data.students);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (student) => {
    try {
      const data = await apiService.getStudent(student.id);
      setSelectedStudent(data.student);
      
      // Check if student is in alumni
      try {
        const alumniData = await apiService.searchAlumni(student.name);
        if (alumniData.alumni && alumniData.alumni.length > 0) {
          // Find matching alumni by name
          const matchingAlumni = alumniData.alumni.find(
            a => a.name.toLowerCase() === student.name.toLowerCase()
          );
          setAlumniInfo(matchingAlumni || null);
        } else {
          setAlumniInfo(null);
        }
      } catch (err) {
        setAlumniInfo(null);
      }
    } catch (err) {
      setError('Failed to load student details');
    }
  };

  if (loading) return <div className="loading">Loading students...</div>;

  return (
    <div className="page">
      <h1>Student Information</h1>
      <p className="tagline">Student Directory and Information System</p>

      {error && <div className="error-message">{error}</div>}

      {selectedStudent ? (
        <div className="student-detail">
          <button className="back-btn" onClick={() => setSelectedStudent(null)}>
            &larr; Back to Student List
          </button>
          
          <div className="student-profile">
            {alumniInfo && (
              <div className="alumni-badge">
                <span className="alumni-icon">🎓</span>
                <span className="alumni-text">Alumni</span>
                <a href={`/alumni?name=${encodeURIComponent(alumniInfo.name)}`} className="view-alumni-link">
                  View Alumni Profile &rarr;
                </a>
              </div>
            )}
            <div className="profile-header">
              <div className="profile-photo-container">
                <img 
                  src={selectedStudent.photo || '/default-avatar.png'} 
                  alt={selectedStudent.name}
                  className="profile-photo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="profile-avatar" style={{display: 'none'}}>
                  {selectedStudent.name?.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="profile-title">
                <h2>{selectedStudent.name}</h2>
                <span className="student-id">ID: {String(selectedStudent.id).padStart(4, '0')}</span>
                <span className={`status-badge ${selectedStudent.status?.toLowerCase()}`}>
                  {selectedStudent.status}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-section">
                <h3>Academic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Grade</label>
                    <span>{selectedStudent.grade || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Class</label>
                    <span>{selectedStudent.class || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>GPA</label>
                    <span>{selectedStudent.gpa || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Enrollment Date</label>
                    <span>{selectedStudent.enrollment_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Age</label>
                    <span>{selectedStudent.age || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedStudent.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <span>{selectedStudent.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Address</label>
                    <span>{selectedStudent.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Guardian Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Guardian Name</label>
                    <span>{selectedStudent.guardian || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Guardian Phone</label>
                    <span>{selectedStudent.guardian_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Skills & Experience Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Skills</label>
                    <span>{selectedStudent.skills || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Experience</label>
                    <span>{selectedStudent.experiences || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Education Background</label>
                    <span>{selectedStudent.education_background || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>GitHub/Project Link</label>
                    <span>
                      {selectedStudent.project_link ? (
                        <a href={selectedStudent.project_link} target="_blank" rel="noopener noreferrer">
                          {selectedStudent.project_link}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Languages Spoken</label>
                    <span>{selectedStudent.languages || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="student-list-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search students by name or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Class</th>
                  <th>GPA</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <img 
                        src={student.photo || '/default-avatar.png'} 
                        alt={student.name}
                        className="student-thumbnail"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="thumbnail-fallback" style={{display: 'none'}}>
                        {student.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                    </td>
                    <td>{String(student.id).padStart(4, '0')}</td>
                    <td className="student-name">{student.name}</td>
                    <td>{student.grade}</td>
                    <td>{student.class}</td>
                    <td className="gpa">{student.gpa}</td>
                    <td>
                      <span className={`status-badge ${student.status?.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewDetails(student)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="no-results">
              <p>No students found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentInfo;
