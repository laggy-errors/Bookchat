import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { io as clientIo } from 'socket.io-client'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import jwt from 'jsonwebtoken'

// 1. Stub database logs for presence testing
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

prisma.bookMember.findMany = (async (args: any) => {
  const { bookId, userId } = args.where
  if (bookId) {
    return mockDb.bookMembers.filter(m => m.bookId === bookId)
  }
  if (userId) {
    return mockDb.bookMembers.filter(m => m.userId === userId)
  }
  return []
}) as any

// Presence tracking maps: userId -> Set of connected socket IDs
const onlineScribes = new Map<string, Set<string>>()

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

const JWT_ACCESS_SECRET = 'presence_test_secret_key_123'

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

  // Register in onlineScribes map
  if (!onlineScribes.has(userId)) {
    onlineScribes.set(userId, new Set([socket.id]))
    
    // Broadcast user presence online to all user's book rooms
    prisma.bookMember.findMany({ where: { userId } }).then((memberships) => {
      memberships.forEach((m) => {
        io.to(m.bookId).emit('user_presence', {
          userId,
          status: 'online'
        })
        socket.join(m.bookId)
      })
    })
  } else {
    onlineScribes.get(userId)!.add(socket.id)
    prisma.bookMember.findMany({ where: { userId } }).then((memberships) => {
      memberships.forEach((m) => {
        socket.join(m.bookId)
      })
    })
  }

  socket.on('join_book', async (data: { bookId: string }, callback?: (response: any) => void) => {
    try {
      const { bookId } = data
      socket.join(bookId)

      // Get online users in this book room from onlineScribes presence map
      const bookMembers = await prisma.bookMember.findMany({ where: { bookId } })
      const onlineUsersInBook = bookMembers
        .map(m => m.userId)
        .filter(uid => onlineScribes.has(uid))

      callback?.({ 
        status: 'ok', 
        room: bookId,
        onlineUsers: onlineUsersInBook
      })
    } catch (err) {
      callback?.({ status: 'error', message: 'Internal error' })
    }
  })

  socket.on('disconnect', () => {
    const socketSet = onlineScribes.get(userId)
    if (socketSet) {
      socketSet.delete(socket.id)
      if (socketSet.size === 0) {
        onlineScribes.delete(userId)
        
        // Broadcast offline presence status with timestamp to all user's book rooms
        const lastActive = new Date()
        prisma.bookMember.findMany({ where: { userId } }).then((memberships) => {
          memberships.forEach((m) => {
            io.to(m.bookId).emit('user_presence', {
              userId,
              status: 'offline',
              lastActive
            })
          })
        })
      }
    }
  })
})

const PORT = 5093
server.listen(PORT, () => {
  console.log(`Mock Presence server active on port ${PORT}`)
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

// 3. Presence testing runner
async function runTests() {
  console.log('\n--- Beginning Real-Time Presence System Tests ---\n')

  const tokenA = jwt.sign({ userId: 'usr_scribe_a' }, JWT_ACCESS_SECRET)
  const tokenB = jwt.sign({ userId: 'usr_scribe_b' }, JWT_ACCESS_SECRET)

  // Initialize Client A
  const clientA = clientIo(`http://localhost:${PORT}`, {
    extraHeaders: { Cookie: `accessToken=${tokenA}` },
    reconnection: false,
    autoConnect: true
  })

  clientA.on('connect', () => {
    clientA.emit('join_book', { bookId: 'book_valid' }, (res: any) => {
      assert(res && res.status === 'ok', 'Client A joined room successfully')
      assert(res.onlineUsers.includes('usr_scribe_a'), 'Client A is marked online in book room')
      
      // Connect Client B
      testClientBConnection()
    })
  })

  function testClientBConnection() {
    // Set up presence receiver on Client A
    clientA.on('user_presence', (data: any) => {
      if (data.status === 'online') {
        assert(data.userId === 'usr_scribe_b', 'Client A received online presence broadcast for Scribe B')
        
        // Disconnect Client B to trigger offline presence
        console.log('\nDisconnecting Client B...')
        clientB.close()
      } else {
        assert(data.userId === 'usr_scribe_b', 'Client A received offline presence broadcast for Scribe B')
        assert(!!data.lastActive, 'Offline broadcast payload contains lastActive timestamp')
        
        console.log('\n🎉 ALL REAL-TIME PRESENCE SYSTEM TESTS PASSED SUCCESSFULLY! 🎉\n')
        cleanup()
      }
    })

    const clientB = clientIo(`http://localhost:${PORT}`, {
      extraHeaders: { Cookie: `accessToken=${tokenB}` },
      reconnection: false,
      autoConnect: true
    })

    clientB.on('connect', () => {
      clientB.emit('join_book', { bookId: 'book_valid' }, (res: any) => {
        assert(res && res.status === 'ok', 'Client B joined room successfully')
      })
    })
  }

  function cleanup() {
    clientA.close()
    server.close()
  }
}
