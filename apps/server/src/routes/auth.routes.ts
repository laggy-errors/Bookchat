import { Router, Request, Response, CookieOptions } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'
import requireAuth, { AuthenticatedRequest } from '../middleware/requireAuth'
import { createLimiter } from '../middleware/rateLimiter'
import { logger } from '../utils/logger'

const signupLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many registry accounts created from this IP. Try again later.'
})

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts. Try again later.'
})

const router = Router()

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_12345'
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production!')
}

// Cookie helpers
const getCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: maxAgeMs,
})

const generateTokens = (userId: string, version = 0) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId, version }, REFRESH_SECRET, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', signupLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }

    // Secure Passcode Policy: minimum 8 characters, alphanumeric mix (must contain letters and numbers)
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (password.length < 8 || !hasLetter || !hasNumber) {
      return res.status(400).json({ error: 'Passcode must be at least 8 characters long and contain both letters and numbers.' })
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'That name is already written in our ledger.' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Default display name is email handle
    const defaultDisplayName = email.split('@')[0] || 'Reader'

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: defaultDisplayName,
      },
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.refreshTokenVersion)

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000)) // 15 mins
    res.cookie('refreshToken', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)) // 30 days

    return res.status(201).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      themePreference: user.themePreference,
      hasSeenPreamble: user.hasSeenPreamble,
      hasSeenTour: user.hasSeenTour,
      defaultBookId: user.defaultBookId,
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Server error during registry entry.' })
  }
})

// @route   POST /api/auth/login
// @desc    Authenticate user & get tokens
router.post('/login', loginLimiter, async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' })
    }

    // Lookup user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logger.authFailed(email, 'User not found in user table records')
      return res.status(400).json({ error: 'Invalid credentials.' })
    }

    // Enforce Account Lockout Check
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000))
      logger.authFailed(email, `Blocked login attempt: Account locked out for ${remainingMinutes} minute(s)`)
      return res.status(403).json({ error: `Account locked due to consecutive failures. Try again in ${remainingMinutes} minute(s).` })
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1
      let updateData: any = { failedLoginAttempts: attempts }
      
      if (attempts >= 5) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes lockout
        updateData.failedLoginAttempts = 0 // reset counter
        logger.authFailed(email, 'Incorrect credentials limit reached: Initiated account lockout for 15 minutes')
      } else {
        logger.authFailed(email, `Incorrect password (attempt ${attempts} of 5)`)
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })

      return res.status(400).json({ error: 'Invalid credentials.' })
    }

    // Login successful: Reset login failures and lockout windows
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    })

    logger.authSuccess(updatedUser.id, updatedUser.email)

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(updatedUser.id, updatedUser.refreshTokenVersion)

    // Set httpOnly cookies
    res.cookie('accessToken', accessToken, getCookieOptions(15 * 60 * 1000)) // 15 mins
    res.cookie('refreshToken', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)) // 30 days

    return res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      themePreference: updatedUser.themePreference,
      hasSeenPreamble: updatedUser.hasSeenPreamble,
      hasSeenTour: updatedUser.hasSeenTour,
      defaultBookId: updatedUser.defaultBookId,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Server error during ledger lookup.' })
  }
})

// @route   POST /api/auth/refresh
// @desc    Get new access token from refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<any> => {
  try {
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' })
    }

    // Verify token
    let payload: any
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET)
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired refresh token.' })
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists in our logs.' })
    }

    // Refresh Token Rotation (RTR) verification check
    if (payload.version !== user.refreshTokenVersion) {
      // Breach detected: refresh token re-used or compromised. Invalidate all user sessions.
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenVersion: { increment: 1 } }
      })
      res.clearCookie('accessToken', getCookieOptions(0))
      res.clearCookie('refreshToken', getCookieOptions(0))
      return res.status(401).json({ error: 'Session compromised. Re-authentication required.' })
    }

    // Success: rotate the token version for the next family update
    const nextVersion = user.refreshTokenVersion + 1
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenVersion: nextVersion }
    })

    // Generate new tokens with the rotated version index
    const tokens = generateTokens(user.id, nextVersion)

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, getCookieOptions(15 * 60 * 1000)) // 15 mins
    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)) // 30 days

    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      themePreference: user.themePreference,
      hasSeenPreamble: user.hasSeenPreamble,
      hasSeenTour: user.hasSeenTour,
      defaultBookId: user.defaultBookId,
    })
  } catch (error: any) {
    console.error('Refresh token error:', error)
    return res.status(500).json({ error: 'Server error renewing access credentials.' })
  }
})

// @route   POST /api/auth/change-password
// @desc    Change user password with identity re-authentication
router.post('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please enter all fields.' })
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    if (newPassword.length < 8 || !hasLetter || !hasNumber) {
      return res.status(400).json({ error: 'New passcode must be at least 8 characters long and contain both letters and numbers.' })
    }

    // Lookup user
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists in our logs.' })
    }

    // Verify current password (re-authentication check)
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      return res.status(400).json({ error: 'Current passcode is incorrect. Identity verification failed.' })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // Commit change
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    })

    return res.json({ message: 'Passcode changed successfully.' })
  } catch (error) {
    console.error('Change password error:', error)
    return res.status(500).json({ error: 'Server error updating password logs.' })
  }
})

// @route   POST /api/auth/logout
// @desc    Clear cookies & terminate session
router.post('/logout', (req: Request, res: Response): any => {
  res.clearCookie('accessToken', getCookieOptions(0))
  res.clearCookie('refreshToken', getCookieOptions(0))
  return res.json({ message: 'Session closed. Book closed.' })
})

export default router
