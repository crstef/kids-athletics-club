import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { createAdminUser } from './routes/setup';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'production' 
    ? 'https://hardweb.ro' 
    : ['http://localhost:3000', 'http://localhost:5173'],
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

// Request logging (only in development)
if (NODE_ENV === 'development') {
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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
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
