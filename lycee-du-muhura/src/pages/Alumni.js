import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function Alumni() {
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alumniData, statsData] = await Promise.all([
        apiService.getAlumni(),
        apiService.getAlumniStats()
      ]);
      setAlumni(alumniData.alumni);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load alumni data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedYear) params.year = selectedYear;
      if (selectedCourse) params.course = selectedCourse;
      
      const data = await apiService.getAlumni(params);
      setAlumni(data.alumni);
    } catch (err) {
      setError('Failed to search alumni');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedCourse('');
    loadData();
  };

  if (loading) return <div className="loading">Loading...</div>;

  // Get unique years and courses for filters
  const years = stats?.byYear?.map(y => y.graduation_year.toString()) || [];
  const courses = stats?.byCourse?.map(c => c.course_studied) || [];

  return (
    <div className="page alumni-page">
      <h1>Our Alumni</h1>
      <p className="tagline">Meet our successful graduates making an impact in their fields</p>

      {stats && (
        <div className="alumni-stats">
          <div className="stat-card">
            <h3>Total Alumni</h3>
            <p className="stat-number">{stats.totalAlumni}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="alumni-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name, company, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="filter-select"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
          <button type="submit" className="search-btn">Search</button>
          <button type="button" onClick={clearFilters} className="clear-btn">Clear</button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Alumni Grid */}
      <div className="alumni-grid">
        {alumni.map(alumnus => (
          <div key={alumnus.id} className="alumni-card">
            <div className="alumni-photo">
              {alumnus.photo ? (
                <img src={alumnus.photo} alt={alumnus.name} />
              ) : (
                <div className="photo-placeholder">👤</div>
              )}
            </div>
            <div className="alumni-info">
              <h3>{alumnus.name}</h3>
              <p className="alumni-position">{alumnus.current_position}</p>
              <p className="alumni-company">{alumnus.company}</p>
              <div className="alumni-details">
                <span className="alumni-year">Class of {alumnus.graduation_year}</span>
                <span className="alumni-course">{alumnus.course_studied}</span>
              </div>
              <p className="alumni-bio">{alumnus.bio}</p>
              <div className="alumni-contact">
                {alumnus.email && (
                  <a href={`mailto:${alumnus.email}`} className="contact-link">
                    📧 Email
                  </a>
                )}
                {alumnus.phone && (
                  <a href={`tel:${alumnus.phone}`} className="contact-link">
                    📞 Call
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {alumni.length === 0 && !loading && (
        <div className="no-results">
          <p>No alumni found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default Alumni;
