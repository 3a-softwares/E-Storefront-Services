/**
 * Health Check Endpoints
 * Provides health status of all microservices
 */

import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Service endpoints
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  category: process.env.CATEGORY_SERVICE_URL || 'http://localhost:3002',
  coupon: process.env.COUPON_SERVICE_URL || 'http://localhost:3003',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3005',
  ticket: process.env.TICKET_SERVICE_URL || 'http://localhost:3006',
};

/**
 * GET /api/health
 * Gateway service health
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    service: 'graphql-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/services
 * Health status of all microservices
 */
router.get('/health/services', async (req, res) => {
    const healthChecks: Record<string, any> = {};

    // Check each service
    for (const [name, url] of Object.entries(SERVICES)) {
        try {
            const response = await axios.get(`${url}/health`, {
                timeout: 5000,
            });

            healthChecks[name] = {
                status: response.status === 200 ? 'healthy' : 'unhealthy',
                url,
                timestamp: new Date().toISOString(),
                responseTime: response.headers['x-response-time'] || 'N/A',
            };
        } catch (err) {
            healthChecks[name] = {
                status: 'unhealthy',
                url,
                error: (err as any).message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Add gateway status
    (healthChecks as Record<string, any>)['gateway'] = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
    };

    const allHealthy = Object.values(healthChecks).every((check: any) => check.status === 'healthy');

    return res.status(allHealthy ? 200 : 503).json({
        overallStatus: allHealthy ? 'healthy' : 'degraded',
        services: healthChecks,
        timestamp: new Date().toISOString(),
    });
});

/**
 * GET /api/health/services/:service
 * Health status of a specific service
 */
router.get('/health/services/:service', async (req, res) => {
    const { service } = req.params;
    const url = (SERVICES as Record<string, string>)[service];

    if (!url) {
        return res.status(404).json({
            success: false,
            message: `Service "${service}" not found`,
            availableServices: Object.keys(SERVICES),
        });
    }

    try {
        const response = await axios.get(`${url}/health`, {
            timeout: 5000,
        });

        return res.status(200).json({
            service,
            status: response.status === 200 ? 'healthy' : 'unhealthy',
            url,
            details: response.data,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        return res.status(503).json({
            service,
            status: 'unhealthy',
            url,
            error: (err as any).message,
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;
