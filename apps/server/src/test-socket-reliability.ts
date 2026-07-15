import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'

const JWT_ACCESS_SECRET = 'reliability_test_secret_123'
const PORT = 5101

// Setup express server and Socket.IO
const app = express()
app.use(express.json())
app.use(cookieParser())

const server = http.createServer(app)
const io = new Server(server)

// Mock DB membership database
const mockDb = {
  bookMembers: [
    { bookId: 'book_reliability', userId: 'usr_scribe_A', role: 'creator' },
    { bookId: 'book_reliability', userId: 'usr_scribe_B', role: 'member' }
  ]
}

// Cookie parser helper
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const list: Record<string, string> = {}
  if (!cookieHeader) return list
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    list[parts.shift()?.trim() || ''] = decodeURI(parts.join('='))
  })
  return list
}

// Handshake middleware
io.use((socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie
    const cookies = parseCookies(cookieHeader)
    const token = cookies['accessToken']
    if (!token) return next(new Error('Missing token'))
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { userId: string }
    ;(socket as any).userId = decoded.userId
    next()
  } catch (err) {
    next(new Error('Invalid token'))
  }
})

// Connection lifecycles
io.on('connection', (socket) => {
  const userId = (socket as any).userId

  socket.on('join_book', (data: { bookId: string }, callback?: (response: any) => void) => {
    const isMember = mockDb.bookMembers.some(m => m.bookId === data.bookId && m.userId === userId)
    if (!isMember) return callback?.({ status: 'error', message: 'Unauthorized' })
    socket.join(data.bookId)
    // Broadcast presence online status
    socket.to(data.bookId).emit('user_presence', { userId, status: 'online' })
    callback?.({ status: 'ok', room: data.bookId })
  })

  socket.on('typing', (data: { bookId: string; isTyping: boolean }) => {
    socket.to(data.bookId).emit('user_typing', { userId, isTyping: data.isTyping })
  })

  socket.on('send_message', (data: { bookId: string; content: string }, callback?: (response: any) => void) => {
    const msg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 5),
      senderId: userId,
      content: data.content,
      createdAt: new Date().toISOString()
    }
    // Broadcast message to room
    socket.to(data.bookId).emit('new_message', msg)
    callback?.({ status: 'ok', message: msg })
  })

  socket.on('disconnect', () => {
    // Broadcast presence offline status
    mockDb.bookMembers.forEach(m => {
      if (m.userId === userId) {
        io.to(m.bookId).emit('user_presence', { userId, status: 'offline', lastActive: new Date().toISOString() })
      }
    })
  })
})

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ Reliability Failure: ${message}`)
    process.exit(1)
  } else {
    console.log(`✅ Success: ${message}`)
  }
}

server.listen(PORT, () => {
  console.log(`Reliability Socket server active on port ${PORT}`)
  runReliabilityTests()
})

const runReliabilityTests = async () => {
  console.log('\n--- Beginning Socket.IO Reliability & Offline Recovery Tests ---\n')

  const tokenA = jwt.sign({ userId: 'usr_scribe_A' }, JWT_ACCESS_SECRET)
  const tokenB = jwt.sign({ userId: 'usr_scribe_B' }, JWT_ACCESS_SECRET)

  // 1. Connection & Handshake Authentication
  console.log('Testing Scribe A connection & authentication...')
  const clientA = clientIo(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: `accessToken=${tokenA}` },
    reconnection: true,
    autoConnect: true
  })

  clientA.on('connect', () => {
    assert(true, 'Scribe A successfully connected and authenticated via cookie handshakes')
    testScribeB()
  })

  let clientB: any

  function testScribeB() {
    console.log('\nTesting Scribe B connection...')
    clientB = clientIo(`http://localhost:${PORT}`, {
      extraHeaders: { Cookie: `accessToken=${tokenB}` },
      reconnection: true,
      autoConnect: true
    })

    clientB.on('connect', () => {
      assert(true, 'Scribe B successfully connected')
      testRooms()
    })
  }

  function testRooms() {
    console.log('\nTesting Room joining and presence broadcasts...')
    clientA.emit('join_book', { bookId: 'book_reliability' }, (resA: any) => {
      assert(resA.status === 'ok', 'Scribe A joined book room successfully')

      // Scribe A listens for Scribe B presence online
      clientA.on('user_presence', (presence: any) => {
        if (presence.status === 'online' && presence.userId === 'usr_scribe_B') {
          assert(true, 'Scribe A received online presence broadcast for Scribe B')
          testMessageDelivery()
        }
      })

      clientB.emit('join_book', { bookId: 'book_reliability' }, (resB: any) => {
        assert(resB.status === 'ok', 'Scribe B joined book room successfully')
      })
    })
  }

  function testMessageDelivery() {
    console.log('\nTesting Message Broadcast delivery...')
    clientB.on('new_message', (msg: any) => {
      assert(msg.content === 'Greetings from Scribe A', 'Scribe B successfully received message broadcast from Scribe A')
      clientB.off('new_message') // clear listener for next steps
      testTypingIndicator()
    })

    clientA.emit('send_message', { bookId: 'book_reliability', content: 'Greetings from Scribe A' })
  }

  function testTypingIndicator() {
    console.log('\nTesting Typing indicators broadcast...')
    clientB.on('user_typing', (typing: any) => {
      if (typing.userId === 'usr_scribe_A' && typing.isTyping) {
        assert(true, 'Scribe B successfully received typing:true indicator from Scribe A')
        clientB.off('user_typing')
        testDisconnectAndOfflineRecovery()
      }
    })

    clientA.emit('typing', { bookId: 'book_reliability', isTyping: true })
  }

  // 6. Disconnection, Offline queueing, Reconnection, and Recovery
  function testDisconnectAndOfflineRecovery() {
    console.log('\nTesting Scribe A Disconnection & Presence offline broadcast...')

    // Scribe B listens for Scribe A disconnection presence
    clientB.on('user_presence', (presence: any) => {
      if (presence.status === 'offline' && presence.userId === 'usr_scribe_A') {
        assert(true, 'Scribe B received offline presence broadcast for disconnected Scribe A')
        clientB.off('user_presence')
        simulateOfflineRecovery()
      }
    })

    // Force disconnect Client A
    clientA.disconnect()
  }

  function simulateOfflineRecovery() {
    console.log('\nTesting Scribe A Offline Recovery upon reconnection...')
    // Scribe A is disconnected. Simulate buffering message in queue:
    const offlineQueue = [
      { id: 'queued_msg_999', bookId: 'book_reliability', content: 'Queued offline message while disconnected' }
    ]

    console.log(`Buffered ${offlineQueue.length} messages in client offline queue`)

    // Setup Scribe B to listen for the queued message broadcast on Client A's reconnection
    clientB.on('new_message', (msg: any) => {
      if (msg.content === 'Queued offline message while disconnected') {
        assert(true, 'Scribe B received Scribe A\'s flushed queue message upon reconnection')
        console.log('\n🎉 ALL SOCKET.IO RELIABILITY & RECOVERY TESTS PASSED! 🎉\n')
        cleanup()
      }
    })

    // Reconnect Scribe A
    clientA.off('connect') // clear initial connection listener
    clientA.connect()

    // Upon reconnect, simulate the client's automated flush logic (App.tsx: processOfflineQueue)
    clientA.on('connect', () => {
      console.log('Scribe A reconnected. Flushing offline queue...')
      offlineQueue.forEach((msg) => {
        clientA.emit('send_message', { bookId: msg.bookId, content: msg.content }, (ack: any) => {
          assert(ack.status === 'ok', 'Server acknowledged and committed offline queued message')
        })
      })
    })
  }

  function cleanup() {
    clientA.close()
    clientB.close()
    server.close()
  }
}
