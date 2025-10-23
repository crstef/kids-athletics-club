"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
// GET /api/public/coaches
router.get('/coaches', async (req, res) => {
    const client = await database_1.default.connect();
    try {
        const result = await client.query(`SELECT id, first_name, last_name 
       FROM users 
       WHERE role = 'coach' AND is_active = true 
       ORDER BY last_name, first_name`);
        res.json(result.rows.map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`
        })));
    }
    catch (error) {
        console.error('Get public coaches error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
    finally {
        client.release();
    }
});
exports.default = router;
