import React, { useState } from 'react';
import authService from '../services/authService';

const TwoFactorSetup = () => {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const setup2FA = async () => {
    try {
      const result = await authService.setup2FA();
      if (result.success) {
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setStep(2);
      }
    } catch (err) {
      setError('Failed to setup 2FA');
    }
  };

  const enable2FA = async () => {
    try {
      const result = await authService.enable2FA(token);
      if (result.success) {
        setMessage('2FA enabled successfully!');
        setStep(3);
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError('Failed to enable 2FA');
    }
  };

  return (
    <div className="two-factor-setup">
      <h3>Two-Factor Authentication (2FA)</h3>
      
      {step === 1 && (
        <div>
          <p>Protect your account with 2FA</p>
          <button onClick={setup2FA}>Setup 2FA</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <p>1. Scan this QR code with Google Authenticator:</p>
          <img src={qrCode} alt="2FA QR Code" />
          <p>2. Or enter this code manually: <strong>{secret}</strong></p>
          <p>3. Enter the 6-digit code from the app:</p>
          <input 
            type="text" 
            value={token} 
            onChange={(e) => setToken(e.target.value)}
            placeholder="000000"
            maxLength="6"
          />
          <button onClick={enable2FA}>Verify & Enable</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="success">{message}</p>
          <p>2FA is now enabled on your account!</p>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default TwoFactorSetup;
