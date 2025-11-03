"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
exports.registerRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: FIFTEEN_MINUTES_MS,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts. Please try again later.' },
    keyGenerator: (req) => {
        const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown';
        return `${req.ip ?? 'unknown'}:${userAgent}`;
    }
});
