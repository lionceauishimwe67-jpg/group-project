import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-card">
        <h1>🚫 Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Contact your administrator if you believe this is an error.</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>
    </div>
  );
};

export default Unauthorized;
