import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import assert from 'assert'
import jwt from 'jsonwebtoken'
import { io as clientIo } from 'socket.io-client'
import { Server } from 'socket.io'
import prisma from './prisma/client'

// 1. Setup in-memory mock database
const mockDb = {
  users: [] as any[],
  books: [] as any[],
  bookMembers: [] as any[],
  conversations: [] as any[],
  conversationMembers: [] as any[]
}

// Override Prisma methods to redirect calls to our mock DB
prisma.user.findUnique = (async (args: any) => {
  const { email, id } = args.where
  if (email) return mockDb.users.find(u => u.email === email) || null
  if (id) return mockDb.users.find(u => u.id === id) || null
  return null
}) as any

prisma.user.create = (async (args: any) => {
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 5),
    email: args.data.email,
    passwordHash: args.data.passwordHash,
    displayName: args.data.displayName || args.data.email.split('@')[0],
    themePreference: 'paper',
    hasSeenPreamble: false,
    hasSeenTour: false,
    defaultBookId: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    refreshTokenVersion: 0
  }
  mockDb.users.push(newUser)
  return newUser
}) as any

prisma.user.update = (async (args: any) => {
  const { id } = args.where
  const userIdx = mockDb.users.findIndex(u => u.id === id)
  if (userIdx === -1) throw new Error('User not found')
  const updated = { ...mockDb.users[userIdx], ...args.data }
  mockDb.users[userIdx] = updated
  return updated
}) as any

prisma.book.findUnique = (async (args: any) => {
  const { id } = args.where
  return mockDb.books.find(b => b.id === id) || null
}) as any

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    m => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId
  ) || null
}) as any

// Stub prisma transaction
prisma.$transaction = (async (fn: any) => {
  return await fn(prisma)
}) as any

// 2. Initialize Express application
const app = express()
app.use(express.json())
app.use(cookieParser())

// Import routes
import authRouter from './routes/auth.routes'
import userRouter from './routes/user.routes'
import bookRouter from './routes/book.routes'

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/books', bookRouter)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
})

// Presence tracking maps: userId -> Set of connected socket IDs
const onlineScribes = new Map<string, Set<string>>()
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
const socketIpConnectionCounts = new Map<string, { count: number; resetTime: number }>()

const parseCookies = (cookieHeader?: string): { [key: string]: string } => {
  const list: { [key: string]: string } = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    list[parts.shift()?.trim() || ''] = decodeURI(parts.join('='))
  })
  return list
}

io.use((socket, next) => {
  try {
    const ip = socket.handshake.address || 'unknown-ip'
    const now = Date.now()
    const limitRecord = socketIpConnectionCounts.get(ip)
    
    if (!limitRecord) {
      socketIpConnectionCounts.set(ip, { count: 1, resetTime: now + 60 * 1000 })
    } else {
      if (now > limitRecord.resetTime) {
        limitRecord.count = 1
        limitRecord.resetTime = now + 60 * 1000
      } else {
        limitRecord.count += 1
        if (limitRecord.count > 100) {
          return next(new Error('Authentication error: Too many connection attempts.'))
        }
      }
    }

    const cookieHeader = socket.request.headers.cookie
    const cookies = parseCookies(cookieHeader)
    const token = cookies['accessToken']

    if (!token) {
      return next(new Error('Authentication error: Missing token'))
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string }
    prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, displayName: true }
    }).then((user) => {
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }
      ;(socket as any).userId = user.id
      ;(socket as any).displayName = user.displayName
      next()
    }).catch(() => {
      next(new Error('Authentication error: Lookup failure'))
    })
  } catch {
    next(new Error('Authentication error: Invalid or expired token'))
  }
})

const PORT = 5103

const makeRequest = (method: string, path: string, body?: any, cookie?: string): Promise<{ status: number; data: any; headers: any }> => {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : ''
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        ...(cookie ? { 'Cookie': cookie } : {})
      }
    }, (res) => {
      let responseBody = ''
      res.on('data', chunk => responseBody += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode || 0,
            data: JSON.parse(responseBody),
            headers: res.headers
          })
        } catch {
          resolve({
            status: res.statusCode || 0,
            data: responseBody,
            headers: res.headers
          })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(dataStr)
    req.end()
  })
}

server.listen(PORT, async () => {
  console.log(`Security Pen Server running on port ${PORT}`)

  try {
    // 1. Attempt Unauthorized Access
    console.log('Testing Unauthorized access to book detail endpoint...')
    const bookRes = await makeRequest('GET', '/api/books/book_123')
    assert(bookRes.status === 401, 'Unauthorized request should return HTTP 401')
    console.log('✅ Success: Unauthorized access rejected with HTTP 401')

    // 2. Simulate Token Replay Attack with out-of-sync version
    console.log('\nTesting Refresh Token Replay (RTR) version breach...')
    const badToken = jwt.sign({ userId: 'usr_abc123', version: -5 }, 'fallback_refresh_secret_12345')
    const refreshRes = await makeRequest('POST', '/api/auth/refresh', {}, `refreshToken=${badToken}`)
    assert(refreshRes.status === 401 || refreshRes.status === 403 || refreshRes.status === 404, 'Old token version replay should be blocked')
    console.log('✅ Success: Token replay breach rejected successfully')

    // 2b. Real Refresh Token Rotation (RTR) check
    console.log('Testing active Refresh Token Rotation family invalidation...')
    const rtrEmail = `rtr_${Date.now()}@ledger.com`
    const rtrSignup = await makeRequest('POST', '/api/auth/signup', { email: rtrEmail, password: 'password123' })
    assert(rtrSignup.status === 201, 'RTR user signup succeeds')
    
    const rtrSetCookies = rtrSignup.headers['set-cookie']
    let rtrCookie = ''
    if (rtrSetCookies && rtrSetCookies.length > 0) {
      rtrCookie = rtrSetCookies.map((c: string) => c.split(';')[0]).join('; ')
    }
    
    // First refresh: rotates version 0 -> version 1
    const firstRefresh = await makeRequest('POST', '/api/auth/refresh', {}, rtrCookie)
    assert(firstRefresh.status === 200, 'First refresh is accepted')
    
    // Second refresh using original cookie (replaying version 0 token)
    const replayRefresh = await makeRequest('POST', '/api/auth/refresh', {}, rtrCookie)
    assert(replayRefresh.status === 401 || replayRefresh.status === 403, 'Replayed refresh token gets rejected')
    console.log('✅ Success: Token replay attack blocked and session invalidated')

    // 3. Test Brute-Force Rate Limiting & Account Lockout
    console.log('\nTesting consecutive login failures account lockout sequence...')
    const email = `target_${Date.now()}@ledger.com`
    
    // Create Scribe
    const signupRes = await makeRequest('POST', '/api/auth/signup', { email, password: 'password123' })
    assert(signupRes.status === 201, 'Signup should succeed')

    console.log('Executing 5 failed login attempts to trigger lockout...')
    for (let i = 1; i <= 5; i++) {
      const loginFail = await makeRequest('POST', '/api/auth/login', { email, password: 'wrongpassword' })
      assert(loginFail.status === 400, `Failed login attempt ${i} of 5 should return 400`)
    }

    console.log('Testing 6th attempt to verify account lockout...')
    const lockoutRes = await makeRequest('POST', '/api/auth/login', { email, password: 'password123' })
    assert(lockoutRes.status === 403, 'Locked account should return HTTP 403 Forbidden')
    console.log('✅ Success: Scribe lockout confirmed after 5 consecutive failures')

    // 4. Test Invalid Socket Connection
    console.log('\nTesting Socket connection with missing authorization cookie...')
    const socket = clientIo(`http://localhost:${PORT}`, {
      transports: ['websocket'],
      autoConnect: false
    })

    socket.connect()
    
    await new Promise<void>((resolve) => {
      socket.on('connect_error', (err) => {
        assert(err.message.includes('Authentication error'), 'Socket handshake should fail on missing auth')
        resolve()
      })
      setTimeout(() => {
        if (socket.connected) {
          socket.disconnect()
          throw new Error('Socket successfully connected without authorization credentials')
        }
        resolve()
      }, 1000)
    })
    console.log('✅ Success: Unauthenticated socket connection successfully blocked')

    console.log('\n🎉 ALL PENETRATION SECURITY TESTS PASSED CLEANLY! 🎉')
    server.close()
    process.exit(0)
  } catch (err: any) {
    console.error('\n❌ PENETRATION TEST FAILURE:', err.message)
    server.close()
    process.exit(1)
  }
})
