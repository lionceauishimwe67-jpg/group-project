import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ students, grades, courses }) => {
  // Calculate statistics
  const totalStudents = students?.length || 0;
  const totalCourses = courses?.length || 0;
  const totalGrades = grades?.length || 0;
  
  // Pass/Fail calculation
  const passedGrades = grades?.filter(g => g?.score >= 50)?.length || 0;
  const failedGrades = (totalGrades - passedGrades) || 0;
  const passRate = totalGrades ? ((passedGrades / totalGrades) * 100).toFixed(1) : 0;
  
  // Average score
  const avgScore = totalGrades 
    ? (grades?.reduce((sum, g) => sum + (g?.score || 0), 0) / totalGrades).toFixed(1)
    : 0;

  // Data for charts
  const performanceData = [
    { name: 'A (90-100)', count: grades?.filter(g => g?.score >= 90)?.length || 0, fill: '#4CAF50' },
    { name: 'B (80-89)', count: grades?.filter(g => g?.score >= 80 && g?.score < 90)?.length || 0, fill: '#8BC34A' },
    { name: 'C (70-79)', count: grades?.filter(g => g?.score >= 70 && g?.score < 80)?.length || 0, fill: '#FFC107' },
    { name: 'D (60-69)', count: grades?.filter(g => g?.score >= 60 && g?.score < 70)?.length || 0, fill: '#FF9800' },
    { name: 'F (<60)', count: grades?.filter(g => g?.score < 60)?.length || 0, fill: '#F44336' },
  ];

  const passFailData = [
    { name: 'Pass', value: passedGrades, fill: '#4CAF50' },
    { name: 'Fail', value: failedGrades, fill: '#F44336' },
  ];

  const classDistribution = [
    { class: 'S4', students: students?.filter(s => s?.class === 'S4')?.length || 0 },
    { class: 'S5', students: students?.filter(s => s?.class === 'S5')?.length || 0 },
    { class: 'S6', students: students?.filter(s => s?.class === 'S6')?.length || 0 },
  ];

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

  return (
    <div className="analytics-dashboard">
      <h2><TrendingUp size={24} /> Analytics Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card blue">
          <Users size={32} />
          <div>
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        
        <div className="stat-card purple">
          <BookOpen size={32} />
          <div>
            <h3>{totalCourses}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        
        <div className="stat-card green">
          <Award size={32} />
          <div>
            <h3>{avgScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card orange">
          <TrendingUp size={32} />
          <div>
            <h3>{passRate}%</h3>
            <p>Pass Rate</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Pass/Fail Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={passFailData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {passFailData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-container">
          <h3>Students by Class</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={classDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="class" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="students" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h3>Performance Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#764ba2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="summary-table">
        <h3>Performance Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Students</td>
              <td>{totalStudents}</td>
              <td className="status good">Active</td>
            </tr>
            <tr>
              <td>Average Score</td>
              <td>{avgScore}%</td>
              <td className={avgScore >= 60 ? 'status good' : 'status warning'}>
                {avgScore >= 60 ? 'Good' : 'Needs Improvement'}
              </td>
            </tr>
            <tr>
              <td>Pass Rate</td>
              <td>{passRate}%</td>
              <td className={passRate >= 70 ? 'status good' : 'status warning'}>
                {passRate >= 70 ? 'Excellent' : 'Needs Attention'}
              </td>
            </tr>
            <tr>
              <td>Total Courses</td>
              <td>{totalCourses}</td>
              <td className="status good">Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
