"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
// Debug endpoint to test basic database functionality
router.get('/debug/test-user', async (req, res) => {
    const client = await database_1.default.connect();
    try {
        console.log('Debug endpoint hit - testing user query');
        // Test basic user query
        const result = await client.query(`SELECT id, email, first_name, last_name, role, role_id, is_active, needs_approval, athlete_id
       FROM users WHERE email = $1`, ['admin@clubatletism.ro']);
        if (result.rows.length === 0) {
            return res.json({ status: 'no_user_found', email: 'admin@clubatletism.ro' });
        }
        const user = result.rows[0];
        res.json({
            status: 'success',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                role_id: user.role_id,
                role_id_type: typeof user.role_id
            }
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
    finally {
        client.release();
    }
});
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/me', auth_1.authenticate, authController_1.getCurrentUser);
exports.default = router;
