import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from './utils/logger';
import { connectDatabase } from './database/connection';
import { setupI18n } from './utils/i18n';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';
import { TaskScheduler } from './services/taskScheduler';
import { RulesEngine } from './services/rulesEngine';
import { setupWebSocket } from './services/websocket';
import { RedisService } from './services/redis';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

class Application {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private taskScheduler: TaskScheduler;
  private rulesEngine: RulesEngine;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.setupMiddleware();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Basic middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  }

  private setupWebSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
    });

    setupWebSocket(this.io);
  }

  private async setupServices(): Promise<void> {
    try {
      // Initialize Redis
      await RedisService.getInstance().connect();
      logger.info('Redis connected successfully');

      // Initialize task scheduler
      this.taskScheduler = new TaskScheduler();
      await this.taskScheduler.start();
      logger.info('Task scheduler started');

      // Initialize rules engine
      this.rulesEngine = new RulesEngine();
      await this.rulesEngine.start();
      logger.info('Rules engine started');

    } catch (error) {
      logger.error('Failed to setup services:', error);
      throw error;
    }
  }

  private async setupDatabase(): Promise<void> {
    try {
      await connectDatabase();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  private async setupInternationalization(): Promise<void> {
    try {
      await setupI18n();
      logger.info('Internationalization setup completed');
    } catch (error) {
      logger.error('Failed to setup internationalization:', error);
      throw error;
    }
  }

  private setupRoutes(): void {
    setupRoutes(this.app);
    
    // Error handling middleware (must be last)
    this.app.use(errorHandler);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Setup database connection
      await this.setupDatabase();

      // Setup internationalization
      await this.setupInternationalization();

      // Setup services
      await this.setupServices();

      // Setup routes
      this.setupRoutes();

      // Start server
      this.server.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
        logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
        logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);

        try {
          // Stop accepting new connections
          this.server.close(() => {
            logger.info('HTTP server closed');
          });

          // Close WebSocket connections
          this.io.close(() => {
            logger.info('WebSocket server closed');
          });

          // Stop services
          if (this.taskScheduler) {
            await this.taskScheduler.stop();
            logger.info('Task scheduler stopped');
          }

          if (this.rulesEngine) {
            await this.rulesEngine.stop();
            logger.info('Rules engine stopped');
          }

          // Close Redis connection
          await RedisService.getInstance().disconnect();
          logger.info('Redis disconnected');

          logger.info('Graceful shutdown completed');
          process.exit(0);

        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start the application
const app = new Application();
app.start().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

export default app; 