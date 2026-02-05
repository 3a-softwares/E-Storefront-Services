/**
 * Health Check Endpoints
 * Provides health status of all microservices
 */

import { Router } from 'express';
import { gatewayHealthHandler, servicesHealthHandler, serviceHealthHandler } from '../controllers/health.controller';

const router = Router();

router.get('/health', gatewayHealthHandler);
router.get('/health/services', servicesHealthHandler);
router.get('/health/services/:service', serviceHealthHandler);

export default router;
