import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import jwt from 'jsonwebtoken'

// 1. Stub database logs for message testing
const mockDb = {
  users: [
    { id: 'usr_scribe_a', email: 'scribea@ledger.com', displayName: 'Scribe Alpha' },
    { id: 'usr_scribe_b', email: 'scribeb@ledger.com', displayName: 'Scribe Beta' }
  ] as any[],
  bookMembers: [
    { bookId: 'book_valid', userId: 'usr_scribe_a', role: 'member' },
    { bookId: 'book_valid', userId: 'usr_scribe_b', role: 'member' }
  ] as any[],
  messages: [] as any[]
}

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    (m) => m.bookId === bookId_userId.bookId && m.userId === cookieUserId(bookId_userId.userId)
  ) || null
}) as any

prisma.message.create = (async (args: any) => {
  const msg = {
    id: 'msg_' + Math.random().toString(36).substr(2, 9),
    conversationId: args.data.conversationId,
    senderId: args.data.senderId,
    content: args.data.content,
    status: args.data.status || 'sent',
    createdAt: new Date(),
    sender: mockDb.users.find(u => u.id === args.data.senderId)
  }
  mockDb.messages.push(msg)
  return msg
}) as any

// Helper to handle client mock user mapping
function cookieUserId(uid: string) {
  return uid
}

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

const JWT_ACCESS_SECRET = 'messaging_test_secret_key_123'

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

  socket.on('send_message', async (
    data: { bookId: string; conversationId: string; content: string },
    callback?: (response: any) => void
  ) => {
    try {
      const { bookId, conversationId, content } = data
      const member = await prisma.bookMember.findUnique({
        where: { bookId_userId: { bookId, userId } }
      })

      if (!member) {
        return callback?.({ status: 'error', message: 'Unauthorized book access' })
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: content.trim(),
          status: 'sent',
        }
      })

      // Broadcast to other book room members
      socket.to(bookId).emit('new_message', message)

      // Acknowledge back to sender
      callback?.({ status: 'ok', message })
    } catch (err) {
      callback?.({ status: 'error', message: 'Internal error' })
    }
  })
})

const PORT = 5096
server.listen(PORT, () => {
  console.log(`Mock Messaging server active on port ${PORT}`)
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
  console.log('\n--- Beginning Real-Time Messaging Tests ---\n')

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
      testMessageSending()
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

  function testMessageSending() {
    console.log('\nTesting Message transmission & server acknowledgement...')

    const testContent = 'Greetings from the inkwell.'

    // Set up broadcast receiver on Client B
    clientB.on('new_message', (msg: any) => {
      assert(msg.content === testContent, 'Client B successfully received real-time broadcast message')
      assert(msg.senderId === 'usr_scribe_a', 'Broadcast message metadata contains sender ID')
      assert(!!msg.createdAt, 'Broadcast message contains server timestamp')
      
      console.log('\n🎉 ALL REAL-TIME MESSAGING INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n')
      cleanup()
    })

    // Client A emits message
    clientA.emit(
      'send_message', 
      { bookId: 'book_valid', conversationId: 'conv_123', content: testContent }, 
      (response: any) => {
        assert(response && response.status === 'ok', 'Server returned status OK acknowledgement')
        assert(response.message.content === testContent, 'Acknowledged payload matches content')
        assert(response.message.senderId === 'usr_scribe_a', 'Acknowledged payload matches sender')
      }
    )
  }

  function cleanup() {
    clientA.close()
    clientB.close()
    server.close()
  }
}
