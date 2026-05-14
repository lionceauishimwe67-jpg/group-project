import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { testConnection } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { activityLogger } from './middleware/activityLogger';
import mime from 'mime-types';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import timetableRoutes from './routes/timetable';
import announcementRoutes from './routes/announcements';
import displayRoutes from './routes/display';
import teachersRoutes from './routes/teachers';
import notificationRoutes from './routes/notifications';
import teacherCheckinRoutes from './routes/teacherCheckins';
import reportRoutes from './routes/reports';
import bellRoutes from './routes/bell';
import breakTimesRoutes from './routes/breakTimes';
import dynamicEventsRoutes from './routes/dynamicEvents';
import timeRoutes from './routes/time';
import phoneNumbersRoutes from './routes/phoneNumbers';
import studentRoutes from './routes/students';
import gradeRoutes from './routes/grades';
import alumniRoutes from './routes/alumni';
import schoolEventRoutes from './routes/schoolEvents';
import uploadRoutes from './routes/uploads';
import parentRoutes from './routes/parents';
import smartTimetableRoutes from './routes/smartTimetable';
import hardwareRoutes from './routes/hardware';

// Import scheduler
import { startNotificationScheduler } from './schedulers/notificationScheduler';
import { startLessonStatusScheduler } from './schedulers/lessonStatusScheduler';
import { startNotificationTriggerScheduler } from './schedulers/notificationTriggerScheduler';
import { startBellScheduler } from './schedulers/bellScheduler';
import { startDayEndScheduler } from './schedulers/dayEndScheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

const configuredClientUrls = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '').split(',')
].filter(Boolean) as string[];

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (configuredClientUrls.includes(origin)) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/.test(origin)
    || /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
};

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Configure Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-manager-room', () => {
    socket.join('managers');
    console.log('User joined manager room');
  });

  socket.on('join-display-room', () => {
    socket.join('display');
    console.log('User joined display room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export io instance for use in other modules
export { io };

// Security middleware with enhanced headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  frameguard: { action: 'deny' }
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Requested-With'],
}));

// Activity logging middleware
app.use(activityLogger);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    
    if (NODE_ENV === 'development') {
      console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} ${logData.status} - ${logData.duration}`);
    } else {
      // In production, you might want to use a proper logging service
      console.log(JSON.stringify(logData));
    }
  });
  
  next();
});

// Body parser middleware (for JSON and URL-encoded data)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded images
const uploadsDir = path.join(process.cwd(), 'uploads');

// Configure Express to serve all file types
express.static.mime.define({
  'image/*': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'],
  'application/pdf': ['pdf'],
  'video/*': ['mp4', 'webm', 'ogg', 'avi', 'mov'],
  'application/*': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
});

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/display', displayRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teacher-checkins', teacherCheckinRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/bell', bellRoutes);
app.use('/api/break-times', breakTimesRoutes);
app.use('/api/dynamic-events', dynamicEventsRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/phone-numbers', phoneNumbersRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/school-events', schoolEventRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/smart-timetable', smartTimetableRoutes);
app.use('/api/hardware', hardwareRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Smart School Bell System API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      timetable: '/api/timetable',
      announcements: '/api/announcements',
      display: '/api/display',
      teachers: '/api/teachers',
      notifications: '/api/notifications',
      bell: '/api/bell',
      breakTimes: '/api/break-times',
      dynamicEvents: '/api/dynamic-events',
      students: '/api/students',
      grades: '/api/grades',
      alumni: '/api/alumni',
      schoolEvents: '/api/school-events',
      uploads: '/api/uploads',
      parents: '/api/parents',
      hardware: '/api/hardware',
      health: '/health'
    }
  });
});

// Serve frontend static files in production after API routes are registered
if (NODE_ENV === 'production') {
  const frontendBuildPath = path.join(process.cwd(), '../frontend/build');
  app.use(express.static(frontendBuildPath));
  
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    httpServer.listen(Number(PORT), HOST, () => {
      console.log(`Server running on ${HOST}:${PORT}`);
      console.log(`API available at http://localhost:${PORT}`);
      console.log(`WebSocket server ready`);
      
      // Start notification scheduler
      startNotificationScheduler();
      
      // Start lesson status scheduler
      startLessonStatusScheduler();
      
      // Start notification trigger scheduler
      startNotificationTriggerScheduler();
      
      // Start bell scheduler (unified system)
      startBellScheduler();
      
      // Start day-end scheduler (auto-clear timetable at end of day)
      startDayEndScheduler();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
