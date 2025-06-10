import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

// Import route modules
import authRoutes from './auth';
import userRoutes from './users';
import organizationRoutes from './organizations';
import patientRoutes from './patients';
import treatmentRoutes from './treatments';
import questionnaireRoutes from './questionnaires';
import measurementGroupRoutes from './measurementGroups';
import diseaseRoutes from './diseases';
import medicationRoutes from './medications';
import vitalSignsRoutes from './vitalSigns';
import taskRoutes from './tasks';
import appointmentRoutes from './appointments';
import notificationRoutes from './notifications';
import reportsRoutes from './reports';
import adminRoutes from './admin';

// Swagger documentation
import { swaggerSpec } from '../utils/swagger';

// Middleware
import { authenticateToken } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

export const setupRoutes = (app: Application): void => {
  // API Documentation
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Public routes (no authentication required)
  app.use('/api/auth', rateLimitMiddleware, authRoutes);

  // Protected routes (authentication required)
  app.use('/api/users', authenticateToken, userRoutes);
  app.use('/api/organizations', authenticateToken, organizationRoutes);
  app.use('/api/patients', authenticateToken, patientRoutes);
  app.use('/api/treatments', authenticateToken, treatmentRoutes);
  app.use('/api/questionnaires', authenticateToken, questionnaireRoutes);
  app.use('/api/measurement-groups', authenticateToken, measurementGroupRoutes);
  app.use('/api/diseases', authenticateToken, diseaseRoutes);
  app.use('/api/medications', authenticateToken, medicationRoutes);
  app.use('/api/vital-signs', authenticateToken, vitalSignsRoutes);
  app.use('/api/tasks', authenticateToken, taskRoutes);
  app.use('/api/appointments', authenticateToken, appointmentRoutes);
  app.use('/api/notifications', authenticateToken, notificationRoutes);
  app.use('/api/reports', authenticateToken, reportsRoutes);
  
  // Admin routes (additional role checking)
  app.use('/api/admin', authenticateToken, adminRoutes);

  // API version info
  app.get('/api/version', (req, res) => {
    res.json({
      version: process.env.npm_package_version || '1.0.0',
      apiVersion: 'v1',
      environment: process.env.NODE_ENV || 'development',
    });
  });
}; 