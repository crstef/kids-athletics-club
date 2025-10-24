"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeDb = void 0;
const database_1 = __importDefault(require("../config/database"));
// Database-backed authorization middleware
// Allows if:
// - user is superadmin
// - user has direct user_permissions for any provided permission
// - user's role has role_permissions for any provided permission
const authorizeDb = (...permissions) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ error: 'Authentication required' });
            if (user.role === 'superadmin')
                return next();
            const client = await database_1.default.connect();
            try {
                const result = await client.query(`SELECT 1
           FROM permissions p
           WHERE p.name = ANY($1::text[])
             AND (
               EXISTS (
                 SELECT 1 FROM user_permissions up
                 WHERE up.user_id = $2 AND up.permission_id = p.id
               )
               OR EXISTS (
                 SELECT 1 FROM roles r
                 JOIN role_permissions rp ON rp.role_id = r.id
                 WHERE r.name = $3 AND rp.permission_id = p.id
               )
             )
           LIMIT 1`, [permissions, user.userId, user.role]);
                if (result.rowCount && result.rowCount > 0) {
                    return next();
                }
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            finally {
                // ensure release even on error
                ;
                client?.release?.();
            }
        }
        catch (err) {
            console.error('authorizeDb error:', err);
            return res.status(500).json({ error: 'Authorization error' });
        }
    };
};
exports.authorizeDb = authorizeDb;
exports.default = exports.authorizeDb;
