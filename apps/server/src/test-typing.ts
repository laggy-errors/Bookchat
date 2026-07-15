import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import jwt from 'jsonwebtoken'

// 1. Stub database for typing test
const mockDb = {
  users: [
    { id: 'usr_scribe_a', email: 'scribea@ledger.com', displayName: 'Scribe Alpha' },
    { id: 'usr_scribe_b', email: 'scribeb@ledger.com', displayName: 'Scribe Beta' }
  ] as any[],
  bookMembers: [
    { bookId: 'book_valid', userId: 'usr_scribe_a', role: 'member' },
    { bookId: 'book_valid', userId: 'usr_scribe_b', role: 'member' }
  ] as any[]
}

prisma.user.findUnique = (async (args: any) => {
  const { id } = args.where
  return mockDb.users.find(u => u.id === id) || null
}) as any

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    (m) => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId
  ) || null
}) as any

// 2. Initialize and Boot Express Server with Socket.IO
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

const JWT_ACCESS_SECRET = 'typing_test_secret_key_123'

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
    prisma.user.findUnique({ where: { id: decoded.userId } }).then((user) => {
      if (!user) {
        return next(new Error('Authentication error: User not found'))
      }
      ;(socket as any).userId = user.id
      ;(socket as any).displayName = user.displayName
      next()
    }).catch(() => {
      next(new Error('Authentication error: Lookup failed'))
    })
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
        return callback?.({ status: 'error', message: 'Access denied' })
      }

      socket.join(bookId)
      callback?.({ status: 'ok', room: bookId })
    } catch (err) {
      callback?.({ status: 'error', message: 'Internal error' })
    }
  })

  socket.on('typing', (data: { bookId: string; conversationId: string; isTyping: boolean }) => {
    try {
      const { bookId, conversationId, isTyping } = data
      const displayName = (socket as any).displayName || 'Scribe'
      
      socket.to(bookId).emit('user_typing', {
        conversationId,
        userId,
        displayName,
        isTyping
      })
    } catch (err) {
      console.error(err)
    }
  })
})

const PORT = 5094
server.listen(PORT, () => {
  console.log(`Mock Typing server active on port ${PORT}`)
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
  console.log('\n--- Beginning Real-Time Typing Indicator Tests ---\n')

  const tokenA = jwt.sign({ userId: 'usr_scribe_a' }, JWT_ACCESS_SECRET)
  const tokenB = jwt.sign({ userId: 'usr_scribe_b' }, JWT_ACCESS_SECRET)

  // Initialize Client A
  const clientA = clientIo(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: `accessToken=${tokenA}` },
    reconnection: false,
    autoConnect: true
  })

  // Initialize Client B
  const clientB = clientIo(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: `accessToken=${tokenB}` },
    reconnection: false,
    autoConnect: true
  })

  let clientAJoined = false
  let clientBJoined = false

  const checkJoinReady = () => {
    if (clientAJoined && clientBJoined) {
      testTypingEvents()
    }
  }

  clientA.on('connect', () => {
    clientA.emit('join_book', { bookId: 'book_valid' }, (res: any) => {
      assert(res && res.status === 'ok', 'Client A joined room successfully')
      clientAJoined = true
      checkJoinReady()
    })
  })

  clientB.on('connect', () => {
    clientB.emit('join_book', { bookId: 'book_valid' }, (res: any) => {
      assert(res && res.status === 'ok', 'Client B joined room successfully')
      clientBJoined = true
      checkJoinReady()
    })
  })

  function testTypingEvents() {
    console.log('\nEmitting typing:true from Client A...')
    
    // Set up user_typing broadcast receiver on Client B
    clientB.on('user_typing', (data: any) => {
      if (data.isTyping) {
        assert(data.userId === 'usr_scribe_a', 'Typing event contains Client A userId')
        assert(data.displayName === 'Scribe Alpha', 'Typing event contains Client A displayName')
        assert(data.conversationId === 'conv_123', 'Typing event maps to correct conversation')
        
        console.log('\nEmitting typing:false from Client A...')
        clientA.emit('typing', { bookId: 'book_valid', conversationId: 'conv_123', isTyping: false })
      } else {
        assert(data.userId === 'usr_scribe_a', 'Typing stops event contains Client A userId')
        assert(data.isTyping === false, 'Typing stops event sets isTyping to false')

        console.log('\n🎉 ALL TYPING INDICATOR REAL-TIME TESTS PASSED SUCCESSFULLY! 🎉\n')
        cleanup()
      }
    })

    // Emit typing true
    clientA.emit('typing', { bookId: 'book_valid', conversationId: 'conv_123', isTyping: true })
  }

  function cleanup() {
    clientA.close()
    clientB.close()
    server.close()
  }
}
