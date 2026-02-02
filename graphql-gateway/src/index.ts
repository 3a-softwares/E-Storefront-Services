/**
 * GraphQL Gateway v1.0.1
 * Unified API gateway for all microservices
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file FIRST before any other imports
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

import { ApolloServer } from '@apollo/server';
import jwt from 'jsonwebtoken';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { PORT_CONFIG, DEFAULT_CORS_ORIGINS } from '@3asoftwares/utils';
import { Logger } from '@3asoftwares/utils/server';

// Configure logger for GraphQL Gateway
Logger.configure({
  enableConsole: true,
  enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH || 'logs/graphql-gateway.log',
  logLevel: process.env.LOG_LEVEL || 'debug',
});

const PORT = process.env.PORT || PORT_CONFIG.GRAPHQL;

async function startApolloServer() {
  Logger.info('Starting GraphQL Gateway...', undefined, 'Server');
  const app = express();
  const httpServer = createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true, // Enable GraphQL introspection
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development', // Better error messages in dev
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_CORS_ORIGINS,
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '') || '';
        let user = null;

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
      healthEndpoint: '/health',
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

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
}

startApolloServer()
  .then(() => {
    Logger.info(`GraphQL Gateway running on port ${PORT}`, undefined, 'Server');
  })
  .catch((error) => {
    Logger.error('Failed to start Apollo Server', error, 'Server');
    process.exit(1);
  });
