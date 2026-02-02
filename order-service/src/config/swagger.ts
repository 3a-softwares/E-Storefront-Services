import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { PORT_CONFIG } from '@3asoftwares/utils';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Order Service API',
      version: '1.0.0',
      description: 'Order Management API with real-time updates',
      contact: {
        name: 'E-Commerce API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT_CONFIG.ORDER}`,
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
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            customerId: { type: 'string' },
            customerEmail: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  productName: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' },
                  sellerId: { type: 'string' },
                  subtotal: { type: 'number' },
                },
              },
            },
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            shipping: { type: 'number' },
            discount: { type: 'number' },
            couponCode: { type: 'string' },
            total: { type: 'number' },
            orderStatus: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
            },
            paymentMethod: { type: 'string' },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
                country: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateOrder: {
          type: 'object',
          required: [
            'customerId',
            'customerEmail',
            'items',
            'total',
            'shippingAddress',
            'paymentMethod',
          ],
          properties: {
            customerId: { type: 'string' },
            customerEmail: { type: 'string' },
            items: { type: 'array' },
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            shipping: { type: 'number' },
            discount: { type: 'number' },
            couponCode: { type: 'string' },
            total: { type: 'number' },
            shippingAddress: { type: 'object' },
            paymentMethod: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [{ name: 'Orders', description: 'Order management endpoints' }],
  },
  apis: ['./src/routes/*.ts', './src/swagger/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
  app.get('/api-docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
