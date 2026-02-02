

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { Logger } from '@3asoftwares/utils/server';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      Logger.warn(
        `Authentication failed - no token: ${req.method} ${req.path}`,
        undefined,
        'Middleware'
      );
      res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.',
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = verifyAccessToken(token);

    req.user = decoded;
    Logger.debug(`User authenticated: ${decoded.userId}`, { path: req.path }, 'Middleware');

    next();
  } catch (error: any) {
    Logger.warn(
      `Authentication failed - invalid token: ${req.method} ${req.path}`,
      { error: error.message },
      'Middleware'
    );
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

export const optionalAuth = async (
  req: Request,
  _: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      Logger.debug(
        `Optional auth - user authenticated: ${decoded.userId}`,
        undefined,
        'Middleware'
      );
    }

    next();
  } catch (error) {
    Logger.debug('Optional auth - token invalid, continuing without auth', undefined, 'Middleware');
    next();
  }
};
