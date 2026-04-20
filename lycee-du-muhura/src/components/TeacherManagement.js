import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Shield,
  Mail,
  BookOpen
} from 'lucide-react';
import apiService from '../services/api';
import './TeacherManagement.css';

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    name: '',
    subjects: '',
    department: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await apiService.request('/api/teachers', 'GET');
      setTeachers(data.teachers || []);
    } catch (err) {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
      await apiService.request('/api/teachers', 'POST', {
        userId: formData.userId,
        password: formData.password,
        name: formData.name,
        subjects,
        department: formData.department
      });
      setSuccess('Teacher added successfully');
      setFormData({ userId: '', password: '', name: '', subjects: '', department: '' });
      setShowAddModal(false);
      loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to add teacher');
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
      await apiService.request(`/api/teachers/${selectedTeacher._id}`, 'PUT', {
        password: formData.password,
        name: formData.name,
        subjects,
        department: formData.department
      });
      setSuccess('Teacher updated successfully');
      setShowEditModal(false);
      setSelectedTeacher(null);
      loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await apiService.request(`/api/teachers/${teacherId}`, 'DELETE');
      setSuccess('Teacher removed successfully');
      loadTeachers();
    } catch (err) {
      setError(err.message || 'Failed to delete teacher');
    }
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      userId: teacher.userId,
      password: teacher.password,
      name: teacher.name,
      subjects: teacher.subjects && teacher.subjects.join ? teacher.subjects.join(', ') : '',
      department: teacher.department
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedTeacher(null);
    setFormData({ userId: '', password: '', name: '', subjects: '', department: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="teacher-management">
      <div className="management-header">
        <div className="header-title">
          <Shield size={24} />
          <h2>Teacher Credentials Management</h2>
        </div>
        <button onClick={() => setShowAddModal(true)} className="add-teacher-btn">
          <UserPlus size={18} />
          Add Teacher
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {loading ? (
        <div className="loading">Loading teachers...</div>
      ) : (
        <div className="teachers-list">
          <div className="list-header">
            <div className="header-cell">User ID</div>
            <div className="header-cell">Name</div>
            <div className="header-cell">Department</div>
            <div className="header-cell">Subjects</div>
            <div className="header-cell">Actions</div>
          </div>
          {teachers.map(teacher => (
            <div key={teacher._id} className="teacher-row">
              <div className="row-cell">
                <span className="cell-label">User ID:</span>
                <span className="cell-value">{teacher.userId}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Name:</span>
                <span className="cell-value">{teacher.name}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Department:</span>
                <span className="cell-value">{teacher.department}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Subjects:</span>
                <div className="cell-value subjects-list">
                  {teacher.subjects && teacher.subjects.map ? teacher.subjects.map((subj, idx) => (
                    <span key={idx} className="subject-badge">
                      <BookOpen size={12} />
                      {subj}
                    </span>
                  )) : <span className="subject-badge">No subjects</span>}
                </div>
              </div>
              <div className="row-cell actions">
                <button onClick={() => openEditModal(teacher)} className="action-btn edit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteTeacher(teacher._id)} className="action-btn delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="empty-state">
              <Shield size={48} />
              <p>No teachers added yet</p>
              <button onClick={() => setShowAddModal(true)} className="add-first-btn">
                Add First Teacher
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Teacher</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="modal-form">
              <div className="form-group">
                <label>
                  <UserPlus size={16} />
                  User ID *
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="e.g., teacher3"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <Shield size={16} />
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <UserPlus size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <BookOpen size={16} />
                  Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                />
              </div>
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Science"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <Save size={18} />
                  Add Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Teacher</h3>
              <button onClick={closeModal} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateTeacher} className="modal-form">
              <div className="form-group">
                <label>
                  <UserPlus size={16} />
                  User ID (cannot change)
                </label>
                <input
                  type="text"
                  value={formData.userId}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>
                  <Shield size={16} />
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password or leave unchanged"
                />
              </div>
              <div className="form-group">
                <label>
                  <UserPlus size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <BookOpen size={16} />
                  Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <Mail size={16} />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  <Save size={18} />
                  Update Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherManagement;
