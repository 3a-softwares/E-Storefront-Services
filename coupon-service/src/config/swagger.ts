import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import path from 'path';
import { PORT_CONFIG } from '@3asoftwares/utils';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coupon Service API',
      version: '1.0.0',
      description: 'API documentation for the E-Commerce Coupon Service',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || PORT_CONFIG.COUPON}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Coupon: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Coupon ID',
            },
            code: {
              type: 'string',
              description: 'Unique coupon code',
            },
            description: {
              type: 'string',
              description: 'Coupon description',
            },
            discountType: {
              type: 'string',
              enum: ['percentage', 'fixed'],
              description: 'Type of discount',
            },
            discount: {
              type: 'number',
              description: 'Discount value',
            },
            minPurchase: {
              type: 'number',
              description: 'Minimum purchase amount required',
            },
            maxDiscount: {
              type: 'number',
              description: 'Maximum discount amount (for percentage type)',
            },
            validFrom: {
              type: 'string',
              format: 'date-time',
              description: 'Start date of coupon validity',
            },
            validTo: {
              type: 'string',
              format: 'date-time',
              description: 'End date of coupon validity',
            },
            usageLimit: {
              type: 'integer',
              description: 'Maximum number of times the coupon can be used',
            },
            usageCount: {
              type: 'integer',
              description: 'Number of times the coupon has been used',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the coupon is active',
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
        CreateCoupon: {
          type: 'object',
          required: ['code', 'description', 'discountType', 'discount', 'validFrom', 'validTo'],
          properties: {
            code: {
              type: 'string',
              description: 'Unique coupon code (will be uppercased)',
            },
            description: {
              type: 'string',
              description: 'Coupon description',
            },
            discountType: {
              type: 'string',
              enum: ['percentage', 'fixed'],
              description: 'Type of discount',
            },
            discount: {
              type: 'number',
              minimum: 0,
              description: 'Discount value',
            },
            minPurchase: {
              type: 'number',
              minimum: 0,
              description: 'Minimum purchase amount required',
            },
            maxDiscount: {
              type: 'number',
              minimum: 0,
              description: 'Maximum discount amount',
            },
            validFrom: {
              type: 'string',
              format: 'date-time',
              description: 'Start date of coupon validity',
            },
            validTo: {
              type: 'string',
              format: 'date-time',
              description: 'End date of coupon validity',
            },
            usageLimit: {
              type: 'integer',
              minimum: 0,
              description: 'Maximum usage count',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the coupon is active',
            },
          },
        },
        ValidateCoupon: {
          type: 'object',
          required: ['code', 'orderTotal'],
          properties: {
            code: {
              type: 'string',
              description: 'Coupon code to validate',
            },
            orderTotal: {
              type: 'number',
              description: 'Order total to check against minimum purchase',
            },
          },
        },
        ApplyCoupon: {
          type: 'object',
          required: ['code', 'orderTotal'],
          properties: {
            code: {
              type: 'string',
              description: 'Coupon code to apply',
            },
            orderTotal: {
              type: 'number',
              description: 'Order total to calculate discount',
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
