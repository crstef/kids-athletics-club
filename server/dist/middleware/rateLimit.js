"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRateLimiter = void 0;
/**
 * Placeholder middleware so development rate limiting can be reintroduced without touching consumers.
 * Currently it just passes through.
 */
const registerRateLimiter = (_req, _res, next) => {
    next();
};
exports.registerRateLimiter = registerRateLimiter;
