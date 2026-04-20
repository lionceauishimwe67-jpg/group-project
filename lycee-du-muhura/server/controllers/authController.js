const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register new user (admin only)
exports.register = async (req, res) => {
  try {
    const { username, email, password, name, role, department } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = new User({
      username,
      email,
      password,
      name,
      role: role || 'teacher',
      department
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't update password through this route
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// ========== 2FA FUNCTIONS ==========
const { generateSecret, verifyToken, generateQRCode } = require('../utils/2fa');

// Setup 2FA
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const secret = generateSecret();
    
    user.twoFactorTempSecret = secret.base32;
    await user.save();
    
    const qrCode = await generateQRCode(secret.otpauth_url);
    res.json({ success: true, secret: secret.base32, qrCode });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enable 2FA
exports.enable2FA = async (req, res) => {
  try {
    const { token: twoFactorToken } = req.body;
    const user = await User.findById(req.user.id);
    
    const verified = verifyToken(user.twoFactorTempSecret, twoFactorToken);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }
    
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorEnabled = true;
    user.twoFactorTempSecret = null;
    await user.save();
    
    res.json({ success: true, message: '2FA enabled successfully' });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const { token: twoFactorToken } = req.body;
    const user = await User.findById(req.user.id);
    
    const verified = verifyToken(user.twoFactorSecret, twoFactorToken);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }
    
    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    await user.save();
    
    res.json({ success: true, message: '2FA disabled successfully' });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify 2FA during login
exports.verify2FA = async (req, res) => {
  try {
    const { token: twoFactorToken, tempToken } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.require2FA) {
      return res.status(400).json({ success: false, message: 'Invalid session' });
    }
    
    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA not enabled' });
    }
    
    const verified = verifyToken(user.twoFactorSecret, twoFactorToken);
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    user.lastLogin = Date.now();
    await user.save();
    
    res.json({ success: true, token, user: user.toJSON() });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
