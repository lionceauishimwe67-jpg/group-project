import { Request, Response, NextFunction } from 'express';
import { run } from '../config/database';

interface ActivityLog {
  user_id: number;
  username: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure';
}

// Create activity logs table if not exists
const initActivityLogsTable = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT NOT NULL,
        resource TEXT,
        ip_address TEXT,
        user_agent TEXT,
        status TEXT DEFAULT 'success',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating activity_logs table:', error);
  }
};

// Initialize table on module load
initActivityLogsTable();

// Activity logging middleware
export const logActivity = async (log: ActivityLog) => {
  try {
    await run(
      `INSERT INTO activity_logs (user_id, username, action, resource, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        log.user_id,
        log.username,
        log.action,
        log.resource,
        log.ip_address,
        log.user_agent,
        log.status
      ]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Middleware to log admin actions
export const activityLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function (data) {
    // Log after response is sent
    const userId = (req as any).user?.userId || 0;
    const username = (req as any).user?.username || 'unknown';
    
    const action = `${req.method} ${req.route?.path || req.path}`;
    const resource = req.path;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const status = res.statusCode >= 400 ? 'failure' : 'success';
    
    // Only log admin routes and auth actions
    if (req.path.startsWith('/admin') || req.path.startsWith('/api/auth')) {
      logActivity({
        user_id: userId,
        username,
        action,
        resource,
        ip_address: ipAddress,
        user_agent: userAgent,
        status
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Get recent activity logs
export const getActivityLogs = async (limit: number = 50) => {
  try {
    const db = await (await import('../config/database')).getDb();
    const logs = await db.all(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};
