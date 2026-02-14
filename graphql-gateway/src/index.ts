/**
 * GraphQL Gateway v1.0.1
 * Unified API gateway for all microservices
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file FIRST before any other imports
// Load based on NODE_ENV: development -> .env.local, production -> .env.production
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
const envPath = path.resolve(__dirname, `../${envFile}`);
dotenv.config({ path: envPath });

import { ApolloServer } from '@apollo/server';
import jwt from 'jsonwebtoken';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { PORT_CONFIG, DEFAULT_CORS_ORIGINS } from '@3asoftwares/utils';
import { Logger } from '@3asoftwares/utils/server';
import healthRoutes from './routes/health.routes';
import seedRoutes from './routes/seed.routes';

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1';

// Configure logger for GraphQL Gateway
// Disable file logging on Vercel since serverless has no persistent filesystem
Logger.configure({
  enableConsole: true,
  enableFile: !isVercel && process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH || 'logs/graphql-gateway.log',
  logLevel: process.env.LOG_LEVEL || 'debug',
});

const PORT = process.env.PORT || PORT_CONFIG.GRAPHQL;

// Parse and normalize allowed origins (trim whitespace)
const getAllowedOrigins = (): string[] => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }
  return DEFAULT_CORS_ORIGINS;
};

// CORS options configuration
const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

Logger.info(`CORS allowed origins: ${JSON.stringify(corsOptions.origin)}`, undefined, 'Server');

let apolloServer: ApolloServer | null = null;
let httpServer: any = null;
let initializationPromise: Promise<express.Application> | null = null;

async function initializeApolloServer() {
  if (initializationPromise) {
    return initializationPromise; // Return existing promise if already initializing
  }

  initializationPromise = (async () => {
    Logger.info('Initializing GraphQL Gateway...', undefined, 'Server');
    const app = express();
    httpServer = createServer(app);

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      introspection: true, // Enable GraphQL introspection
      includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development', // Better error messages in dev
    });

    apolloServer = server;
    await server.start();

    // Apply CORS middleware globally for all routes (handles preflight requests)
    app.use(cors<cors.CorsRequest>(corsOptions));

    app.use(
      '/graphql',
      express.json({ limit: '10mb' }),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const token = req.headers.authorization?.replace('Bearer ', '') || '';
          let user = {};

          if (token) {
            try {
              const decoded = jwt.decode(token) as {
                userId: string;
                email: string;
                role: string;
                name?: string;
              } | null;
              if (decoded) {
                user = {
                  id: decoded.userId,
                  email: decoded.email,
                  role: decoded.role,
                  name: decoded.name || decoded.email,
                };
              }
            } catch (error) {
              // Token decode failed, user remains null
            }
          }

          return { token, user };
        },
      })
    );

    // Root path handler
    app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'GraphQL Gateway API',
        graphqlEndpoint: '/graphql',
        healthEndpoint: '/api/health',
        seedEndpoint: '/api/seed',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/health', (_req, res) => {
      res.json({
        success: true,
        message: 'GraphQL Gateway is running',
        timestamp: new Date().toISOString(),
      });
    });

    // Register API routes with /api prefix
    app.use(
      '/api',
      express.json(),
      (req, res, next) => {
        // Attach user context to request for authorization
        const token = req.headers.authorization?.replace('Bearer ', '') || '';
        let user = {};

        if (token) {
          try {
            const decoded = jwt.decode(token) as {
              userId: string;
              email: string;
              role: string;
              name?: string;
            } | null;
            if (decoded) {
              user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                name: decoded.name || decoded.email,
              };
            }
          } catch (error) {
            // Token decode failed, user remains null
          }
        }

        (req as any).user = user;
        next();
      }
    );

    // Register route handlers
    app.use('/api', healthRoutes);
    app.use('/api', seedRoutes);

    // Start listening only if not in serverless environment
    if (process.env.VERCEL !== '1') {
      await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
      Logger.info(`GraphQL Gateway running on port ${PORT}`, undefined, 'Server');
    }

    Logger.info('GraphQL Gateway initialized successfully', undefined, 'Server');
    return app;
  })();

  return initializationPromise;
}

// Create Express app with middleware to ensure initialization
const app = express();

// Middleware to ensure Apollo Server is initialized before handling requests
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await initializeApolloServer();
    next();
  } catch (error: any) {
    Logger.error('GraphQL Gateway initialization error', error, 'Middleware');
    res.status(503).json({
      success: false,
      message: 'GraphQL Gateway not ready',
      error: error.message,
    });
  }
});

// For non-serverless environments, start the server
if (process.env.VERCEL !== '1') {
  initializeApolloServer()
    .then(() => {
      Logger.info('GraphQL Gateway started successfully', undefined, 'Server');
    })
    .catch((error) => {
      Logger.error('Failed to initialize GraphQL Gateway', error, 'Server');
      process.exit(1);
    });
}

export default app;

