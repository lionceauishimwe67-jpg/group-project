const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Basic token verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Full protection with database check
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive || user.isLocked()) {
      return res.status(401).json({ success: false, message: 'Access denied' });
    }
    
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password changed. Please login again' });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// Require 2FA
const require2FA = async (req, res, next) => {
  if (req.user.twoFactorEnabled && !req.session?.twoFAVerified) {
    return res.status(401).json({ success: false, message: '2FA required', require2FA: true });
  }
  next();
};

// Role-based access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No permission' });
    }
    next();
  };
};

// Permission-based access
const restrictToPermission = (...permissions) => {
  return (req, res, next) => {
    const hasPermission = permissions.some(perm => req.user.hasPermission(perm));
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

module.exports = { 
  authenticateToken, 
  protect,
  require2FA,
  requireAdmin, 
  restrictTo,
  restrictToPermission
};
