import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import { PORT_CONFIG } from '../utils/config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Service API',
      version: '1.0.0',
      description: 'API documentation for the E-Commerce Ticket/Support Service',
      contact: {
        name: '3A Softwares',
        email: 'support@3asoftwares.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || PORT_CONFIG.TICKET_SERVICE}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Ticket MongoDB ID' },
            ticketId: { type: 'string', description: 'Human-readable ticket ID' },
            subject: { type: 'string', description: 'Ticket subject' },
            description: { type: 'string', description: 'Ticket description' },
            category: {
              type: 'string',
              enum: ['technical', 'billing', 'general', 'feature', 'order', 'account'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            status: {
              type: 'string',
              enum: ['open', 'in-progress', 'pending', 'resolved', 'closed'],
            },
            customerName: { type: 'string' },
            customerEmail: { type: 'string', format: 'email' },
            customerId: { type: 'string' },
            assignedTo: { type: 'string', description: 'Support user ID' },
            assignedToName: { type: 'string', description: 'Support user name' },
            resolution: { type: 'string' },
            comments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Comment' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            resolvedAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            userName: { type: 'string' },
            userRole: { type: 'string' },
            message: { type: 'string' },
            isInternal: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTicket: {
          type: 'object',
          required: ['subject', 'description', 'category', 'customerName', 'customerEmail'],
          properties: {
            subject: { type: 'string', minLength: 5, maxLength: 200 },
            description: { type: 'string', minLength: 10 },
            category: {
              type: 'string',
              enum: ['technical', 'billing', 'general', 'feature', 'order', 'account'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
            },
            customerName: { type: 'string' },
            customerEmail: { type: 'string', format: 'email' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.join(__dirname, '../routes/*.ts'), path.join(__dirname, '../swagger/*.yaml')],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(specs) as any);
};
