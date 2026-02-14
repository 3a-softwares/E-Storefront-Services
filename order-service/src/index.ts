/**
 * Order Service v1.0.1
 * Handles order processing and management
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file ONLY in development
// On Vercel, environment variables are injected automatically
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../.env.local');
  dotenv.config({ path: envPath });
}

import express, { Application, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { setupSwagger } from './config/swagger';
import orderRoutes from './routes/orderRoutes';
import { initializeWebSocket } from './websocket/orderSocket';
import { PORT_CONFIG, DEFAULT_CORS_ORIGINS } from '@3asoftwares/utils';
import { Logger } from '@3asoftwares/utils/server';

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1';

// Configure logger for order service
// Disable file logging on Vercel since serverless has no persistent filesystem
Logger.configure({
  enableConsole: true,
  enableFile: !isVercel && process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH || 'logs/order-service.log',
  logLevel: process.env.LOG_LEVEL || 'debug',
});

// Log CORS configuration for debugging
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_CORS_ORIGINS;
Logger.info(`ALLOWED_ORIGINS configured: ${JSON.stringify(allowedOrigins)}`, undefined, 'CORS');

const app: Application = express();
const PORT = process.env.PORT || PORT_CONFIG.ORDER;

// Module-level promise to track database connection readiness (for serverless)
let dbConnectionPromise: Promise<void> | null = null;
let isConnected = false;

const httpServer = createServer(app);
initializeWebSocket(httpServer);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure database connection is ready before processing requests
// Critical for Vercel serverless environment where cold starts happen
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If running on Vercel or no connection exists, ensure DB is connected
    if (isVercel || !isConnected) {
      if (!dbConnectionPromise) {
        dbConnectionPromise = connectDatabase().then(() => {
          isConnected = true;
        });
      }
      await dbConnectionPromise;
    }
    next();
  } catch (error: any) {
    Logger.error('Database connection middleware error', error, 'Middleware');
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Order service is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/orders', orderRoutes);

// Setup Swagger documentation
setupSwagger(app);

app.use((req: Request, res: Response) => {
  Logger.warn(`Route not found: ${req.method} ${req.path}`, undefined, 'Router');
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

app.use((err: any, req: Request, res: Response, _next: any) => {
  Logger.error(
    `Unhandled error: ${err.message}`,
    { stack: err.stack, path: req.path, method: req.method },
    'ErrorHandler'
  );
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const startServer = async () => {
  try {
    // Only listen if not running in serverless environment
    if (process.env.VERCEL !== '1') {
      await connectDatabase();
      httpServer.listen(PORT, () => {
        Logger.info(`Order service running on port ${PORT}`, undefined, 'Startup');
        Logger.info('WebSocket server initialized', undefined, 'Startup');
        Logger.info(
          `Swagger docs available at http://localhost:${PORT}/api-docs`,
          undefined,
          'Startup'
        );
      });
    }
  } catch (error: any) {
    Logger.error('Failed to start server', { error: error.message }, 'Startup');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully', undefined, 'Shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully', undefined, 'Shutdown');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught exception', { error: error.message, stack: error.stack }, 'Process');
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('Unhandled rejection', { reason: reason?.message || reason }, 'Process');
});

startServer();

export default app;
