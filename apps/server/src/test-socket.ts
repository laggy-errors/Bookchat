import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import jwt from 'jsonwebtoken'

// 1. Stub database for Socket membership verification checks
const mockDb = {
  users: [
    { id: 'usr_scribe', email: 'scribe@ledger.com', displayName: 'Scribe Reader' }
  ],
  bookMembers: [
    { bookId: 'book_valid', userId: 'usr_scribe', role: 'member' }
  ]
}

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    (m) => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId
  ) || null
}) as any

// 2. Initialize and Boot Server with Socket.IO
const app = express()
app.use(express.json())
app.use(cookieParser())

const server = http.createServer(app)
const io = new Server(server)

// Custom cookie parsing utility
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    list[parts.shift()?.trim() || ''] = decodeURI(parts.join('='))
  })
  return list
}

const JWT_ACCESS_SECRET = 'socket_test_secret_key_123'

// Secure socket auth middleware
io.use((socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie
    const cookies = parseCookies(cookieHeader)
    const token = cookies['accessToken']

    if (!token) {
      return next(new Error('Authentication error: Missing token'))
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string }
    ;(socket as any).userId = decoded.userId
    next()
  } catch (err) {
    next(new Error('Authentication error: Invalid or expired token'))
  }
})

// Connection lifecycles
io.on('connection', (socket) => {
  const userId = (socket as any).userId

  socket.on('join_book', async (data: { bookId: string }, callback?: (response: any) => void) => {
    try {
      const { bookId } = data
      const member = await prisma.bookMember.findUnique({
        where: { bookId_userId: { bookId, userId } }
      })

      if (!member) {
        socket.emit('error', { message: 'Access denied.' })
        return callback?.({ status: 'error', message: 'Access denied' })
      }

      socket.join(bookId)
      callback?.({ status: 'ok', room: bookId })
    } catch (err) {
      callback?.({ status: 'error', message: 'Internal error' })
    }
  })

  socket.on('leave_book', (data: { bookId: string }, callback?: (response: any) => void) => {
    socket.leave(data.bookId)
    callback?.({ status: 'ok', room: data.bookId })
  })
})

const PORT = 5097
server.listen(PORT, () => {
  console.log(`Mock Socket server active on port ${PORT}`)
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

// 3. Client connection testing runner
async function runTests() {
  console.log('\n--- Beginning Socket.IO Real-Time Infrastructure Tests ---\n')

  const validToken = jwt.sign({ userId: 'usr_scribe' }, JWT_ACCESS_SECRET)

  // Test Case 1: Rejected Connection (Missing Token)
  console.log('Testing Unauthenticated Socket connection refusal...')
  const badClient = clientIo(`http://localhost:${PORT}`, {
    reconnection: false,
    autoConnect: true
  })

  badClient.on('connect_error', (err) => {
    assert(err.message.includes('Authentication error'), 'Socket server successfully refused connection without cookies')
    badClient.close()
    testAuthenticatedConnection()
  })

  function testAuthenticatedConnection() {
    console.log('\nTesting Authenticated Socket Connection...')
    // Test Case 2: Authorized Connection
    const client = clientIo(`http://localhost:${PORT}`, {
      extraHeaders: {
        Cookie: `accessToken=${validToken}`
      },
      reconnection: true,
      autoConnect: true
    })

    client.on('connect', () => {
      assert(true, 'Client connected and authenticated successfully')
      testBookJoining(client)
    })

    client.on('connect_error', (err) => {
      assert(false, `Authenticated client failed to connect: ${err.message}`)
      cleanup(client)
    })
  }

  function testBookJoining(client: any) {
    console.log('\nTesting Join Book Room Authorization...')

    // Test Case 3: Blocked Room Join (Access Denied)
    client.emit('join_book', { bookId: 'book_forbidden' }, (response: any) => {
      assert(
        response && response.status === 'error', 
        'Blocked room joining for unauthorized books is enforced'
      )
      
      // Test Case 4: Valid Room Join (Success)
      client.emit('join_book', { bookId: 'book_valid' }, (response: any) => {
        assert(
          response && response.status === 'ok' && response.room === 'book_valid', 
          'Successfully joined authorized book room'
        )

        // Test Case 5: Leave Room
        client.emit('leave_book', { bookId: 'book_valid' }, (response: any) => {
          assert(
            response && response.status === 'ok' && response.room === 'book_valid', 
            'Successfully left book room'
          )
          
          console.log('\n🎉 ALL REAL-TIME SOCKET INFRASTRUCTURE TESTS PASSED SUCCESSFULLY! 🎉\n')
          cleanup(client)
        })
      })
    })
  }

  function cleanup(client: any) {
    client.close()
    server.close()
  }
}
