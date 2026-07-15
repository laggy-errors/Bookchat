import express from 'express'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import authRouter from './routes/auth.routes'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 1. Stub the Prisma database singleton client with an in-memory state
const mockDb = {
  users: [] as any[],
}

prisma.user.findUnique = (async (args: any) => {
  const { email, id } = args.where
  if (email) return mockDb.users.find((u) => u.email === email) || null
  if (id) return mockDb.users.find((u) => u.id === id) || null
  return null
}) as any

prisma.user.create = (async (args: any) => {
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    email: args.data.email,
    passwordHash: args.data.passwordHash,
    displayName: args.data.displayName || 'Reader',
    themePreference: 'paper',
    hasSeenPreamble: false,
    hasSeenTour: false,
    defaultBookId: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    refreshTokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  mockDb.users.push(newUser)
  return newUser
}) as any

prisma.user.update = (async (args: any) => {
  const { id } = args.where
  const user = mockDb.users.find((u) => u.id === id)
  if (user) {
    Object.assign(user, args.data)
    return user
  }
  return null
}) as any

// 2. Initialize and boot a mock Express server on a test port
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth', authRouter)

const PORT = 5099
const server = app.listen(PORT, () => {
  console.log(`Mock auth server active on port ${PORT}`)
  runTests()
})

// Assert helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Failure: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ Success: ${message}`)
  }
}

// 3. Define and run test suite cases
async function runTests() {
  const TEST_EMAIL = 'scribe@ledger.com'
  const TEST_PASSWORD = 'passcode123'
  let savedRefreshToken = ''
  let savedAccessToken = ''

  console.log('\n--- Beginning Auth Flow Tests ---\n')

  try {
    // Test Case 1: Sign Up
    console.log('Testing Sign Up...')
    const signupRes = await fetch(`http://localhost:${PORT}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    const signupData = await signupRes.json()
    assert(signupRes.status === 201, 'Signup endpoint returned 201 status')
    assert(signupData.email === TEST_EMAIL, 'Signup payload matches email')
    assert(signupData.hasSeenPreamble === false, 'New user marked hasSeenPreamble=false')

    // Capture cookies
    const cookieHeaders = signupRes.headers.get('set-cookie') || ''
    assert(cookieHeaders.includes('accessToken'), 'Response sets access token cookie')
    assert(cookieHeaders.includes('refreshToken'), 'Response sets refresh token cookie')

    // Parse cookies for subsequent tests
    const parsedCookies = parseCookies(cookieHeaders)
    savedRefreshToken = parsedCookies.refreshToken || ''
    savedAccessToken = parsedCookies.accessToken || ''

    // Test Case 2: Duplicate Email Signup
    console.log('\nTesting Duplicate Email Signup...')
    const dupRes = await fetch(`http://localhost:${PORT}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    const dupData = await dupRes.json()
    assert(dupRes.status === 400, 'Duplicate signup returned 400 status')
    assert(dupData.error.includes('ledger'), 'Duplicate signup returned correct ledger error message')

    // Test Case 3: Invalid Credentials Login
    console.log('\nTesting Login with Incorrect Password...')
    const badLoginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'wrong_password' }),
    })
    assert(badLoginRes.status === 400, 'Bad login credentials returned 400 status')

    // Test Case 4: Successful Login
    console.log('\nTesting Valid Login...')
    const loginRes = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    const loginData = await loginRes.json()
    assert(loginRes.status === 200, 'Login endpoint returned 200 status')
    assert(loginData.email === TEST_EMAIL, 'Login payload matches email')

    // Test Case 5: Refresh Token Rotation
    console.log('\nTesting Token Refresh...')
    const refreshRes = await fetch(`http://localhost:${PORT}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${savedRefreshToken}`,
      },
    })
    const refreshData = await refreshRes.json()
    assert(refreshRes.status === 200, 'Refresh endpoint returned 200 status')
    assert(refreshData.email === TEST_EMAIL, 'Refresh payload matches user')

    const refreshCookieHeaders = refreshRes.headers.get('set-cookie') || ''
    const refreshedCookies = parseCookies(refreshCookieHeaders)
    assert(!!refreshedCookies.accessToken, 'Refresh sets new access token')

    // Test Case 6: Session Expiration/Invalid Refresh Token
    console.log('\nTesting Session Expiration / Bad Refresh Token...')
    const badRefreshRes = await fetch(`http://localhost:${PORT}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'refreshToken=expired_or_forged_cookie_123',
      },
    })
    assert(badRefreshRes.status === 403, 'Bad refresh token rejected with 403 status')

    // Test Case 7: Logout Cookie Clears
    console.log('\nTesting Logout...')
    const logoutRes = await fetch(`http://localhost:${PORT}/api/auth/logout`, {
      method: 'POST',
    })
    const logoutCookieHeaders = logoutRes.headers.get('set-cookie') || ''
    assert(logoutCookieHeaders.includes('Max-Age=0') || logoutCookieHeaders.includes('expires'), 'Logout expires cookies immediately')

    console.log('\n🎉 ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (error) {
    console.error('Test execution failed with error:', error)
    process.exit(1)
  } finally {
    server.close()
  }
}

// Utility parser for Cookie header strings
function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  const parts = header.split(',')
  parts.forEach((part) => {
    const pair = part.trim().split(';')[0]
    const index = pair.indexOf('=')
    if (index > 0) {
      const key = pair.substring(0, index).trim()
      const val = pair.substring(index + 1).trim()
      cookies[key] = val
    }
  })
  return cookies
}
