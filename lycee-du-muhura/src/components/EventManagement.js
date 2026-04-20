import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Search, Calendar, MapPin, Clock, Tag } from 'lucide-react';
import apiService from '../services/api';
import './EventManagement.css';

function EventManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'event',
    description: '',
    location: '',
    status: 'upcoming',
    image: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await apiService.request('/api/events');
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiService.request('/api/events', 'POST', {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        description: formData.description,
        location: formData.location,
        status: formData.status,
        image: formData.image
      });
      setSuccess('Event added successfully');
      setFormData({ title: '', date: '', time: '', type: 'event', description: '', location: '', status: 'upcoming', image: '' });
      setShowAddModal(false);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to add event');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await apiService.request(`/api/events/${selectedEvent._id}`, 'PUT', {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        description: formData.description,
        location: formData.location,
        status: formData.status,
        image: formData.image
      });
      setSuccess('Event updated successfully');
      setShowEditModal(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await apiService.request(`/api/events/${id}`, 'DELETE');
      setSuccess('Event deleted successfully');
      loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      type: event.type,
      description: event.description,
      location: event.location,
      status: event.status || 'upcoming',
      image: event.image || ''
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedEvent(null);
    setFormData({ title: '', date: '', time: '', type: 'event', description: '', location: '', status: 'upcoming', image: '' });
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case 'exam': return '#ef4444';
      case 'ceremony': return '#8b5cf6';
      case 'event': return '#3b82f6';
      default: return '#64748b';
    }
  };

  return (
    <div className="event-management">
      <div className="section-header">
        <h2><Calendar size={24} /> Manage Events</h2>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Add Event
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="filter-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select">
          <Tag size={18} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="event">Events</option>
            <option value="exam">Exams</option>
            <option value="ceremony">Ceremonies</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <div key={event._id || event.id} className="event-card">
              <div className="event-header">
                <span className="event-badge" style={{ background: getTypeColor(event.type) }}>
                  {event.type}
                </span>
                <span className={`event-status ${event.status}`}>
                  {event.status}
                </span>
              </div>
              {event.image && (
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
              )}
              <h3 className="event-title">{event.title}</h3>
              <div className="event-details">
                <div className="event-detail">
                  <Calendar size={16} />
                  <span>{event.date}</span>
                </div>
                <div className="event-detail">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="event-detail">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
              </div>
              <p className="event-description">{event.description}</p>
              <div className="event-actions">
                <button onClick={() => openEditModal(event)} className="action-btn edit">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDeleteEvent(event._id || event.id)} className="action-btn delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <p>No events found</p>
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Event</h3>
              <button onClick={closeModal} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddEvent}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Event Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Event Type *</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="event">Event</option>
                    <option value="exam">Exam</option>
                    <option value="ceremony">Ceremony</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Event Image (URL)</label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save"><Save size={18} /> Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Event</h3>
              <button onClick={closeModal} className="close-btn"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateEvent}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-title">Event Title *</label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-type">Event Type *</label>
                  <select
                    id="edit-type"
                    name="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="event">Event</option>
                    <option value="exam">Exam</option>
                    <option value="ceremony">Ceremony</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-date">Date *</label>
                  <input
                    type="date"
                    id="edit-date"
                    name="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-time">Time *</label>
                  <input
                    type="time"
                    id="edit-time"
                    name="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-location">Location *</label>
                <input
                  type="text"
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status *</label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description *</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-image">Event Image (URL)</label>
                <input
                  type="text"
                  id="edit-image"
                  name="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save"><Save size={18} /> Update Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventManagement;
