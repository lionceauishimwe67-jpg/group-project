import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiService.request('/api/events');
      setEvents(data.events || getDemoEvents());
    } catch (err) {
      setEvents(getDemoEvents());
    } finally {
      setLoading(false);
    }
  };

  const getDemoEvents = () => [
    {
      id: 1,
      title: 'Final Exams Begin',
      date: '2024-02-15',
      time: '08:00 AM',
      type: 'exam',
      description: 'End of semester examinations for all classes',
      location: 'Main Examination Hall'
    },
    {
      id: 2,
      title: 'Career Day & Job Fair',
      date: '2024-02-20',
      time: '10:00 AM',
      type: 'event',
      description: 'Meet with industry professionals and explore career opportunities',
      location: 'School Auditorium'
    },
    {
      id: 3,
      title: 'Graduation Ceremony 2024',
      date: '2024-03-10',
      time: '02:00 PM',
      type: 'ceremony',
      description: 'Annual graduation ceremony for completing students',
      location: 'School Grounds'
    },
    {
      id: 4,
      title: 'Parent-Teacher Meeting',
      date: '2024-02-05',
      time: '04:00 PM',
      type: 'meeting',
      description: 'Discussion of student progress and academic planning',
      location: 'Conference Room'
    },
    {
      id: 5,
      title: 'Technology Workshop',
      date: '2024-02-12',
      time: '09:00 AM',
      type: 'event',
      description: 'Hands-on workshop with latest software development tools',
      location: 'Computer Lab'
    }
  ];

  const getFilteredEvents = () => {
    if (filter === 'all') return events;
    return events.filter(e => e.type === filter);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'exam': return '📝';
      case 'ceremony': return '🎓';
      case 'meeting': return '🤝';
      case 'event': return '📢';
      default: return '📅';
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="page events-page">
      <h1>School Events & Calendar</h1>
      <p className="tagline">Stay updated with upcoming exams, ceremonies, and school activities</p>

      {/* Upcoming Highlight */}
      <div className="upcoming-highlight">
        <h2>🎯 Next Upcoming Event</h2>
        {getUpcomingEvents()[0] && (
          <div key={getUpcomingEvents()[0].id} className={`highlight-card ${getUpcomingEvents()[0].type}`}>
            <div className="highlight-date">
              <span className="day">{new Date(getUpcomingEvents()[0].date).getDate()}</span>
              <span className="month">{new Date(getUpcomingEvents()[0].date).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="highlight-info">
              <h3>{getUpcomingEvents()[0].title}</h3>
              <p>{getUpcomingEvents()[0].description}</p>
              <div className="highlight-meta">
                <span>⏰ {getUpcomingEvents()[0].time}</span>
                <span>📍 {getUpcomingEvents()[0].location}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="events-filter">
        <button key="all" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All Events
        </button>
        <button key="exam" className={filter === 'exam' ? 'active' : ''} onClick={() => setFilter('exam')}>
          📝 Exams
        </button>
        <button key="ceremony" className={filter === 'ceremony' ? 'active' : ''} onClick={() => setFilter('ceremony')}>
          🎓 Ceremonies
        </button>
        <button key="event" className={filter === 'event' ? 'active' : ''} onClick={() => setFilter('event')}>
          📢 Events
        </button>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {getFilteredEvents().map((event) => (
          <div key={event.id} className={`event-card ${event.type}`}>
            <div className="event-date-badge">
              <span className="date-day">{new Date(event.date).getDate()}</span>
              <span className="date-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="event-content">
              <div className="event-type">{getEventIcon(event.type)} {event.type.toUpperCase()}</div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <div className="event-meta">
                <span>⏰ {event.time}</span>
                <span>📍 {event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredEvents().length === 0 && (
        <div className="no-events">
          <p>No events found in this category.</p>
        </div>
      )}
    </div>
  );
}

export default Events;
