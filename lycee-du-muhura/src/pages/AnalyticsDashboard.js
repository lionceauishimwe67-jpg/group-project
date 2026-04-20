import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp,
  Activity,
  BookOpen,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import apiService from '../services/api';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = { timeRange };
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const data = await apiService.request('/api/analytics/timetable', 'GET', null, params);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csv = convertToCSV(analytics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-analytics-${timeRange}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (!data) return '';
    let csv = 'Metric,Value\n';
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        csv += `${key},"${JSON.stringify(value)}"\n`;
      } else {
        csv += `${key},${value}\n`;
      }
    });
    return csv;
  };

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <h2><BarChart3 size={28} /> Timetable Analytics</h2>
        <div className="analytics-actions">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button className="btn-refresh" onClick={loadAnalytics}>
            <RefreshCw size={16} />
          </button>
          <button className="btn-export" onClick={exportReport}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="analytics-summary">
            <div className="summary-card blue">
              <Calendar size={32} />
              <div>
                <h4>Total Sessions</h4>
                <p>{analytics.totalSessions || 0}</p>
              </div>
            </div>
            <div className="summary-card green">
              <Users size={32} />
              <div>
                <h4>Active Classes</h4>
                <p>{analytics.activeClasses || 0}</p>
              </div>
            </div>
            <div className="summary-card orange">
              <Clock size={32} />
              <div>
                <h4>Hours Scheduled</h4>
                <p>{analytics.totalHours || 0}</p>
              </div>
            </div>
            <div className="summary-card purple">
              <BookOpen size={32} />
              <div>
                <h4>Subjects Taught</h4>
                <p>{analytics.subjectsTaught || 0}</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="analytics-charts">
            {/* Sessions by Day */}
            <div className="chart-card">
              <h3><Activity size={20} /> Sessions by Day</h3>
              <div className="bar-chart">
                {analytics.sessionsByDay && Object.entries(analytics.sessionsByDay).map(([day, count]) => (
                  <div key={day} className="bar-item">
                    <span className="bar-label">{day}</span>
                    <div className="bar-wrapper">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analytics.sessionsByDay))) * 100}%` 
                        }}
                      >
                        <span className="bar-value">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Utilization */}
            <div className="chart-card">
              <h3><BookOpen size={20} /> Room Utilization</h3>
              <div className="room-chart">
                {analytics.roomUtilization && Object.entries(analytics.roomUtilization).map(([room, data]) => (
                  <div key={room} className="room-item">
                    <div className="room-info">
                      <span className="room-name">{room}</span>
                      <span className="room-usage">{data.usage}%</span>
                    </div>
                    <div className="room-bar">
                      <div 
                        className="room-bar-fill"
                        style={{ width: `${data.usage}%` }}
                      />
                    </div>
                    <div className="room-details">
                      <span>{data.sessions} sessions</span>
                      <span>{data.hours} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Workload */}
            <div className="chart-card">
              <h3><Users size={20} /> Teacher Workload</h3>
              <div className="teacher-chart">
                {analytics.teacherWorkload && Object.entries(analytics.teacherWorkload)
                  .sort((a, b) => b[1].hours - a[1].hours)
                  .slice(0, 5)
                  .map(([teacher, data]) => (
                    <div key={teacher} className="teacher-item">
                      <div className="teacher-info">
                        <span className="teacher-name">{teacher}</span>
                        <span className="teacher-hours">{data.hours} hrs</span>
                      </div>
                      <div className="teacher-bar">
                        <div 
                          className="teacher-bar-fill"
                          style={{ 
                            width: `${(data.hours / Math.max(...Object.values(analytics.teacherWorkload).map(t => t.hours))) * 100}%` 
                          }}
                        />
                      </div>
                      <div className="teacher-details">
                        <span>{data.sessions} sessions</span>
                        <span>{data.subjects} subjects</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Subject Distribution */}
            <div className="chart-card">
              <h3><BookOpen size={20} /> Subject Distribution</h3>
              <div className="subject-chart">
                {analytics.subjectDistribution && Object.entries(analytics.subjectDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([subject, count]) => (
                    <div key={subject} className="subject-item">
                      <div className="subject-info">
                        <span className="subject-name">{subject}</span>
                        <span className="subject-count">{count}</span>
                      </div>
                      <div className="subject-bar">
                        <div 
                          className="subject-bar-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(analytics.subjectDistribution))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="analytics-details">
            <h3><TrendingUp size={20} /> Detailed Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Average Sessions per Day</span>
                <span className="stat-value">{analytics.avgSessionsPerDay || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Peak Hour</span>
                <span className="stat-value">{analytics.peakHour || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Most Used Room</span>
                <span className="stat-value">{analytics.mostUsedRoom || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Busiest Teacher</span>
                <span className="stat-value">{analytics.busiestTeacher || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Conflict Rate</span>
                <span className="stat-value">{analytics.conflictRate || '0%'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Schedule Efficiency</span>
                <span className="stat-value">{analytics.scheduleEfficiency || '0%'}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">
          <BarChart3 size={48} />
          <p>No analytics data available</p>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
