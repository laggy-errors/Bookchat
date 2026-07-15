import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const stores: { [key: string]: RateLimitStore } = {}

export const createLimiter = (options: {
  windowMs: number
  max: number
  message: string
}) => {
  const storeId = Math.random().toString(36).substring(2, 9)
  stores[storeId] = {}

  return (req: Request, res: Response, next: NextFunction): any => {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown-ip'
    const key = ip
    const store = stores[storeId]
    const now = Date.now()

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      }
      return next()
    }

    const record = store[key]
    if (now > record.resetTime) {
      record.count = 1
      record.resetTime = now + options.windowMs
      return next()
    }

    record.count += 1
    if (record.count > options.max) {
      return res.status(429).json({ error: options.message })
    }

    next()
  }
}
