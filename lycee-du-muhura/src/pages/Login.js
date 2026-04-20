import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher-portal');
      else if (user.role === 'student') navigate('/student-portal');
      else if (user.role === 'parent') navigate('/parent');
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
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher-portal');
      else if (user.role === 'student') navigate('/student-portal');
      else if (user.role === 'parent') navigate('/parent');
    } else {
      setError('Invalid 2FA code');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Admin Login</h2>
        <p className="login-subtitle">Lycée Saint Alexandre Sauli - MUHURA</p>
        
        {error && <div className="error-message">{error}</div>}
        
        {!require2FA ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                placeholder="Enter user ID"
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
                required
                placeholder="Enter password"
              />
            </div>
            
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="login-form">
            <h3>Two-Factor Authentication</h3>
            <p>Enter the 6-digit code from your authenticator app</p>
            <div className="form-group">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}
        
        <div className="login-info">
          <p><strong>Default credentials:</strong></p>
          <p>Username: admin</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
