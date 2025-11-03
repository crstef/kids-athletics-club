import rateLimit from 'express-rate-limit'
import type { Request } from 'express'

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

export const registerRateLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
  keyGenerator: (req: Request) => {
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : 'unknown'
    return `${req.ip ?? 'unknown'}:${userAgent}`
  }
})
