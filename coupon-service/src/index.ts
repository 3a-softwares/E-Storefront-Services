/**
 * Coupon Service v1.0.1
 * Handles discount coupon management
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file FIRST before any other imports
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { setupSwagger } from './config/swagger';
import couponRoutes from './routes/couponRoutes';
import { PORT_CONFIG, DEFAULT_CORS_ORIGINS } from '@3asoftwares/utils';
import { Logger } from '@3asoftwares/utils/server';

// Configure logger for coupon service
Logger.configure({
  enableConsole: true,
  enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH || 'logs/coupon-service.log',
  logLevel: process.env.LOG_LEVEL || 'debug',
});

const app: Application = express();
const PORT = process.env.PORT || PORT_CONFIG.COUPON;

app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_CORS_ORIGINS,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Coupon service is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/coupons', couponRoutes);

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
    await connectDatabase();
    app.listen(PORT, () => {
      Logger.info(`Coupon service running on port ${PORT}`, undefined, 'Startup');
      Logger.info(
        `Swagger docs available at http://localhost:${PORT}/api-docs`,
        undefined,
        'Startup'
      );
    });
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
