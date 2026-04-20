import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [require2FA, setRequire2FA] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = authService.getToken();
    const savedUser = authService.getUser();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (userId, password) => {
    const result = await authService.login(userId, password);
    
    if (result.require2FA) {
      setRequire2FA(true);
      return { require2FA: true };
    }
    
    if (result.success) {
      setUser(result.user);
      setRequire2FA(false);
    }
    
    return result;
  };

  const verify2FA = async (token) => {
    const result = await authService.verify2FA(token);
    
    if (result.success) {
      setUser(result.user);
      setRequire2FA(false);
    }
    
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setRequire2FA(false);
  };

  const hasPermission = (permission) => {
    return authService.hasPermission(permission);
  };

  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  const value = {
    user,
    login,
    logout,
    verify2FA,
    require2FA,
    hasPermission,
    hasRole,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
