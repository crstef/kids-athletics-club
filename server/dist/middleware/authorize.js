"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
// Simple permission-based authorization
// Allows if:
// - user is superadmin
// - permissions include '*'
// - permissions include any of the provided permission names
const authorize = (...permissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Authentication required' });
        if (user.role === 'superadmin')
            return next();
        const perms = user.permissions || [];
        if (perms.includes('*'))
            return next();
        const allowed = permissions.some((p) => perms.includes(p));
        if (!allowed)
            return res.status(403).json({ error: 'Insufficient permissions' });
        next();
    };
};
exports.authorize = authorize;
