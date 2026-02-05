import { Request, Response } from 'express';
import axios from 'axios';
import { Logger, SERVICE_URLS } from '@3asoftwares/utils';

const SERVICES: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || SERVICE_URLS.AUTH_SERVICE,
  category: process.env.CATEGORY_SERVICE_URL || SERVICE_URLS.CATEGORY_SERVICE,
  coupon: process.env.COUPON_SERVICE_URL || SERVICE_URLS.COUPON_SERVICE,
  order: process.env.ORDER_SERVICE_URL || SERVICE_URLS.ORDER_SERVICE,
  product: process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT_SERVICE,
  ticket: process.env.TICKET_SERVICE_URL || SERVICE_URLS.TICKET_SERVICE,
};

export function gatewayHealthHandler(_req: Request, res: Response) {
  return res.status(200).json({
    service: 'graphql-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export async function servicesHealthHandler(_req: Request, res: Response) {
  const servicesArray: any[] = [];
  try {
    for (const [name, url] of Object.entries(SERVICES)) {
      try {
        const response = await axios.get(`${url}/health`, {
          timeout: 5000,
          headers: {
            'x-apollo-operation-name': 'health-check',
            'apollo-require-preflight': 'true',
            'content-type': 'application/json',
          },
        });
        servicesArray.push({
          name,
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          url,
          timestamp: new Date().toISOString(),
          responseTime: response.headers['x-response-time'] || 'N/A',
          uptime: response.data?.uptime,
        });
      } catch (err: any) {
        servicesArray.push({
          name,
          status: 'unhealthy',
          url,
          error: err?.response?.data || err?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    }

    servicesArray.push({
      name: 'gateway',
      status: 'healthy',
      url: process.env.GRAPHQL_GATEWAY_URL || SERVICE_URLS.GRAPHQL_GATEWAY,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });

    const allHealthy = servicesArray.every((check: any) => check.status === 'healthy');

    return res.status(200).json({
      success: true,
      overallStatus: allHealthy ? 'healthy' : 'degraded',
      services: servicesArray,
      totalServices: servicesArray.length,
      healthyCount: servicesArray.filter((s: any) => s.status === 'healthy').length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    Logger.error('Error checking services health', err, 'HealthController');
    return res.status(503).json({
      success: false,
      overallStatus: 'error',
      message: 'Unexpected error in health check',
      error: err?.message || err,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function serviceHealthHandler(req: Request, res: Response) {
  const { service } = req.params as { service: string };
  const url = SERVICES[service];
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
      headers: {
        'x-apollo-operation-name': 'health-check',
        'apollo-require-preflight': 'true',
        'content-type': 'application/json',
      },
    });
    return res.status(200).json({
      service,
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      url,
      details: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      service,
      status: 'unhealthy',
      url,
      error: err?.response?.data || err?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
