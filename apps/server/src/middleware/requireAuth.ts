import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET must be set in production!')
}

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
  const token = req.cookies.accessToken

  if (!token) {
    return res.status(401).json({ error: 'Access token missing. Please sign in.' })
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as { userId: string }
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Access token invalid or expired.' })
  }
}

export default requireAuth
