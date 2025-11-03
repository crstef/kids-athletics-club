import type { Request, Response, NextFunction } from 'express'

/**
 * Placeholder middleware so development rate limiting can be reintroduced without touching consumers.
 * Currently it just passes through.
 */
export const registerRateLimiter = (_req: Request, _res: Response, next: NextFunction) => {
  next()
}
