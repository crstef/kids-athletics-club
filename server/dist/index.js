"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("./routes/auth"));
const public_1 = __importDefault(require("./routes/public"));
const users_1 = __importDefault(require("./routes/users"));
const athletes_1 = __importDefault(require("./routes/athletes"));
const results_1 = __importDefault(require("./routes/results"));
const accessRequests_1 = __importDefault(require("./routes/accessRequests"));
const messages_1 = __importDefault(require("./routes/messages"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const roles_1 = __importDefault(require("./routes/roles"));
const approvalRequests_1 = __importDefault(require("./routes/approvalRequests"));
const ageCategories_1 = __importDefault(require("./routes/ageCategories"));
const events_1 = __importDefault(require("./routes/events"));
const userPermissions_1 = __importDefault(require("./routes/userPermissions"));
const dashboards_1 = __importDefault(require("./routes/dashboards"));
const components_1 = __importDefault(require("./routes/components"));
const setup_1 = require("./routes/setup");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const isPassenger = process.env.PASSENGER_SUPPORT_STARTED === '1';
const passengerEnv = process.env.PASSENGER_APP_ENV || process.env.PassengerAppEnv;
const resolvedEnv = process.env.NODE_ENV || passengerEnv || (isPassenger ? 'production' : 'development');
// Ensure downstream libraries see the resolved environment
if (isPassenger && process.env.NODE_ENV !== 'production') {
    process.env.NODE_ENV = resolvedEnv;
}
const NODE_ENV = resolvedEnv;
const _IS_PRODUCTION = NODE_ENV === 'production';
const distDir = path_1.default.join(__dirname, '../../dist');
const _rootDir = path_1.default.join(__dirname, '../..');
const uploadsDir = path_1.default.join(__dirname, '../uploads');
console.log('[server] boot', {
    isPassenger,
    passengerEnv,
    NODE_ENV,
    distExists: fs_1.default.existsSync(distDir),
    requestedDistFile: path_1.default.join(distDir, 'index-CdtJarpe.js')
});
// CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile or curl requests)
        if (!origin)
            return callback(null, true);
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
        }
        else {
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(uploadsDir));
// Serve the compiled frontend assets
app.use(express_1.default.static(distDir, {
    maxAge: _IS_PRODUCTION ? '1y' : 0,
    index: false
}));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/public', public_1.default);
app.use('/api/users', users_1.default);
app.use('/api/athletes', athletes_1.default);
app.use('/api/results', results_1.default);
app.use('/api/access-requests', accessRequests_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/approval-requests', approvalRequests_1.default);
app.use('/api/age-categories', ageCategories_1.default);
app.use('/api/events', events_1.default);
app.use('/api/user-permissions', userPermissions_1.default);
app.use('/api/dashboards', dashboards_1.default);
app.use('/api/components', components_1.default);
// Setup endpoints (for initial deployment)
app.post('/api/setup/create-admin', setup_1.createAdminUser);
app.get('/api/setup/initialize-data', setup_1.initializeData);
app.get('/api/setup/add-sample-data', setup_1.addSampleData);
app.get('/api/setup/fix-admin-role', setup_1.fixAdminRole);
app.get('/api/setup/add-gender-column', setup_1.addGenderColumn);
app.get('/api/setup/fix-user-roles', setup_1.fixUserRoles);
app.post('/api/setup/add-modern-dashboards', setup_1.addModernDashboards);
app.get('/api/setup/add-category-to-permissions', setup_1.addCategoryToPermissions);
app.post('/api/setup/populate-role-dashboards', setup_1.populateRoleDashboards);
app.get('/api/setup/complete', setup_1.completeSetup);
app.get('/api/setup/reset-database', setup_1.resetDatabase);
app.get('/api/setup/fix-role-dashboards-schema', setup_1.fixRoleDashboardsSchema);
app.get('/api/setup/create-user-widgets-table', setup_1.createUserWidgetsTable);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime()
    });
});
// SPA fallback - serve index.html for non-API GET routes
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    const indexHtmlPath = path_1.default.join(distDir, 'index.html');
    if (fs_1.default.existsSync(indexHtmlPath)) {
        return res.sendFile(indexHtmlPath);
    }
    // Frontend bundle not present on this server. Avoid throwing and provide guidance.
    res.status(200).send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Club Atletism Sibiu</title>
      <style>
        body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b0b0b; color:#e8e8e8; display:flex; align-items:center; justify-content:center; min-height:100vh; }
        .box { max-width: 720px; padding: 24px; border: 1px solid #2a2a2a; border-radius: 12px; background: #121212; }
        h1 { margin: 0 0 8px; font-size: 24px; }
        p { margin: 8px 0; color:#bdbdbd; }
        code { background:#1b1b1b; padding:2px 6px; border-radius:6px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Frontend bundle not found</h1>
        <p>The backend is running, but the frontend build (dist/index.html) is not present on this server.</p>
        <p>Deploy the frontend by building locally and uploading the <code>dist/</code> folder, or serve the SPA via Nginx/web root and proxy only <code>/api</code> to this server.</p>
      </div>
    </body>
  </html>`);
});
// Error handling middleware
app.use((err, req, res, _next) => {
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
    }
    else {
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
}
else {
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
exports.default = app;
