// Simple Multi-Disease Platform Backend
// This is a basic version that can run without all dependencies

const express = require('express');
const http = require('http');

const PORT = 5000;

// Simple logger
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
};

class SimpleApplication {
  private app: any;
  private server: any;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req: any, res: any, next: any) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Logging
    this.app.use((req: any, res: any, next: any) => {
      logger.info(`${req.method} ${req.url}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'Multi-Disease Platform API'
      });
    });

    // API info
    this.app.get('/api/version', (req: any, res: any) => {
      res.json({
        version: '1.0.0',
        apiVersion: 'v1',
        environment: 'development',
        features: [
          'Multi-Disease Support',
          'Role-Based Access Control',
          'Two-Factor Authentication',
          'Questionnaires & Measurements',
          'Organization Management'
        ]
      });
    });

    // Mock API endpoints
    this.app.get('/api/organizations', (req: any, res: any) => {
      res.json({
        organizations: [
          {
            id: '1',
            name: 'General Hospital',
            type: 'HOSPITAL',
            isActive: true
          },
          {
            id: '2', 
            name: 'Medical Support Desk',
            type: 'SERVICE_DESK',
            isActive: true
          }
        ],
        total: 2
      });
    });

    this.app.get('/api/diseases', (req: any, res: any) => {
      res.json({
        diseases: [
          {
            id: '1',
            name: 'Diabetes Type 2',
            code: 'E11',
            category: 'Endocrine'
          },
          {
            id: '2',
            name: 'Hypertension',
            code: 'I10',
            category: 'Cardiovascular'
          }
        ]
      });
    });

    this.app.get('/api/treatments', (req: any, res: any) => {
      res.json({
        treatments: [
          {
            id: '1',
            name: 'Diabetes Management Protocol',
            diseaseId: '1',
            description: 'Comprehensive diabetes treatment plan'
          },
          {
            id: '2',
            name: 'Hypertension Control Plan',
            diseaseId: '2', 
            description: 'Blood pressure management protocol'
          }
        ]
      });
    });

    // 404 handler
    this.app.use('*', (req: any, res: any) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: [
          'GET /health',
          'GET /api/version',
          'GET /api/organizations',
          'GET /api/diseases', 
          'GET /api/treatments'
        ]
      });
    });

    // Error handler
    this.app.use((error: any, req: any, res: any, next: any) => {
      logger.error('Unhandled error:', error.message);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong'
      });
    });
  }

  public start(): void {
    this.server.listen(PORT, () => {
      logger.info(`🚀 Multi-Disease Platform API running on port ${PORT}`);
      logger.info(`📚 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🔧 API Info: http://localhost:${PORT}/api/version`);
      logger.info(`🏥 Organizations: http://localhost:${PORT}/api/organizations`);
      logger.info(`💊 Diseases: http://localhost:${PORT}/api/diseases`);
      logger.info(`🩺 Treatments: http://localhost:${PORT}/api/treatments`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      this.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      this.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  }
}

// Start the application
const app = new SimpleApplication();
app.start(); 