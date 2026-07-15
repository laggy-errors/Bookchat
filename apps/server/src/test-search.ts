import express from 'express'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import conversationRouter from './routes/conversation.routes'
import jwt from 'jsonwebtoken'

// 1. Stub database logs for search testing
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
  messages: [
    { id: 'msg_1', conversationId: 'conv_123', senderId: 'usr_scribe', content: 'Alpha ledger entry', createdAt: new Date(1894, 9, 14, 10, 0) },
    { id: 'msg_2', conversationId: 'conv_123', senderId: 'usr_scribe', content: 'Beta ledger entry', createdAt: new Date(1894, 9, 14, 10, 5) },
    { id: 'msg_3', conversationId: 'conv_123', senderId: 'usr_scribe', content: 'Alpha correspondence', createdAt: new Date(1894, 9, 14, 10, 10) },
    { id: 'msg_4', conversationId: 'conv_123', senderId: 'usr_scribe', content: 'Gamma transcription', createdAt: new Date(1894, 9, 14, 10, 15) }
  ] as any[]
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
  const { conversationId, content } = args.where
  const take = args.take
  const skip = args.skip || 0

  let filtered = mockDb.messages.filter(m => m.conversationId === conversationId)

  if (content && content.contains) {
    const q = content.contains.toLowerCase()
    filtered = filtered.filter(m => m.content.toLowerCase().includes(q))
  }

  // Sort by createdAt desc initially
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return filtered.slice(skip, skip + take).map(m => ({
    ...m,
    sender: mockDb.users[0]
  }))
}) as any

prisma.message.count = (async (args: any) => {
  const { conversationId, content } = args.where
  let filtered = mockDb.messages.filter(m => m.conversationId === conversationId)

  if (content && content.contains) {
    const q = content.contains.toLowerCase()
    filtered = filtered.filter(m => m.content.toLowerCase().includes(q))
  }

  return filtered.length
}) as any

// 2. Initialize and Boot Express Server
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/conversations', conversationRouter)

const PORT = 5091
const server = app.listen(PORT, () => {
  console.log(`Mock Search server active on port ${PORT}`)
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

// 3. Search verification runner
async function runTests() {
  console.log('\n--- Beginning Message Full-Text Search Tests ---\n')

  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
  const token = jwt.sign({ userId: 'usr_scribe' }, JWT_ACCESS_SECRET)
  const cookieHeader = `accessToken=${token}`

  try {
    // Test Case 1: Search for "Alpha"
    console.log('Searching for keyword "Alpha"...')
    const res1 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/search?query=Alpha&limit=5`, {
      headers: { Cookie: cookieHeader }
    })
    const data1 = await res1.json()
    assert(res1.status === 200, 'HTTP Status is 200')
    assert(data1.messages.length === 2, 'Returned exactly 2 matching messages')
    assert(data1.messages[0].content === 'Alpha correspondence', 'First matched message content is correct')
    assert(data1.messages[1].content === 'Alpha ledger entry', 'Second matched message content is correct')
    assert(data1.totalCount === 2, 'totalCount matches 2')

    // Test Case 2: Search for "entry" (case-insensitive)
    console.log('\nSearching for keyword "entry" (case-insensitive)...')
    const res2 = await fetch(`http://localhost:${PORT}/api/conversations/conv_123/search?query=entry&limit=5`, {
      headers: { Cookie: cookieHeader }
    })
    const data2 = await res2.json()
    assert(res2.status === 200, 'HTTP Status is 200')
    assert(data2.messages.length === 2, 'Returned exactly 2 matching messages')
    assert(data2.messages[0].content === 'Beta ledger entry', 'First matches correct content')
    assert(data2.messages[1].content === 'Alpha ledger entry', 'Second matches correct content')
    assert(data2.totalCount === 2, 'totalCount matches 2')

    console.log('\n🎉 ALL FULL-TEXT SEARCH TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (error) {
    console.error('Test execution failed with error:', error)
    process.exit(1)
  } finally {
    server.close()
  }
}
