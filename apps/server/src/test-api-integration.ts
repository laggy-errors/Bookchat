import express from 'express'
import http from 'http'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
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
  const { id, joinCode } = args.where
  if (id) return mockDb.books.find(b => b.id === id) || null
  if (joinCode) {
    const book = mockDb.books.find(b => b.joinCode === joinCode)
    if (book) {
      // populate members for join checks
      const members = mockDb.bookMembers.filter(m => m.bookId === book.id)
      return { ...book, members }
    }
    return null
  }
  return null
}) as any

prisma.book.create = (async (args: any) => {
  const newBook = {
    id: 'book_' + Math.random().toString(36).substr(2, 5),
    name: args.data.name,
    joinCode: args.data.joinCode,
    passwordHash: args.data.passwordHash,
    creatorId: args.data.creatorId
  }
  mockDb.books.push(newBook)
  return newBook
}) as any

prisma.book.update = (async (args: any) => {
  const { id } = args.where
  const bookIdx = mockDb.books.findIndex(b => b.id === id)
  if (bookIdx === -1) throw new Error('Book not found')
  const updated = { ...mockDb.books[bookIdx], ...args.data }
  mockDb.books[bookIdx] = updated
  return updated
}) as any

prisma.bookMember.create = (async (args: any) => {
  const newMember = {
    bookId: args.data.bookId,
    userId: args.data.userId,
    role: args.data.role,
    joinedAt: new Date().toISOString()
  }
  mockDb.bookMembers.push(newMember)
  return newMember
}) as any

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    m => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId
  ) || null
}) as any

prisma.conversation.create = (async (args: any) => {
  const newConv = {
    id: 'conv_' + Math.random().toString(36).substr(2, 5),
    bookId: args.data.bookId,
    isGroup: args.data.isGroup
  }
  mockDb.conversations.push(newConv)
  return newConv
}) as any

prisma.conversationMember.create = (async (args: any) => {
  const newConvMember = {
    conversationId: args.data.conversationId,
    userId: args.data.userId
  }
  mockDb.conversationMembers.push(newConvMember)
  return newConvMember
}) as any

prisma.conversation.findFirst = (async (args: any) => {
  const { bookId, isGroup } = args.where
  return mockDb.conversations.find(c => c.bookId === bookId && c.isGroup === isGroup) || null
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
const PORT = 5099

// Local state for tracking cookies between requests
let authCookie = ''

const makeRequest = async (
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: any,
  cookies?: string
): Promise<{ status: number; data: any; headers: any }> => {
  return new Promise((resolve, reject) => {
    const options: any = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    if (cookies) {
      options.headers['Cookie'] = cookies
    }

    const req = http.request(options, (res) => {
      let dataStr = ''
      res.on('data', (chunk) => {
        dataStr += chunk
      })
      res.on('end', () => {
        try {
          const parsed = dataStr ? JSON.parse(dataStr) : {}
          resolve({
            status: res.statusCode || 500,
            data: parsed,
            headers: res.headers
          })
        } catch (err) {
          resolve({
            status: res.statusCode || 500,
            data: { error: 'Failed to parse JSON response', raw: dataStr },
            headers: res.headers
          })
        }
      })
    })

    req.on('error', (err) => reject(err))
    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

// Assert helper
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ Failure: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ Success: ${message}`)
  }
}

server.listen(PORT, async () => {
  console.log(`Test API integration server active on port ${PORT}`)
  console.log('\n--- Beginning REST API Integration Tests ---\n')

  try {
    // -------------------------------------------------------------
    // AUTHENTICATION ROUTE TESTS
    // -------------------------------------------------------------
    console.log('Testing User Signup with invalid email...')
    const signupFail = await makeRequest('POST', '/api/auth/signup', { email: 'bademail', password: 'password123' })
    assert(signupFail.status === 400, 'Signup failed on invalid email format')

    console.log('\nTesting User Signup success...')
    const signupSuccess = await makeRequest('POST', '/api/auth/signup', { email: 'archivist@ledger.com', password: 'password123' })
    assert(signupSuccess.status === 201, 'Signup returned HTTP 201 Created')
    assert(signupSuccess.data.email === 'archivist@ledger.com', 'Signup returned correct user details')
    
    // Extract token cookies
    const setCookieHeaders = signupSuccess.headers['set-cookie']
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      authCookie = setCookieHeaders.map((c: string) => c.split(';')[0]).join('; ')
    }

    console.log('\nTesting User Login invalid password...')
    const loginFail = await makeRequest('POST', '/api/auth/login', { email: 'archivist@ledger.com', password: 'wrongpassword' })
    assert(loginFail.status === 400, 'Login failed on incorrect password credentials')

    console.log('\nTesting User Login success...')
    const loginSuccess = await makeRequest('POST', '/api/auth/login', { email: 'archivist@ledger.com', password: 'password123' })
    assert(loginSuccess.status === 200, 'Login returned HTTP 200 OK')

    // -------------------------------------------------------------
    // PROFILE MANAGEMENT TESTS
    // -------------------------------------------------------------
    console.log('\nTesting Update profile display name (unauthorized)...')
    const updateProfileUnauth = await makeRequest('PATCH', '/api/users/me', { displayName: 'Head Scribe' })
    assert(updateProfileUnauth.status === 401, 'Profile update refused without auth cookies')

    console.log('\nTesting Update profile display name (success)...')
    const updateProfileSuccess = await makeRequest('PATCH', '/api/users/me', { displayName: 'Head Scribe' }, authCookie)
    assert(updateProfileSuccess.status === 200, 'Profile update returns HTTP 200 OK')
    assert(updateProfileSuccess.data.displayName === 'Head Scribe', 'Display name updated in memory database')

    // -------------------------------------------------------------
    // RE-AUTHENTICATION & SECURITY TESTS
    // -------------------------------------------------------------
    console.log('\nTesting Change passcode with wrong current passcode...')
    const changePassFail = await makeRequest('POST', '/api/auth/change-password', { currentPassword: 'wrongpassword', newPassword: 'newpassword123' }, authCookie)
    assert(changePassFail.status === 400, 'Password change rejected: current password verification failed')

    console.log('\nTesting Change passcode (success)...')
    const changePassSuccess = await makeRequest('POST', '/api/auth/change-password', { currentPassword: 'password123', newPassword: 'newpassword123' }, authCookie)
    assert(changePassSuccess.status === 200, 'Password changed successfully')

    // -------------------------------------------------------------
    // BOOK & JOURNAL TESTS
    // -------------------------------------------------------------
    console.log('\nTesting Create Book...')
    const createBookSuccess = await makeRequest('POST', '/api/books', { name: 'Chronicles of 1894', password: 'bookpasscode' }, authCookie)
    assert(createBookSuccess.status === 201, 'Book creation returned HTTP 201 Created')
    const createdBook = createBookSuccess.data
    assert(createdBook.name === 'Chronicles of 1894', 'Book name matches request parameters')

    console.log('\nTesting Join Book with code (success)...')
    // Scribe B registers
    const scribeBRes = await makeRequest('POST', '/api/auth/signup', { email: 'scribeB@ledger.com', password: 'password123' })
    let scribeBCookie = ''
    const scribeBSetCookie = scribeBRes.headers['set-cookie']
    if (scribeBSetCookie && scribeBSetCookie.length > 0) {
      scribeBCookie = scribeBSetCookie.map((c: string) => c.split(';')[0]).join('; ')
    }

    const joinBookSuccess = await makeRequest('POST', '/api/books/join', { joinCode: createdBook.joinCode, password: 'bookpasscode' }, scribeBCookie)
    assert(joinBookSuccess.status === 200, 'Scribe B joined book successfully using invitation code')

    console.log('\nTesting Rename Book (unauthorized)...')
    // Scribe B attempts to rename Scribe A's book
    const renameBookUnauth = await makeRequest('PATCH', `/api/books/${createdBook.id}`, { name: 'Torn Ledger' }, scribeBCookie)
    assert(renameBookUnauth.status === 403, 'Renaming blocked: non-creator scribes are forbidden from updating book settings')

    console.log('\nTesting Rename Book (success)...')
    // Scribe A renames their own book
    const renameBookSuccess = await makeRequest('PATCH', `/api/books/${createdBook.id}`, { name: 'Renamed Chronicles' }, authCookie)
    assert(renameBookSuccess.status === 200, 'Book settings updated by creator successfully')
    assert(renameBookSuccess.data.name === 'Renamed Chronicles', 'Book name updated in database ledger')

    console.log('\n🎉 ALL REST API INTEGRATION TESTS PASSED CLEANLY! 🎉\n')
    cleanup()
  } catch (err: any) {
    console.error('\n❌ REST API TEST FAIL:', err)
    cleanup()
    process.exit(1)
  }
})

const cleanup = () => {
  server.close()
}
