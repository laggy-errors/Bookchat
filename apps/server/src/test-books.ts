import express from 'express'
import cookieParser from 'cookie-parser'
import prisma from './prisma/client'
import bookRouter from './routes/book.routes'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// 1. Stub the Prisma Client database for Book CRUD and Member management testing
const mockDb = {
  users: [
    { id: 'usr_creator', email: 'creator@ledger.com', displayName: 'Creator Scribe', themePreference: 'paper', hasSeenPreamble: true, hasSeenTour: true, defaultBookId: null },
    { id: 'usr_member', email: 'member@ledger.com', displayName: 'Member Scribe', themePreference: 'paper', hasSeenPreamble: true, hasSeenTour: true, defaultBookId: null },
    { id: 'usr_stranger', email: 'stranger@ledger.com', displayName: 'Stranger Scribe', themePreference: 'paper', hasSeenPreamble: true, hasSeenTour: true, defaultBookId: null }
  ] as any[],
  books: [] as any[],
  bookMembers: [] as any[],
  conversations: [] as any[],
  conversationMembers: [] as any[]
}

prisma.user.findUnique = (async (args: any) => {
  const { id } = args.where
  return mockDb.users.find((u) => u.id === id) || null
}) as any

prisma.user.update = (async (args: any) => {
  const { id } = args.where
  const user = mockDb.users.find((u) => u.id === id)
  if (user) {
    Object.assign(user, args.data)
    return user
  }
  return null
}) as any

prisma.book.findUnique = (async (args: any) => {
  const { id, joinCode } = args.where
  let book = null
  if (id) book = mockDb.books.find((b) => b.id === id)
  if (joinCode) book = mockDb.books.find((b) => b.joinCode === joinCode)
  
  if (!book) return null

  // Hydrate relations if include is specified
  const result = { ...book }
  if (args.include) {
    if (args.include.creator) {
      result.creator = mockDb.users.find((u) => u.id === book.creatorId)
    }
    if (args.include.members) {
      result.members = mockDb.bookMembers
        .filter((m) => m.bookId === book.id)
        .map((m) => ({
          ...m,
          user: mockDb.users.find((u) => u.id === m.userId)
        }))
    }
    if (args.include.conversations) {
      result.conversations = mockDb.conversations.filter((c) => c.bookId === book.id)
    }
  }
  return result
}) as any

prisma.bookMember.findUnique = (async (args: any) => {
  const { bookId_userId } = args.where
  return mockDb.bookMembers.find((m) => m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId) || null
}) as any

prisma.bookMember.findMany = (async (args: any) => {
  const { userId } = args.where
  const memberships = mockDb.bookMembers.filter((m) => m.userId === userId)
  
  return memberships.map((m) => {
    const book = mockDb.books.find((b) => b.id === m.bookId)
    const creator = mockDb.users.find((u) => u.id === book.creatorId)
    const members = mockDb.bookMembers.filter((bm) => bm.bookId === book.id)
    return {
      ...m,
      book: {
        ...book,
        creator,
        members
      }
    }
  })
}) as any

prisma.book.update = (async (args: any) => {
  const { id } = args.where
  const book = mockDb.books.find((b) => b.id === id)
  if (book) {
    Object.assign(book, args.data)
    return book
  }
  return null
}) as any

prisma.book.delete = (async (args: any) => {
  const { id } = args.where
  mockDb.books = mockDb.books.filter((b) => b.id !== id)
  mockDb.bookMembers = mockDb.bookMembers.filter((m) => m.bookId !== id)
  mockDb.conversations = mockDb.conversations.filter((c) => c.bookId !== id)
  return { id }
}) as any

// Mock transaction logic simply calling the callback with a mock tx runner
prisma.$transaction = (async (callback: any) => {
  const tx = {
    book: {
      create: async (args: any) => {
        const book = {
          id: 'book_' + Math.random().toString(36).substr(2, 9),
          name: args.data.name,
          joinCode: args.data.joinCode,
          passwordHash: args.data.passwordHash,
          creatorId: args.data.creatorId,
          createdAt: new Date()
        }
        mockDb.books.push(book)
        return book
      }
    },
    bookMember: {
      create: async (args: any) => {
        const member = {
          id: 'bm_' + Math.random().toString(36).substr(2, 9),
          bookId: args.data.bookId,
          userId: args.data.userId,
          role: args.data.role || 'member',
          joinedAt: new Date()
        }
        mockDb.bookMembers.push(member)
        return member
      },
      delete: async (args: any) => {
        const { bookId_userId } = args.where
        mockDb.bookMembers = mockDb.bookMembers.filter(
          (m) => !(m.bookId === bookId_userId.bookId && m.userId === bookId_userId.userId)
        )
        return { bookId: bookId_userId.bookId, userId: bookId_userId.userId }
      }
    },
    conversation: {
      findFirst: async (args: any) => {
        return mockDb.conversations.find((c) => c.bookId === args.where.bookId && c.isGroup === args.where.isGroup) || null
      },
      findMany: async (args: any) => {
        return mockDb.conversations.filter((c) => c.bookId === args.where.bookId)
      },
      create: async (args: any) => {
        const conversation = {
          id: 'conv_' + Math.random().toString(36).substr(2, 9),
          bookId: args.data.bookId,
          isGroup: args.data.isGroup || false,
          createdAt: new Date()
        }
        mockDb.conversations.push(conversation)
        return conversation
      }
    },
    conversationMember: {
      create: async (args: any) => {
        const convMember = {
          id: 'cm_' + Math.random().toString(36).substr(2, 9),
          conversationId: args.data.conversationId,
          userId: args.data.userId,
          lastReadAt: null
        }
        mockDb.conversationMembers.push(convMember)
        return convMember
      },
      deleteMany: async (args: any) => {
        const { conversationId, userId } = args.where
        const ids = conversationId.in
        mockDb.conversationMembers = mockDb.conversationMembers.filter(
          (cm) => !(cm.userId === userId && ids.includes(cm.conversationId))
        )
        return { count: 1 }
      }
    },
    user: {
      findUnique: async (args: any) => {
        return mockDb.users.find((u) => u.id === args.where.id) || null
      },
      update: async (args: any) => {
        const user = mockDb.users.find((u) => u.id === args.where.id)
        if (user) {
          Object.assign(user, args.data)
          return user
        }
        return null
      }
    }
  }
  return callback(tx)
}) as any

// 2. Initialize Express Mock Server
const app = express()
app.use(express.json())
app.use(cookieParser())
app.use('/api/books', bookRouter)

const PORT = 5098
const server = app.listen(PORT, () => {
  console.log(`Mock book server active on port ${PORT}`)
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

// Token helper
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_12345'
const signTokenCookie = (userId: string) => {
  const token = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' })
  return `accessToken=${token}`
}

async function runTests() {
  console.log('\n--- Beginning Book, Join Code & Member Management Tests ---\n')
  
  const creatorCookie = signTokenCookie('usr_creator')
  const memberCookie = signTokenCookie('usr_member')
  const strangerCookie = signTokenCookie('usr_stranger')
  
  let testBookId = ''
  let testJoinCode = ''
  
  try {
    // Test Case 1: Create Password Protected Book
    console.log('Testing Password Protected Book Creation...')
    const createRes = await fetch(`http://localhost:${PORT}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': creatorCookie },
      body: JSON.stringify({ name: 'Secret Ledger', password: 'wax_seal_passcode', setDefault: true }),
    })
    const createData = await createRes.json()
    assert(createRes.status === 201, 'Create Book returned 201 status')
    testBookId = createData.id
    testJoinCode = createData.joinCode
    assert(!!testJoinCode, 'Join code generated successfully')

    // Test Case 2: Join with Correct Password (Success)
    console.log('\nTesting Member Join...')
    const successJoinRes = await fetch(`http://localhost:${PORT}/api/books/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': memberCookie },
      body: JSON.stringify({ joinCode: testJoinCode, password: 'wax_seal_passcode' }),
    })
    assert(successJoinRes.status === 200, 'Member joined successfully')

    // Test Case 3: Unauthorized Member Deletion (Non-Creator trying to delete a member)
    console.log('\nTesting Member Removal Authorization Block...')
    const badRemoveRes = await fetch(`http://localhost:${PORT}/api/books/${testBookId}/members/usr_member`, {
      method: 'DELETE',
      headers: { 'Cookie': strangerCookie },
    })
    assert(badRemoveRes.status === 403, 'Stranger request to delete member is blocked with 403 status')

    const memberRemoveRes = await fetch(`http://localhost:${PORT}/api/books/${testBookId}/members/usr_creator`, {
      method: 'DELETE',
      headers: { 'Cookie': memberCookie },
    })
    assert(memberRemoveRes.status === 403, 'Normal member request to delete creator is blocked with 403 status')

    // Test Case 4: Creator Self-Removal Prevention
    console.log('\nTesting Block on Creator Self-Removal...')
    const selfRemoveRes = await fetch(`http://localhost:${PORT}/api/books/${testBookId}/members/usr_creator`, {
      method: 'DELETE',
      headers: { 'Cookie': creatorCookie },
    })
    assert(selfRemoveRes.status === 400, 'Creator self-removal request is blocked with 400 status')

    // Test Case 5: Successful Member Removal (Creator removing a member)
    console.log('\nTesting Successful Member Removal by Creator...')
    // Mock user defaultBookId update to verify fallback updates
    const targetUser = mockDb.users.find(u => u.id === 'usr_member')
    if (targetUser) targetUser.defaultBookId = testBookId

    const removeRes = await fetch(`http://localhost:${PORT}/api/books/${testBookId}/members/usr_member`, {
      method: 'DELETE',
      headers: { 'Cookie': creatorCookie },
    })
    const removeData = await removeRes.json()
    assert(removeRes.status === 200, 'Member removed successfully by Creator Scribe')
    
    // Verify target defaultBookId fallback
    assert(targetUser?.defaultBookId === null, 'Target user defaultBookId successfully reset to null on removal')

    // Verify deletion in mock state
    const memberLookup = mockDb.bookMembers.find(m => m.bookId === testBookId && m.userId === 'usr_member')
    assert(memberLookup === undefined, 'Member is successfully cleared from bookMembers registry')

    console.log('\n🎉 ALL MEMBER MANAGEMENT TESTS PASSED SUCCESSFULLY! 🎉\n')
  } catch (error) {
    console.error('Test execution failed with error:', error)
    process.exit(1)
  } finally {
    server.close()
  }
}
