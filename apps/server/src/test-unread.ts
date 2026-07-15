import express from 'express'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import bookRouter from './routes/book.routes'
import conversationRouter from './routes/conversation.routes'
import jwt from 'jsonwebtoken'

// 1. Stub database logs for unread testing
const mockDb = {
  users: [
    { id: 'usr_scribe_a', email: 'scribea@ledger.com', displayName: 'Scribe Alpha' }
  ],
  bookMembers: [
    { bookId: 'book_valid', userId: 'usr_scribe_a', role: 'member' }
  ] as any[],
  books: [
    { id: 'book_valid', name: 'Standard Ledger', joinCode: 'LEDGER123', creatorId: 'usr_scribe_a' }
  ],
  conversations: [
    { id: 'conv_123', bookId: 'book_valid', isGroup: true }
  ] as any[],
  conversationMembers: [
    { id: 'cm_123', conversationId: 'conv_123', userId: 'usr_scribe_a', lastReadAt: null as Date | null }
  ] as any[],
  messages: [
    { id: 'msg_1', conversationId: 'conv_123', senderId: 'usr_scribe_a', content: 'Message 1', createdAt: new Date(1894, 9, 14, 10, 0) },
    { id: 'msg_2', conversationId: 'conv_123', senderId: 'usr_scribe_a', content: 'Message 2', createdAt: new Date(1894, 9, 14, 10, 5) },
    { id: 'msg_3', conversationId: 'conv_123', senderId: 'usr_scribe_a', content: 'Message 3', createdAt: new Date(1894, 9, 14, 10, 10) }
  ] as any[]
}

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find(
    (m) => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId
  ) || null
}) as any

prisma.book.findUnique = (async (args: any) => {
  const { id } = args.where
  const book = mockDb.books.find(b => b.id === id)
  if (!book) return null
  return {
    ...book,
    creator: mockDb.users[0],
    members: mockDb.bookMembers,
    conversations: mockDb.conversations.map(c => ({
      ...c,
      members: mockDb.conversationMembers.filter(cm => cm.conversationId === c.id)
    }))
  }
}) as any

prisma.message.count = (async (args: any) => {
  const { conversationId, createdAt } = args.where
  let msgs = mockDb.messages.filter(m => m.conversationId === conversationId)
  if (createdAt && createdAt.gt) {
    msgs = msgs.filter(m => m.createdAt.getTime() > createdAt.gt.getTime())
  }
  return msgs.length
}) as any

prisma.conversationMember.findUnique = (async (args: any) => {
  const { conversationId_userId } = args.where
  return mockDb.conversationMembers.find(
    (cm) => cm.conversationId === conversationId_userId.conversationId && cm.userId === conversationId_userId.userId
  ) || null
}) as any

prisma.conversationMember.update = (async (args: any) => {
  const { id } = args.where
  const member = mockDb.conversationMembers.find(cm => cm.id === id)
  if (member) {
    member.lastReadAt = args.data.lastReadAt
  }
  return member
}) as any

// 2. Initialize and Boot Express Server
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/books', bookRouter)
app.use('/api/conversations', conversationRouter)

const PORT = 5092
const server = app.listen(PORT, () => {
  console.log(`Mock Unread server active on port ${PORT}`)
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

// 3. Unread tracking tests runner
async function runTests() {
  console.log('\n--- Beginning Unread Tracking System Tests ---\n')

  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
  const token = jwt.sign({ userId: 'usr_scribe_a' }, JWT_ACCESS_SECRET)
  const cookieHeader = `accessToken=${token}`

  try {
    // Test Case 1: Initial fetch unread count (should be 3 messages)
    console.log('Fetching initial book details containing unread counts...')
    const res1 = await fetch(`http://localhost:${PORT}/api/books/book_valid`, {
      headers: { Cookie: cookieHeader }
    })
    const data1 = await res1.json()
    assert(res1.status === 200, 'HTTP Status is 200')
    assert(data1.conversations.length === 1, 'Found exactly 1 conversation')
    assert(data1.conversations[0].unreadCount === 3, 'Initial unread count is calculated as 3')
    assert(data1.conversations[0].lastReadAt === null, 'lastReadAt is initially null')

    // Test Case 2: Mark conversation as read
    console.log('\nMarking conversation as read (POST /api/conversations/conv_123/read)...')
    const res2 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/read`, {
      method: 'POST',
      headers: { Cookie: cookieHeader }
    })
    const data2 = await res2.json()
    assert(res2.status === 200, 'HTTP Status is 200')
    assert(data2.success === true, 'Mark read request returned success')

    // Test Case 3: Re-fetch book details (should be 0 unread messages)
    console.log('\nRe-fetching book details to verify unread count reset...')
    const res3 = await fetch(`http://localhost:${PORT}/api/books/book_valid`, {
      headers: { Cookie: cookieHeader }
    })
    const data3 = await res3.json()
    assert(res3.status === 200, 'HTTP Status is 200')
    assert(data3.conversations[0].unreadCount === 0, 'Unread count successfully reset to 0 after read markers update')
    assert(data3.conversations[0].lastReadAt !== null, 'lastReadAt is now populated')

    console.log('\n🎉 ALL UNREAD TRACKING TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (error) {
    console.error('Test execution failed with error:', error)
    process.exit(1)
  } finally {
    server.close()
  }
}
