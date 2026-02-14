/**
 * Ticket Service v1.0.1
 * Handles customer support tickets
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file ONLY in development
// On Vercel, environment variables are injected automatically
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../.env.local');
  dotenv.config({ path: envPath });
}

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database';
import { setupSwagger } from './config/swagger';
import ticketRoutes from './routes/ticketRoutes';
import { PORT_CONFIG, DEFAULT_CORS_ORIGINS } from './utils/config';
import { Logger } from './utils/logger';

// Log CORS configuration for debugging
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_CORS_ORIGINS;
Logger.info(`ALLOWED_ORIGINS configured: ${JSON.stringify(allowedOrigins)}`, undefined, 'CORS');

const app: Application = express();
const PORT = process.env.PORT || PORT_CONFIG.TICKET_SERVICE;

// Middleware
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

// Health check
app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Ticket service is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/tickets', ticketRoutes);

// Setup Swagger documentation
setupSwagger(app);

// 404 handler
app.use((req: Request, res: Response) => {
  Logger.warn(`Route not found: ${req.method} ${req.path}`, undefined, 'Router');
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, __: any) => {
  Logger.error(
    `Unhandled error: ${err.message}`,
    { stack: err.stack, path: req.path },
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
      Logger.info(`Ticket service running on port- ${PORT}`, undefined, 'Startup');
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

process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully', undefined, 'Shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully', undefined, 'Shutdown');
  process.exit(0);
});

// Only start the server if not running in a serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
