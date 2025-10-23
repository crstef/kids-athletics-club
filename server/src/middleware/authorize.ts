import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

// Simple permission-based authorization
// Allows if:
// - user is superadmin
// - permissions include '*'
// - permissions include any of the provided permission names
export const authorize = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    if (user.role === 'superadmin') return next();

    const perms = user.permissions || [];
    if (perms.includes('*')) return next();

    const allowed = permissions.some((p) => perms.includes(p));
    if (!allowed) return res.status(403).json({ error: 'Insufficient permissions' });

    next();
  };
};
