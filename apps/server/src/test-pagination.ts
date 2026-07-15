import express from 'express'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import conversationRouter from './routes/conversation.routes'
import jwt from 'jsonwebtoken'

// 1. Stub database logs for pagination testing
const mockDb = {
  users: [
    { id: 'usr_scribe', email: 'scribe@ledger.com', displayName: 'Scribe Reader' }
  ],
  bookMembers: [
    { bookId: 'book_valid', userId: 'usr_scribe', role: 'member' }
  ],
  conversations: [
    { id: 'conv_123', bookId: 'book_valid' }
  ],
  messages: [] as any[]
}

// Seed mock database with 45 messages (numbered 1 to 45)
for (let i = 1; i <= 45; i++) {
  mockDb.messages.push({
    id: `msg_${i}`,
    conversationId: 'conv_123',
    senderId: 'usr_scribe',
    content: `Entry log number ${i}`,
    status: 'sent',
    createdAt: new Date(1894, 9, 14, 10, i) // October 14th, 1894, spaced by minutes
  })
}

prisma.conversation.findUnique = (async (args: any) => {
  const { id } = args.where
  const conv = mockDb.conversations.find(c => c.id === id)
  if (!conv) return null
  return {
    ...conv,
    book: {
      members: mockDb.bookMembers
    }
  }
}) as any

prisma.message.findMany = (async (args: any) => {
  const { conversationId } = args.where
  const take = args.take
  const cursor = args.cursor
  const skip = args.skip || 0

  let filtered = mockDb.messages.filter(m => m.conversationId === conversationId)

  // Sort by createdAt desc initially (newest first)
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (cursor) {
    const cursorIndex = filtered.findIndex(m => m.id === cursor.id)
    if (cursorIndex !== -1) {
      filtered = filtered.slice(cursorIndex + skip)
    }
  }

  return filtered.slice(0, take)
}) as any

// 2. Initialize and Boot Express Server
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/conversations', conversationRouter)

const PORT = 5095
const server = app.listen(PORT, () => {
  console.log(`Mock Pagination server active on port ${PORT}`)
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

// 3. Pagination verification runner
async function runTests() {
  console.log('\n--- Beginning Message Cursor Pagination Tests ---\n')

  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
  const token = jwt.sign({ userId: 'usr_scribe' }, JWT_ACCESS_SECRET)
  const cookieHeader = `accessToken=${token}`

  try {
    // Test Case 1: First batch load (limit = 20)
    console.log('Fetching first batch (newest 20 messages)...')
    const res1 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/messages?limit=20`, {
      headers: { Cookie: cookieHeader }
    })
    const data1 = await res1.json()
    assert(res1.status === 200, 'HTTP Status is 200')
    assert(data1.messages.length === 20, 'Returned exactly 20 messages')
    assert(data1.messages[0].id === 'msg_26', 'First chronological message is msg_26')
    assert(data1.messages[19].id === 'msg_45', 'Last chronological message in batch is msg_45')
    assert(data1.nextCursor === 'msg_26', 'nextCursor points to msg_26')

    // Test Case 2: Paginate second batch (limit = 20, cursor = msg_26)
    console.log('\nFetching second batch (messages 6 to 25)...')
    const res2 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/messages?limit=20&cursor=msg_26`, {
      headers: { Cookie: cookieHeader }
    })
    const data2 = await res2.json()
    assert(res2.status === 200, 'HTTP Status is 200')
    assert(data2.messages.length === 20, 'Returned exactly 20 messages')
    assert(data2.messages[0].id === 'msg_6', 'First chronological message in batch is msg_6')
    assert(data2.messages[19].id === 'msg_25', 'Last chronological message in batch is msg_25')
    assert(data2.nextCursor === 'msg_6', 'nextCursor points to msg_6')

    // Test Case 3: Paginate final batch (limit = 20, cursor = msg_6)
    console.log('\nFetching final batch (messages 1 to 5)...')
    const res3 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/messages?limit=20&cursor=msg_6`, {
      headers: { Cookie: cookieHeader }
    })
    const data3 = await res3.json()
    assert(res3.status === 200, 'HTTP Status is 200')
    assert(data3.messages.length === 5, 'Returned remaining 5 messages')
    assert(data3.messages[0].id === 'msg_1', 'First chronological message is msg_1')
    assert(data3.messages[4].id === 'msg_5', 'Last chronological message is msg_5')
    assert(data3.nextCursor === null, 'nextCursor is null (no more entries to load)')

    console.log('\n🎉 ALL MESSAGING PAGINATION TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (error) {
    console.error('Test execution failed with error:', error)
    process.exit(1)
  } finally {
    server.close()
  }
}
