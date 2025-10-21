"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const athletes_1 = __importDefault(require("./routes/athletes"));
const results_1 = __importDefault(require("./routes/results"));
const events_1 = __importDefault(require("./routes/events"));
const accessRequests_1 = __importDefault(require("./routes/accessRequests"));
const messages_1 = __importDefault(require("./routes/messages"));
const permissions_1 = __importDefault(require("./routes/permissions"));
const roles_1 = __importDefault(require("./routes/roles"));
const approvalRequests_1 = __importDefault(require("./routes/approvalRequests"));
const ageCategories_1 = __importDefault(require("./routes/ageCategories"));
const probes_1 = __importDefault(require("./routes/probes"));
const userPermissions_1 = __importDefault(require("./routes/userPermissions"));
const setup_1 = require("./routes/setup");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging (only in development)
if (NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/athletes', athletes_1.default);
app.use('/api/results', results_1.default);
app.use('/api/events', events_1.default);
app.use('/api/access-requests', accessRequests_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/permissions', permissions_1.default);
app.use('/api/roles', roles_1.default);
app.use('/api/approval-requests', approvalRequests_1.default);
app.use('/api/age-categories', ageCategories_1.default);
app.use('/api/probes', probes_1.default);
app.use('/api/user-permissions', userPermissions_1.default);
// Setup endpoints (for initial deployment)
app.post('/api/setup/create-admin', setup_1.createAdminUser);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime()
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
