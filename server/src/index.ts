import express from 'express';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
