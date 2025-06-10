import { Request, Response, NextFunction } from 'express';
import { UserRoleType } from '@prisma/client';
import { logger } from '../utils/logger';

export const requireRole = (allowedRoles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userRoles = req.user.roles;
      const hasRequiredRole = allowedRoles.some(role => 
        userRoles.includes(role as string)
      );

      if (!hasRequiredRole) {
        logger.warn(`Access denied for user ${req.user.id}`, {
          userId: req.user.id,
          userRoles,
          requiredRoles: allowedRoles,
          endpoint: req.path
        });
        
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRoles
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
}; 