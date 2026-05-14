import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { schoolEventApi } from '../../services/api';
import './Home.css';

const Home: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const res = await schoolEventApi.getUpcoming();
      setUpcomingEvents(res.data.events?.slice(0, 3) || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <nav className="home-nav">
          <div className="nav-logo">📚 Smart School</div>
          <div className="nav-links">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
            <Link to="/display" className="nav-link">Timetable Display</Link>
            <Link to="/admin/login" className="nav-link nav-btn">Admin Login</Link>
          </div>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Smart School</h1>
          <p className="hero-subtitle">
            A complete digital solution for school timetable management, bell systems,
            announcements, student records, grades, and more.
          </p>
          <div className="hero-buttons">
            <Link to="/display" className="hero-btn primary">View Timetable</Link>
            <Link to="/about" className="hero-btn secondary">Learn More</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card bell">
            <div className="card-icon">🔔</div>
            <div className="card-title">Smart Bell</div>
            <div className="card-desc">Automatic bell control</div>
          </div>
          <div className="hero-card timetable">
            <div className="card-icon">📅</div>
            <div className="card-title">Timetable</div>
            <div className="card-desc">Digital schedules</div>
          </div>
          <div className="hero-card students">
            <div className="card-icon">👨‍🎓</div>
            <div className="card-title">Students</div>
            <div className="card-desc">Complete records</div>
          </div>
          <div className="hero-card grades">
            <div className="card-icon">📊</div>
            <div className="card-title">Grades</div>
            <div className="card-desc">Performance tracking</div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Platform Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">⏰</div>
            <h3>Timetable Management</h3>
            <p>Create, edit, and display class schedules with ease. Supports multiple classes and subjects.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔔</div>
            <h3>Smart Bell System</h3>
            <p>Automatic bell triggering based on timetable with ESP32 device integration.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📢</div>
            <h3>Announcements</h3>
            <p>Display important announcements and news on digital screens throughout the school.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👨‍🎓</div>
            <h3>Student Records</h3>
            <p>Manage student information, enrollment, attendance, and academic history.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📊</div>
            <h3>Grade Management</h3>
            <p>Record and track student grades across all subjects with analytics.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🎓</div>
            <h3>Alumni Network</h3>
            <p>Keep track of graduated students and maintain alumni connections.</p>
          </div>
        </div>
      </section>

      <section className="events-section">
        <h2>Upcoming Events</h2>
        {loading ? (
          <div className="loading-events">Loading events...</div>
        ) : upcomingEvents.length > 0 ? (
          <div className="events-preview">
            {upcomingEvents.map((e: any) => (
              <div key={e.id} className="event-preview-card">
                <div className="event-preview-date">
                  <div className="preview-month">{new Date(e.start_date).toLocaleString('default', { month: 'short' })}</div>
                  <div className="preview-day">{new Date(e.start_date).getDate()}</div>
                </div>
                <div className="event-preview-info">
                  <h4>{e.title}</h4>
                  <p>{e.description?.substring(0, 80) || 'School event'}...</p>
                  <span className="event-preview-type">{e.event_type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-events">No upcoming events at this time.</p>
        )}
      </section>

      <footer className="home-footer">
        <p>Smart School Management System &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Home;
