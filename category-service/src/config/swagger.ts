import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import { PORT_CONFIG } from '@3asoftwares/utils';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Category Service API',
      version: '1.0.0',
      description: 'API documentation for the E-Commerce Category Service',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || PORT_CONFIG.CATEGORY}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Category ID',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            description: {
              type: 'string',
              description: 'Category description',
            },
            icon: {
              type: 'string',
              description: 'Category icon URL or name',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly slug',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the category is active',
            },
            productCount: {
              type: 'integer',
              description: 'Number of products in this category',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateCategory: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Category name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Category description',
            },
            icon: {
              type: 'string',
              description: 'Category icon URL or name',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the category is active',
            },
          },
        },
        UpdateCategory: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'Category name',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Category description',
            },
            icon: {
              type: 'string',
              description: 'Category icon URL or name',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the category is active',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '../swagger/*.yaml')],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
  app.get('/api-docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
