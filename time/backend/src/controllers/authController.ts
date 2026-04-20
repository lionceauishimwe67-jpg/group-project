import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { User } from '../types';

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // Find user
  const users = await query<User[]>(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username]
  );

  if (users.length === 0) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  const user = users[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Update last login
  await query("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);

  // Generate JWT with 2 hour expiration for better security
  const secret = process.env.JWT_SECRET || 'default-secret';
  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    secret,
    { expiresIn: '2h' }
  );

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }
  });
});

// Verify token (for checking auth status)
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // User is attached by authenticateToken middleware
  return res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Current password and new password are required'
    });
  }

  // Strengthen password requirements
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters'
    });
  }

  // Check for password complexity
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain uppercase, lowercase, numbers, and special characters'
    });
  }

  // Get current user
  const users = await query<User[]>('SELECT * FROM users WHERE id = ?', [userId]);

  if (users.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);

  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

  return res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Admin secret authentication
export const adminSecretAuth = asyncHandler(async (req: Request, res: Response) => {
  const { secret } = req.body;

  if (!secret) {
    return res.status(400).json({
      success: false,
      error: 'Secret key is required'
    });
  }

  const adminSecret = process.env.ADMIN_SECRET || 'school_admin_2024_secure_key';

  if (secret !== adminSecret) {
    return res.status(401).json({
      success: false,
      error: 'Invalid secret key'
    });
  }

  // Generate JWT for admin access with 1 hour expiration
  const jwtSecret = process.env.JWT_SECRET || 'default-secret';
  const token = jwt.sign(
    {
      userId: 0,
      username: 'admin',
      role: 'admin',
      secretAuth: true
    },
    jwtSecret,
    { expiresIn: '1h' }
  );

  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: 0,
        username: 'admin',
        role: 'admin'
      }
    },
    message: 'Admin access granted'
  });
});

// Create new user (admin only)
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, role = 'admin' } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // Strengthen password requirements
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters'
    });
  }

  // Check for password complexity
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain uppercase, lowercase, numbers, and special characters'
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await query<{ insertId: number }>(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );

    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        username,
        role
      },
      message: 'User created successfully'
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }
    throw error;
  }
});
