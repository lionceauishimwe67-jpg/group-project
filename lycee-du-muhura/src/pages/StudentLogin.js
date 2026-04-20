import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function StudentLogin() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verify2FA } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(userId, password);
    
    if (result.require2FA) {
      setRequire2FA(true);
    } else if (result.success) {
      // Redirect based on role
      const user = result.user;
      if (user.role === 'student') navigate('/student-portal');
    } else {
      setError(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verify2FA(twoFactorCode);
    
    if (result.success) {
      const user = result.user;
      if (user.role === 'student') navigate('/student-portal');
    } else {
      setError('Invalid 2FA code');
    }
    
    setLoading(false);
  };

  return (
    <div className="page login-page">
      <div className="login-container">
        <div className="login-icon">🎓</div>
        <h2>Student Portal</h2>
        <p className="login-subtitle">Access your grades, courses, and attendance</p>
        
        {error && <div className="error-message">{error}</div>}
        
        {!require2FA ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="userId">Student ID</label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                placeholder="Enter your Student ID (e.g., STU001)"
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login to Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="twoFactorCode">Two-Factor Authentication Code</label>
              <input
                type="text"
                id="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
        
        <div className="login-info">
          <p><strong>Demo Credentials:</strong></p>
          <p>Student ID: STU001</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
