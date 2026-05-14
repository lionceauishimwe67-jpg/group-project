import React, { useState, useEffect } from 'react';
import { schoolEventApi } from '../../services/api';
import './SchoolEventsManager.css';

interface SchoolEvent {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location?: string;
  organizer?: string;
  target_audience?: string;
  is_public: number;
  image_url?: string;
  created_at?: string;
}

const eventTypeOptions = [
  { value: 'general', label: 'General', icon: '📌' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'academic', label: 'Academic', icon: '📚' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'holiday', label: 'Holiday', icon: '🏖️' },
  { value: 'exam', label: 'Exam', icon: '📝' },
];

const SchoolEventsManager: React.FC = () => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'general', start_date: '', end_date: '',
    location: '', organizer: '', target_audience: 'all', is_public: '1', image_url: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      const res = await schoolEventApi.getAll(params);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (event?: SchoolEvent) => {
    if (event) {
      setEditingId(event.id);
      setFormData({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_date: event.start_date?.slice(0, 16) || '',
        end_date: event.end_date?.slice(0, 16) || '',
        location: event.location || '',
        organizer: event.organizer || '',
        target_audience: event.target_audience || 'all',
        is_public: event.is_public ? '1' : '0',
        image_url: event.image_url || ''
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', description: '', event_type: 'general', start_date: '', end_date: '', location: '', organizer: '', target_audience: 'all', is_public: '1', image_url: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      is_public: formData.is_public === '1',
      created_by: undefined
    };
    try {
      if (editingId) {
        await schoolEventApi.update(editingId, payload);
      } else {
        await schoolEventApi.create(payload);
      }
      setShowForm(false);
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save event');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await schoolEventApi.delete(id);
      loadEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleString();
  };

  return (
    <div className="events-manager">
      <div className="page-header">
        <h1><span>📅</span> School Events</h1>
        <button className="btn-primary" onClick={() => openForm()}><span>+</span> Add Event</button>
      </div>

      <div className="filters-bar">
        <select className="filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); loadEvents(); }}>
          <option value="">All Types</option>
          {eventTypeOptions.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <button className="btn-secondary" onClick={loadEvents}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-list">
          {events.map((e) => {
            const typeOpt = eventTypeOptions.find(t => t.value === e.event_type) || eventTypeOptions[0];
            return (
              <div key={e.id} className="event-card">
                <div className="event-header">
                  <div className="event-type-badge" style={{ background: typeOpt.value === 'sports' ? '#dbeafe' : typeOpt.value === 'exam' ? '#fee2e2' : typeOpt.value === 'holiday' ? '#dcfce7' : '#f3e8ff', color: typeOpt.value === 'sports' ? '#1e40af' : typeOpt.value === 'exam' ? '#991b1b' : typeOpt.value === 'holiday' ? '#166534' : '#6b21a8' }}>
                    {typeOpt.icon} {typeOpt.label}
                  </div>
                  <div className="event-actions">
                    <button className="btn-icon" onClick={() => openForm(e)} title="Edit">✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(e.id)} title="Delete">🗑️</button>
                  </div>
                </div>
                <h3 className="event-title">{e.title}</h3>
                {e.description && <p className="event-desc">{e.description}</p>}
                <div className="event-meta">
                  <span>📅 {formatDate(e.start_date)}</span>
                  {e.end_date && <span> - {formatDate(e.end_date)}</span>}
                  {e.location && <span>📍 {e.location}</span>}
                  {e.organizer && <span>👤 {e.organizer}</span>}
                  <span className={`visibility-badge ${e.is_public ? 'public' : 'private'}`}>{e.is_public ? '🌍 Public' : '🔒 Private'}</span>
                </div>
              </div>
            );
          })}
          {events.length === 0 && <div className="no-data">No events found</div>}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(ev) => ev.stopPropagation()}>
            <h2>{editingId ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-grid">
                <div className="form-group"><label>Title *</label><input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="form-group"><label>Type</label><select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}>{eventTypeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div className="form-group"><label>Start Date *</label><input type="datetime-local" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div>
                <div className="form-group"><label>End Date</label><input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} /></div>
                <div className="form-group"><label>Location</label><input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
                <div className="form-group"><label>Organizer</label><input value={formData.organizer} onChange={(e) => setFormData({ ...formData, organizer: e.target.value })} /></div>
                <div className="form-group"><label>Target Audience</label><input value={formData.target_audience} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} /></div>
                <div className="form-group"><label>Visibility</label><select value={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.value })}><option value="1">Public</option><option value="0">Private</option></select></div>
                <div className="form-group full-width"><label>Image URL</label><input value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} /></div>
                <div className="form-group full-width"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolEventsManager;
