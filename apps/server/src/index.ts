import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
})

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(compression())
app.use(express.json())
app.use(cookieParser())

// Custom secure headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade')
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: http: https:; img-src 'self' data:;")
  next()
})

import authRouter from './routes/auth.routes'
import userRouter from './routes/user.routes'
import bookRouter from './routes/book.routes'
import conversationRouter from './routes/conversation.routes'
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/books', bookRouter)
app.use('/api/conversations', conversationRouter)

import jwt from 'jsonwebtoken'
import prisma from './prisma/client'
import { userMembershipsCache } from './utils/cache'
import { sanitizeInput } from './utils/sanitize'
import { parseCookies } from './utils/cookies'

// Presence tracking maps: userId -> Set of connected socket IDs
const onlineScribes = new Map<string, Set<string>>()

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// parseCookies is imported from ./utils/cookies

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
const socketIpConnectionCounts = new Map<string, { count: number; resetTime: number }>()

// Socket.IO Handshake Authentication Middleware
io.use((socket, next) => {
  try {
    // Socket connection rate limiting safeguard
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
    }).catch((err) => {
      console.error('Socket handshake user lookup failed:', err)
      next(new Error('Authentication error: Lookup failure'))
    })
  } catch (err) {
    console.error('Socket authentication failed:', err)
    next(new Error('Authentication error: Invalid or expired token'))
  }
})

// Connection Lifecycle and Room Management
io.on('connection', (socket) => {
  const userId = (socket as any).userId
  console.log(`Socket client connected: ${socket.id} (user: ${userId})`)

  // Register in onlineScribes map
  if (!onlineScribes.has(userId)) {
    onlineScribes.set(userId, new Set([socket.id]))
    
    // Broadcast user presence online to all user's book rooms (cached to reduce connection overhead)
    const cachedBooks = userMembershipsCache.get(userId)
    if (cachedBooks) {
      cachedBooks.forEach((bookId) => {
        io.to(bookId).emit('user_presence', {
          userId,
          status: 'online'
        })
        socket.join(bookId)
      })
    } else {
      prisma.bookMember.findMany({
        where: { userId },
        select: { bookId: true }
      }).then((memberships) => {
        const bookIds = memberships.map((m) => m.bookId)
        userMembershipsCache.set(userId, bookIds)
        bookIds.forEach((bookId) => {
          io.to(bookId).emit('user_presence', {
            userId,
            status: 'online'
          })
          socket.join(bookId)
        })
      }).catch((err) => console.error('Connect memberships broadcast error:', err))
    }
  } else {
    onlineScribes.get(userId)!.add(socket.id)
    // Make sure socket is joined to all their book rooms (using cache)
    const cachedBooks = userMembershipsCache.get(userId)
    if (cachedBooks) {
      cachedBooks.forEach((bookId) => {
        socket.join(bookId)
      })
    } else {
      prisma.bookMember.findMany({
        where: { userId },
        select: { bookId: true }
      }).then((memberships) => {
        const bookIds = memberships.map((m) => m.bookId)
        userMembershipsCache.set(userId, bookIds)
        bookIds.forEach((bookId) => {
          socket.join(bookId)
        })
      }).catch((err) => console.error('Connect room joining error:', err))
    }
  }

  socket.on('join_book', async (data: { bookId: string }, callback?: (response: any) => void) => {
    try {
      const { bookId } = data
      if (!bookId) {
        return callback?.({ status: 'error', message: 'Missing bookId' })
      }

      // Enforce authorization: verify book membership
      const member = await prisma.bookMember.findUnique({
        where: {
          bookId_userId: { bookId, userId }
        }
      })

      if (!member) {
        socket.emit('error', { message: 'Access denied. You are not a member of this Book.' })
        return callback?.({ status: 'error', message: 'Access denied' })
      }

      socket.join(bookId)
      console.log(`Socket user ${userId} joined room ${bookId}`)
      socket.emit('joined_book', { bookId })

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
      console.error('join_book error:', err)
      callback?.({ status: 'error', message: 'Internal server error' })
    }
  })

  socket.on('leave_book', (data: { bookId: string }, callback?: (response: any) => void) => {
    try {
      const { bookId } = data
      if (bookId) {
        socket.leave(bookId)
        console.log(`Socket user ${userId} left room ${bookId}`)
        socket.emit('left_book', { bookId })
        callback?.({ status: 'ok', room: bookId })
      }
    } catch (err) {
      console.error('leave_book error:', err)
      callback?.({ status: 'error', message: 'Internal server error' })
    }
  })

  // Real-time Message Sending & Broadcasting
  socket.on('send_message', async (
    data: { bookId: string; conversationId: string; content: string },
    callback?: (response: any) => void
  ) => {
    try {
      const { bookId, conversationId, content } = data
      if (!bookId || !conversationId || !content || !content.trim()) {
        return callback?.({ status: 'error', message: 'Invalid message payload' })
      }

      // 1. Verify membership scope for security
      const member = await prisma.bookMember.findUnique({
        where: {
          bookId_userId: { bookId, userId }
        }
      })

      if (!member) {
        return callback?.({ status: 'error', message: 'Unauthorized book access' })
      }

      // 2. Persist message to database
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: sanitizeInput(content.trim()),
          status: 'sent',
        },
        include: {
          sender: {
            select: { id: true, displayName: true }
          }
        }
      })

      // 3. Broadcast to all other room members
      socket.to(bookId).emit('new_message', message)

      // 4. Return server acknowledgement to creator
      callback?.({ status: 'ok', message })
    } catch (err) {
      console.error('send_message error:', err)
      callback?.({ status: 'error', message: 'Internal server error' })
    }
  })

  // Real-time Scribe Typing Events
  socket.on('typing', (data: { bookId: string; conversationId: string; isTyping: boolean }) => {
    try {
      const { bookId, conversationId, isTyping } = data
      const displayName = (socket as any).displayName || 'Scribe'
      
      // Broadcast typing state to other members in the book room
      socket.to(bookId).emit('user_typing', {
        conversationId,
        userId,
        displayName,
        isTyping
      })
    } catch (err) {
      console.error('typing event error:', err)
    }
  })

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id} (user: ${userId})`)
    
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
        }).catch((err) => console.error('Disconnect membership broadcast error:', err))
      }
    }
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
