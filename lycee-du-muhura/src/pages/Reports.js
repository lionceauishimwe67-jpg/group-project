import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  LogOut,
  FileText,
  PieChart
} from 'lucide-react';
import authService from '../services/authService';
import apiService from '../services/api';
import './Reports.css';

function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('performance');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    classFilter: '',
    semester: '',
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
    month: ''
  });
  
  // Report Data
  const [performanceData, setPerformanceData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [financeData, setFinanceData] = useState(null);

  useEffect(() => {
    checkAuth();
    loadAllReports();
  }, []);

  const checkAuth = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const user = authService.getCurrentUser();
    if (user && user.role !== 'admin' && user.role !== 'teacher') {
      navigate('/unauthorized');
    }
  };

  const loadAllReports = async () => {
    setLoading(true);
    await Promise.all([
      loadPerformanceReport(),
      loadAttendanceReport(),
      loadFinanceReport()
    ]);
    setLoading(false);
  };

  const loadPerformanceReport = async () => {
    try {
      const params = {};
      if (filters.classFilter) params.classFilter = filters.classFilter;
      if (filters.semester) params.semester = filters.semester;
      
      const data = await apiService.request('/api/reports/performance', 'GET', null, params);
      setPerformanceData(data);
    } catch (err) {
      console.error('Error loading performance report:', err);
    }
  };

  const loadAttendanceReport = async () => {
    try {
      const params = {};
      if (filters.classFilter) params.classFilter = filters.classFilter;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const data = await apiService.request('/api/reports/attendance', 'GET', null, params);
      setAttendanceData(data);
    } catch (err) {
      console.error('Error loading attendance report:', err);
    }
  };

  const loadFinanceReport = async () => {
    try {
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.month) params.month = filters.month;
      
      const data = await apiService.request('/api/reports/finance', 'GET', null, params);
      setFinanceData(data);
    } catch (err) {
      console.error('Error loading finance report:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadAllReports();
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const exportToCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const convertToCSV = (data) => {
    if (!data || typeof data !== 'object') return '';
    
    let csv = '';
    
    // Handle arrays
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      csv = headers.join(',') + '\n';
      data.forEach(row => {
        csv += headers.map(h => {
          const val = row[h];
          if (typeof val === 'object') return '"' + JSON.stringify(val) + '"';
          return val;
        }).join(',') + '\n';
      });
    } else {
      // Handle objects
      csv = 'Key,Value\n';
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          csv += `${key},${value}\n`;
        }
      });
    }
    
    return csv;
  };

  // ========== PERFORMANCE REPORT ==========
  const PerformanceReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h2><BarChart3 size={24} /> Student Performance Report</h2>
        <button className="btn-export" onClick={() => exportToCSV(performanceData?.grades, 'performance_report.csv')}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {performanceData?.summary && (
        <div className="summary-cards">
          <div className="summary-card blue">
            <Users size={32} />
            <div>
              <h4>Total Students</h4>
              <p>{performanceData.summary.totalStudents}</p>
            </div>
          </div>
          <div className="summary-card green">
            <Award size={32} />
            <div>
              <h4>With Grades</h4>
              <p>{performanceData.summary.studentsWithGrades}</p>
            </div>
          </div>
          <div className="summary-card orange">
            <TrendingUp size={32} />
            <div>
              <h4>Average Score</h4>
              <p>{performanceData.summary.averageScore}%</p>
            </div>
          </div>
        </div>
      )}

      {performanceData?.gradeDistribution && (
        <div className="chart-container">
          <h3>Grade Distribution</h3>
          <div className="grade-bars">
            {Object.entries(performanceData.gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="grade-bar-item">
                <span className="grade-label">{grade}</span>
                <div className="grade-bar-wrapper">
                  <div 
                    className={`grade-bar grade-${grade.toLowerCase()}`}
                    style={{ width: `${Math.max(count * 20, 5)}%` }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {performanceData?.topPerformers && performanceData.topPerformers.length > 0 && (
        <div className="data-table-container">
          <h3>Top 10 Performers</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Average Score</th>
                <th>Grades Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.topPerformers.map((performer, index) => (
                <tr key={index}>
                  <td>#{index + 1}</td>
                  <td>{performer.student?.name || 'Unknown'}</td>
                  <td className="score-cell">{performer.averageScore}%</td>
                  <td>{performer.gradeCount}</td>
                  <td>
                    <span className={`status-badge ${parseFloat(performer.averageScore) >= 80 ? 'excellent' : parseFloat(performer.averageScore) >= 60 ? 'good' : 'average'}`}>
                      {parseFloat(performer.averageScore) >= 80 ? 'Excellent' : parseFloat(performer.averageScore) >= 60 ? 'Good' : 'Average'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ========== ATTENDANCE REPORT ==========
  const AttendanceReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h2><Calendar size={24} /> Attendance Trends Report</h2>
        <button className="btn-export" onClick={() => exportToCSV(attendanceData?.atRiskStudents, 'attendance_report.csv')}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {attendanceData?.summary && (
        <div className="summary-cards">
          <div className="summary-card blue">
            <FileText size={32} />
            <div>
              <h4>Total Records</h4>
              <p>{attendanceData.summary.totalRecords}</p>
            </div>
          </div>
          <div className="summary-card green">
            <CheckCircle size={32} />
            <div>
              <h4>Present</h4>
              <p>{attendanceData.summary.presentCount}</p>
            </div>
          </div>
          <div className="summary-card red">
            <AlertTriangle size={32} />
            <div>
              <h4>Absent</h4>
              <p>{attendanceData.summary.absentCount}</p>
            </div>
          </div>
          <div className="summary-card orange">
            <Clock size={32} />
            <div>
              <h4>Late</h4>
              <p>{attendanceData.summary.lateCount}</p>
            </div>
          </div>
        </div>
      )}

      {attendanceData?.summary?.attendanceRate && (
        <div className="attendance-rate-card">
          <h3>Overall Attendance Rate</h3>
          <div className="rate-display">
            <div 
              className="rate-circle"
              style={{ 
                background: `conic-gradient(#10b981 ${attendanceData.summary.attendanceRate}%, #e5e7eb ${attendanceData.summary.attendanceRate}%)`
              }}
            >
              <span>{attendanceData.summary.attendanceRate}%</span>
            </div>
          </div>
        </div>
      )}

      {attendanceData?.atRiskStudents && attendanceData.atRiskStudents.length > 0 && (
        <div className="data-table-container">
          <h3>At-Risk Students (Attendance &lt; 75%)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Attendance Rate</th>
                <th>Absent Count</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.atRiskStudents.map((student, index) => (
                <tr key={index} className="risk-row">
                  <td>{student.student?.name || 'Unknown'}</td>
                  <td className="rate-cell">{student.attendanceRate}%</td>
                  <td>{student.absentCount}</td>
                  <td>
                    <span className={`risk-badge ${parseFloat(student.attendanceRate) < 50 ? 'high' : 'medium'}`}>
                      {parseFloat(student.attendanceRate) < 50 ? 'High Risk' : 'Medium Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ========== FINANCE REPORT ==========
  const FinanceReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h2><DollarSign size={24} /> Financial Reports</h2>
        <button className="btn-export" onClick={() => exportToCSV(financeData?.outstandingPayments, 'finance_report.csv')}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {financeData?.summary && (
        <div className="summary-cards">
          <div className="summary-card blue">
            <DollarSign size={32} />
            <div>
              <h4>Total Revenue</h4>
              <p>RWF {financeData.summary.totalRevenue?.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card green">
            <CheckCircle size={32} />
            <div>
              <h4>Paid</h4>
              <p>RWF {financeData.summary.paidAmount?.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card orange">
            <Clock size={32} />
            <div>
              <h4>Pending</h4>
              <p>RWF {financeData.summary.pendingAmount?.toLocaleString()}</p>
            </div>
          </div>
          <div className="summary-card red">
            <AlertTriangle size={32} />
            <div>
              <h4>Overdue</h4>
              <p>RWF {financeData.summary.overdueAmount?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {financeData?.byType && Object.keys(financeData.byType).length > 0 && (
        <div className="payment-types">
          <h3>Payments by Type</h3>
          <div className="type-cards">
            {Object.entries(financeData.byType).map(([type, data]) => (
              <div key={type} className="type-card">
                <h4>{type}</h4>
                <div className="type-stats">
                  <p><strong>Total:</strong> RWF {data.total?.toLocaleString()}</p>
                  <p><strong>Paid:</strong> RWF {data.paid?.toLocaleString()}</p>
                  <p><strong>Pending:</strong> RWF {data.pending?.toLocaleString()}</p>
                  <p><strong>Count:</strong> {data.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {financeData?.monthlyTrend && Object.keys(financeData.monthlyTrend).length > 0 && (
        <div className="monthly-trend">
          <h3>Monthly Trend</h3>
          <div className="trend-chart">
            {Object.entries(financeData.monthlyTrend)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, data]) => (
                <div key={month} className="trend-bar-item">
                  <span className="month-label">{month}</span>
                  <div className="trend-bar-wrapper">
                    <div className="trend-bar" style={{ height: `${Math.min(data.revenue / 1000, 100)}px` }}>
                      <span className="bar-value">RWF {data.revenue?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {financeData?.outstandingPayments && financeData.outstandingPayments.length > 0 && (
        <div className="data-table-container">
          <h3>Outstanding Payments</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {financeData.outstandingPayments.map((payment, index) => (
                <tr key={index}>
                  <td>{payment.studentName}</td>
                  <td>{payment.type}</td>
                  <td className="amount-cell">RWF {payment.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${payment.status?.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{new Date(payment.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="reports-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <PieChart size={28} />
          <h2>Reports</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'performance' ? 'active' : ''}
            onClick={() => setActiveTab('performance')}
          >
            <BarChart3 size={18} /> Performance
          </button>
          <button 
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
          >
            <Calendar size={18} /> Attendance
          </button>
          <button 
            className={activeTab === 'finance' ? 'active' : ''}
            onClick={() => setActiveTab('finance')}
          >
            <DollarSign size={18} /> Financial
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="reports-content">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filter-group">
            <Filter size={16} />
            <span>Filters:</span>
          </div>
          
          {(activeTab === 'performance' || activeTab === 'attendance') && (
            <>
              <select 
                value={filters.classFilter} 
                onChange={(e) => handleFilterChange('classFilter', e.target.value)}
              >
                <option value="">All Classes</option>
                <option value="S4">S4</option>
                <option value="S5">S5</option>
                <option value="S6">S6</option>
              </select>
            </>
          )}
          
          {activeTab === 'performance' && (
            <select 
              value={filters.semester} 
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          )}
          
          {activeTab === 'attendance' && (
            <>
              <input 
                type="date" 
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              <input 
                type="date" 
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </>
          )}
          
          {activeTab === 'finance' && (
            <>
              <select 
                value={filters.year} 
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <select 
                value={filters.month} 
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </>
          )}
          
          <button className="btn-apply" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : (
          <>
            {activeTab === 'performance' && <PerformanceReport />}
            {activeTab === 'attendance' && <AttendanceReport />}
            {activeTab === 'finance' && <FinanceReport />}
          </>
        )}
      </main>
    </div>
  );
}

export default Reports;
