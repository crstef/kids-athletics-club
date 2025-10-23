import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import athletesRoutes from './routes/athletes';
import resultsRoutes from './routes/results';
import eventsRoutes from './routes/events';
import accessRequestsRoutes from './routes/accessRequests';
import messagesRoutes from './routes/messages';
import permissionsRoutes from './routes/permissions';
import rolesRoutes from './routes/roles';
import approvalRequestsRoutes from './routes/approvalRequests';
import ageCategoriesRoutes from './routes/ageCategories';
import probesRoutes from './routes/probes';
import userPermissionsRoutes from './routes/userPermissions';
import { createAdminUser, initializeData, addSampleData, fixAdminRole, addGenderColumn } from './routes/setup';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isPassenger = process.env.PASSENGER_SUPPORT_STARTED === '1';
const passengerEnv = process.env.PASSENGER_APP_ENV || (process.env as any).PassengerAppEnv;
const resolvedEnv = process.env.NODE_ENV || passengerEnv || (isPassenger ? 'production' : 'development');

// Ensure downstream libraries see the resolved environment
if (isPassenger && process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = resolvedEnv;
}

const NODE_ENV = resolvedEnv;
const IS_PRODUCTION = NODE_ENV === 'production';

const distDir = path.join(__dirname, '../../dist');
const rootDir = path.join(__dirname, '../..');
const uploadsDir = path.join(__dirname, '../uploads');

console.log('[server] boot', {
  isPassenger,
  passengerEnv,
  NODE_ENV,
  distExists: fs.existsSync(distDir),
  requestedDistFile: path.join(distDir, 'index-CdtJarpe.js')
});

// CORS Configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Allow requests with no origin (like mobile or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://kidsathletic.hardweb.ro',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
      'https://kidsathletic.hardweb.ro'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (serve user-uploaded files)
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve static assets when available (helps even if NODE_ENV e=development on hosting)
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
} else {
  console.warn('[server] dist folder missing, skipping static bundle serving');
}

if (fs.existsSync(rootDir)) {
  app.use(express.static(rootDir));
}

// Request logging (only in development)
if (!IS_PRODUCTION) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/athletes', athletesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/access-requests', accessRequestsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/approval-requests', approvalRequestsRoutes);
app.use('/api/age-categories', ageCategoriesRoutes);
app.use('/api/probes', probesRoutes);
app.use('/api/user-permissions', userPermissionsRoutes);

// Setup endpoints (for initial deployment)
app.post('/api/setup/create-admin', createAdminUser);
app.get('/api/setup/initialize-data', initializeData);
app.get('/api/setup/add-sample-data', addSampleData);
app.get('/api/setup/fix-admin-role', fixAdminRole);
app.get('/api/setup/add-gender-column', addGenderColumn);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// SPA fallback - serve index.html for non-API GET routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return next();
  }

  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  
  // Log error
  if (NODE_ENV === 'development') {
    console.error('Error:', {
      status: statusCode,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    console.error(`[${new Date().toISOString()}] Error: ${message}`);
  }

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server only if not running under Passenger
// Passenger manages the server, so we only export the app
if (process.env.PASSENGER_SUPPORT_STARTED === '1') {
  // Running under Passenger - just export the app
  console.log(`✅ App loaded for Passenger in ${NODE_ENV} mode`);
} else {
  // Running standalone - start the server
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} in ${NODE_ENV} mode`);
    console.log(`📌 Health check: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

export default app;
