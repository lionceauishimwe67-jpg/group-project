import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const children = [
    { name: 'Jean Pierre', class: 'S4', gpa: 3.5, attendance: 92 },
    { name: 'Marie Claire', class: 'S5', gpa: 3.8, attendance: 95 }
  ];

  const payments = [
    { type: 'Tuition', amount: 150000, status: 'paid', date: '2024-01-15' },
    { type: 'Exam Fee', amount: 25000, status: 'pending', date: '2024-02-01' },
    { type: 'Registration', amount: 50000, status: 'overdue', date: '2024-01-01' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page parent-dashboard">
      <div className="portal-header">
        <div className="parent-info">
          <h2>Parent Portal - {user?.name}</h2>
          <p>Monitor your children's progress</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="portal-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button className={activeTab === 'grades' ? 'active' : ''} onClick={() => setActiveTab('grades')}>📚 Grades</button>
        <button className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>📅 Attendance</button>
        <button className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>💰 Payments</button>
      </div>

      {activeTab === 'overview' && (
        <div className="dashboard-content">
          <div className="stats-grid">
            {children.map((child, i) => (
              <div key={i} className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <h3>{child.name}</h3>
                <p>Class: {child.class}</p>
                <p>GPA: {child.gpa} | Attendance: {child.attendance}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="payments-content">
          <h2>💰 Payment History</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Amount (RWF)</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, i) => (
                <tr key={i}>
                  <td>{payment.type}</td>
                  <td>{payment.amount.toLocaleString()}</td>
                  <td><span className={`status-badge ${payment.status}`}>{payment.status}</span></td>
                  <td>{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
