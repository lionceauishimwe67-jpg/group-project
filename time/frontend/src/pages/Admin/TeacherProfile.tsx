import React, { useState, useEffect } from 'react';
import { teachersApi } from '../../services/api';
import './TeacherProfile.css';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  school: string;
  teaching_schedule: string;
  subjects: string;
  level: string;
  specific_competences: string;
  general_competences: string;
  complementary_competences: string;
  sms_notification_enabled: number;
  created_at: string;
}

const TeacherProfile: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    teaching_schedule: '',
    subjects: '',
    level: '',
    specific_competences: '',
    general_competences: '',
    complementary_competences: '',
    sms_notification_enabled: 1
  });
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; teacherId: number | null }>({ show: false, teacherId: null });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setStatus('Loading teachers...');
      const response = await teachersApi.getAll();
      setTeachers(response.data.teachers || []);
      setStatus('Teachers loaded successfully.');
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setStatus('Error loading teachers.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    try {
      setStatus('Saving teacher profile...');
      const response = selectedTeacher 
        ? await teachersApi.update(selectedTeacher.id, formData)
        : await teachersApi.create(formData);

      console.log('API response:', response);

      if (response.status === 200 || response.status === 201) {
        setStatus('Teacher profile saved successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          school: '',
          teaching_schedule: '',
          subjects: '',
          level: '',
          specific_competences: '',
          general_competences: '',
          complementary_competences: '',
          sms_notification_enabled: 1
        });
        setSelectedTeacher(null);
        setIsEditing(false);
        fetchTeachers();
        
        setTimeout(() => setStatus('Teachers loaded successfully.'), 2000);
      } else {
        setStatus(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
      setStatus('Error saving teacher profile.');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData(teacher);
    setIsEditing(true);
    setStatus(`Editing ${teacher.name}`);
  };

  const handleDelete = async (teacherId: number) => {
    setDeleteConfirm({ show: true, teacherId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.teacherId) return;

    try {
      setStatus('Deleting teacher...');
      await teachersApi.delete(deleteConfirm.teacherId);
      setStatus('Teacher deleted successfully.');
      fetchTeachers();
      
      if (selectedTeacher?.id === deleteConfirm.teacherId) {
        setSelectedTeacher(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      setStatus('Error deleting teacher.');
    } finally {
      setDeleteConfirm({ show: false, teacherId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, teacherId: null });
  };

  const toggleSMS = async (teacher: Teacher) => {
    try {
      const updatedTeacher = {
        ...teacher,
        sms_notification_enabled: teacher.sms_notification_enabled ? 0 : 1
      };
      await teachersApi.update(teacher.id, updatedTeacher);
      fetchTeachers();
      setStatus(`SMS notifications ${updatedTeacher.sms_notification_enabled ? 'enabled' : 'disabled'} for ${teacher.name}`);
      setTimeout(() => setStatus('Teachers loaded successfully.'), 2000);
    } catch (error) {
      console.error('Error toggling SMS:', error);
      setStatus('Error toggling SMS notifications.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      school: '',
      teaching_schedule: '',
      subjects: '',
      level: '',
      specific_competences: '',
      general_competences: '',
      complementary_competences: '',
      sms_notification_enabled: 1
    });
    setSelectedTeacher(null);
    setIsEditing(false);
    setStatus('Cancelled');
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(query) ||
      (teacher.email && teacher.email.toLowerCase().includes(query)) ||
      (teacher.phone && teacher.phone.includes(query)) ||
      (teacher.school && teacher.school.toLowerCase().includes(query)) ||
      (teacher.subjects && teacher.subjects.toLowerCase().includes(query))
    );
  });

  return (
    <div className="teacher-profile">
      <div className="teacher-profile-header">
        <h2>Teacher Profile Management</h2>
        <p className="status">{status}</p>
      </div>

      <div className="teacher-profile-content">
        <div className="teacher-list">
          <div className="list-header">
            <h3>Teachers ({filteredTeachers.length})</h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, phone, school, or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '300px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            <button onClick={() => { 
              console.log('Add Teacher button clicked');
              setIsEditing(true); 
              setStatus('Creating new teacher profile...'); 
            }}>
              + Add Teacher
            </button>
          </div>

          <div className="teachers-grid">
            {filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="teacher-card">
                <div className="teacher-info">
                  <h4>{teacher.name}</h4>
                  {teacher.email && <p>{teacher.email}</p>}
                  {teacher.phone && <p>{teacher.phone}</p>}
                  {teacher.school && <p>{teacher.school}</p>}
                  {teacher.subjects && <p>Subjects: {teacher.subjects}</p>}
                  {teacher.level && <p><strong>Level:</strong> {teacher.level}</p>}
                  {teacher.specific_competences && <p><strong>Specific Competences:</strong> {teacher.specific_competences}</p>}
                  {teacher.general_competences && <p><strong>General Competences:</strong> {teacher.general_competences}</p>}
                  {teacher.complementary_competences && <p><strong>Complementary Competences:</strong> {teacher.complementary_competences}</p>}
                  <p style={{ fontSize: '0.85rem', color: teacher.sms_notification_enabled ? '#4caf50' : '#999' }}>
                    SMS: {teacher.sms_notification_enabled ? '✓ Enabled' : '✗ Disabled'}
                  </p>
                </div>
                <div className="teacher-actions">
                  <button onClick={() => handleEdit(teacher)}>Edit</button>
                  <button 
                    onClick={() => toggleSMS(teacher)}
                    style={{ 
                      backgroundColor: teacher.sms_notification_enabled ? '#4caf50' : '#ff9800',
                      color: 'white'
                    }}
                  >
                    {teacher.sms_notification_enabled ? 'SMS On' : 'SMS Off'}
                  </button>
                  <button onClick={() => teacher.id && handleDelete(teacher.id)} className="delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(isEditing || selectedTeacher) && (
          <div className="teacher-form">
            <h3>{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>School</label>
                <input
                  type="text"
                  name="school"
                  value={formData.school || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Teaching Schedule</label>
                <textarea
                  name="teaching_schedule"
                  value={formData.teaching_schedule || ''}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Subjects</label>
                <input
                  type="text"
                  name="subjects"
                  value={formData.subjects || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Level (Class Level Taught)</label>
                <select
                  name="level"
                  value={formData.level || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Level</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                  <option value="S5">S5</option>
                  <option value="S6">S6</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                  <option value="L4">L4</option>
                  <option value="L5">L5</option>
                  <option value="L6">L6</option>
                  <option value="All">All Levels</option>
                </select>
              </div>

              <div className="form-group">
                <label>Specific Competences</label>
                <textarea
                  name="specific_competences"
                  value={formData.specific_competences || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List specific competences separated by commas"
                />
              </div>

              <div className="form-group">
                <label>General Competences</label>
                <textarea
                  name="general_competences"
                  value={formData.general_competences || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List general competences separated by commas"
                />
              </div>

              <div className="form-group">
                <label>Complementary Competences</label>
                <textarea
                  name="complementary_competences"
                  value={formData.complementary_competences || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="List complementary competences separated by commas"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="sms_notification_enabled"
                    checked={formData.sms_notification_enabled === 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      sms_notification_enabled: e.target.checked ? 1 : 0
                    })}
                  />
                  Enable SMS Notifications
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel">
                  Cancel
                </button>
                <button type="submit" disabled={!formData.name}>
                  {selectedTeacher ? 'Update' : 'Create'} Teacher
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="delete-confirm-dialog">
          <div className="delete-confirm-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this teacher? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button onClick={cancelDelete} className="cancel">Cancel</button>
              <button onClick={confirmDelete} className="delete">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;
