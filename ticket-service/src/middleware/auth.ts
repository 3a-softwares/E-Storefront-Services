import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || '3a-softwares-jwt-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    Logger.error('Authentication failed', error, 'AuthMiddleware');
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!['admin', 'support'].includes(req.user?.role || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

export const authorizeSupport = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!['admin', 'support', 'agent'].includes(req.user?.role || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Support privileges required.',
    });
  }
  next();
};
