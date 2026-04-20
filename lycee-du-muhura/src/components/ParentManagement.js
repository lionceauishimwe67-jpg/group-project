import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Users, UserPlus, Search, BookOpen } from 'lucide-react';
import apiService from '../services/api';
import './ParentManagement.css';

function ParentManagement() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    studentId: ''
  });

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      setLoading(true);
      const data = await apiService.request('/api/parents');
      setParents(data.parents || []);
    } catch (err) {
      setError(err.message || 'Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiService.request('/api/parents', 'POST', {
        userId: formData.userId,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        studentId: formData.studentId
      });
      setSuccess('Parent added successfully');
      setFormData({ userId: '', password: '', name: '', email: '', phone: '', address: '', studentId: '' });
      setShowAddModal(false);
      loadParents();
    } catch (err) {
      setError(err.message || 'Failed to add parent');
    }
  };

  const handleUpdateParent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiService.request(`/api/parents/${selectedParent._id}`, 'PUT', {
        password: formData.password,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        studentId: formData.studentId
      });
      setSuccess('Parent updated successfully');
      setShowEditModal(false);
      setSelectedParent(null);
      loadParents();
    } catch (err) {
      setError(err.message || 'Failed to update parent');
    }
  };

  const handleDeleteParent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent?')) {
      return;
    }

    try {
      await apiService.request(`/api/parents/${id}`, 'DELETE');
      setSuccess('Parent deleted successfully');
      loadParents();
    } catch (err) {
      setError(err.message || 'Failed to delete parent');
    }
  };

  const openEditModal = (parent) => {
    setSelectedParent(parent);
    setFormData({
      userId: parent.userId,
      password: parent.password,
      name: parent.name,
      email: parent.email || '',
      phone: parent.phone || '',
      address: parent.address || '',
      studentId: parent.studentId || ''
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedParent(null);
    setFormData({ userId: '', password: '', name: '', email: '', phone: '', address: '', studentId: '' });
  };

  const filteredParents = parents.filter(parent =>
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="parent-management">
      <div className="section-header">
        <h2><Users size={24} /> Manage Parents</h2>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> Add Parent
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search parents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading parents...</div>
      ) : (
        <div className="parents-grid">
          {filteredParents.map(parent => (
            <div key={parent._id} className="parent-card">
              <div className="row-cell">
                <span className="cell-label">User ID:</span>
                <span className="cell-value">{parent.userId}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Name:</span>
                <span className="cell-value">{parent.name}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Email:</span>
                <span className="cell-value">{parent.email || 'N/A'}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Phone:</span>
                <span className="cell-value">{parent.phone || 'N/A'}</span>
              </div>
              <div className="row-cell">
                <span className="cell-label">Student ID:</span>
                <span className="cell-value">{parent.studentId || 'N/A'}</span>
              </div>
              <div className="row-cell actions">
                <button onClick={() => openEditModal(parent)} className="action-btn edit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteParent(parent._id)} className="action-btn delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredParents.length === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <p>No parents found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Parent</h3>
              <button onClick={closeModal} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddParent}>
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save"><Save size={18} /> Add Parent</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {showEditModal && selectedParent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Parent</h3>
              <button onClick={closeModal} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateParent}>
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={formData.userId}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save"><Save size={18} /> Update Parent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentManagement;
