import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma/client'
import requireAuth, { AuthenticatedRequest } from '../middleware/requireAuth'
import generateJoinCode from '../utils/joinCode'
import { userMembershipsCache } from '../utils/cache'
import { sanitizeInput } from '../utils/sanitize'
import { createLimiter } from '../middleware/rateLimiter'
import { logger } from '../utils/logger'

const joinBookLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many attempts to join book. Please try again later.'
})

const router = Router()

// All routes here require authentication
router.use(requireAuth)

// @route   POST /api/books
// @desc    Create a new Book (and auto-configure its default group conversation)
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, password, setDefault } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter a Book name.' })
    }

    // Generate unique Base30 join code
    const joinCode = await generateJoinCode()

    // Hash password if provided
    let passwordHash: string | null = null
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10)
      passwordHash = await bcrypt.hash(password, salt)
    }

    // Execute in a transaction to guarantee consistency and reduce round-trip database queries
    const result = await prisma.$transaction(async (tx) => {
      // 0. Fetch user defaultBookId
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { defaultBookId: true }
      })

      // 1. Create Book
      const book = await tx.book.create({
        data: {
          name: sanitizeInput(name.trim()),
          joinCode,
          passwordHash,
          creatorId: userId,
        },
      })

      // 2. Add creator as BookMember
      await tx.bookMember.create({
        data: {
          bookId: book.id,
          userId: userId,
          role: 'creator',
        },
      })

      // 3. Create default group Conversation inside the Book
      const conversation = await tx.conversation.create({
        data: {
          bookId: book.id,
          isGroup: true,
        },
      })

      // 4. Add creator to the default group Conversation
      await tx.conversationMember.create({
        data: {
          conversationId: conversation.id,
          userId: userId,
        },
      })

      // 5. Update user default Book inside the same transaction
      if (setDefault || !user?.defaultBookId) {
        await tx.user.update({
          where: { id: userId },
          data: { defaultBookId: book.id },
        })
      }

      return book
    })

    // Invalidate memberships cache for the user
    userMembershipsCache.delete(userId)

    const bookResponse = { ...result } as any
    delete bookResponse.passwordHash

    return res.status(201).json(bookResponse)
  } catch (error) {
    console.error('Create Book error:', error)
    return res.status(500).json({ error: 'Server error generating new Book.' })
  }
})

// @route   GET /api/books
// @desc    List all books the authenticated user is a member of
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    const memberships = await prisma.bookMember.findMany({
      where: { userId },
      select: {
        role: true,
        joinedAt: true,
        book: {
          select: {
            id: true,
            name: true,
            joinCode: true,
            passwordHash: true,
            creator: {
              select: { displayName: true },
            },
            _count: {
              select: { members: true }
            }
          },
        },
      },
    })

    const books = memberships.map((m) => ({
      id: m.book.id,
      name: m.book.name,
      joinCode: m.book.joinCode,
      creatorName: m.book.creator.displayName,
      role: m.role,
      joinedAt: m.joinedAt,
      membersCount: m.book._count.members,
      hasPassword: !!m.book.passwordHash,
    }))

    return res.json(books)
  } catch (error) {
    console.error('List books error:', error)
    return res.status(500).json({ error: 'Server error listing books.' })
  }
})

// @route   POST /api/books/join
// @desc    Join a Book using a Join Code (enforces password and 25-member limit)
router.post('/join', joinBookLimiter, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { joinCode, password } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({ error: 'Please enter a Join Code.' })
    }

    const uppercaseCode = joinCode.trim().toUpperCase()

    // 1. Find book by joinCode
    const book = await prisma.book.findUnique({
      where: { joinCode: uppercaseCode },
      include: {
        members: true
      }
    })

    if (!book) {
      return res.status(400).json({ error: 'No page matches that code.' })
    }

    // 2. Idempotent check: if already a member, return success immediately
    const existingMember = book.members.find((m) => m.userId === userId)
    if (existingMember) {
      const bookResponse = { ...book } as any
      delete bookResponse.passwordHash
      return res.json(bookResponse)
    }

    // 3. Enforce the 25-member limit
    if (book.members.length >= 25) {
      return res.status(400).json({ error: 'This journal has reached its maximum capacity of 25 scribes.' })
    }

    // 4. Verify password if password-protected
    if (book.passwordHash) {
      if (!password) {
        return res.status(400).json({ error: 'This Book is locked. Password required.', isPasswordRequired: true })
      }
      const isMatch = await bcrypt.compare(password, book.passwordHash)
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect password.' })
      }
    }

    // 5. Add user to Book and default group conversation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create BookMember
      const member = await tx.bookMember.create({
        data: {
          bookId: book.id,
          userId,
          role: 'member',
        },
      })

      // Find Book's default group conversation
      const groupConv = await tx.conversation.findFirst({
        where: { bookId: book.id, isGroup: true },
      })

      if (groupConv) {
        // Add user as ConversationMember
        await tx.conversationMember.create({
          data: {
            conversationId: groupConv.id,
            userId,
          },
        })
      }

      return member
    })

    // 6. Update user's default Book if they have none set yet
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user && !user.defaultBookId) {
      await prisma.user.update({
        where: { id: userId },
        data: { defaultBookId: book.id },
      })
    }

    // Invalidate memberships cache for the user
    userMembershipsCache.delete(userId)

    const bookResponse = { ...book } as any
    delete bookResponse.passwordHash

    return res.json(bookResponse)
  } catch (error) {
    console.error('Join Book error:', error)
    return res.status(500).json({ error: 'Server error joining Book.' })
  }
})

// @route   GET /api/books/:bookId
// @desc    Fetch specific Book details (members, channels) if user has access
router.get('/:bookId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { bookId } = req.params as { bookId: string }
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // Verify membership for authorization
    const membership = await prisma.bookMember.findUnique({
      where: {
        bookId_userId: { bookId, userId },
      },
    })

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this Book.' })
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        creator: {
          select: { id: true, displayName: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, email: true },
            },
          },
        },
        conversations: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, displayName: true },
                },
              },
            },
          },
        },
      },
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' })
    }

    // Calculate unreadCount and lastReadAt for each conversation
    const conversationsWithUnread = await Promise.all(
      book.conversations.map(async (conv) => {
        const userMember = conv.members.find((m) => m.userId === userId)
        const lastReadAt = userMember?.lastReadAt || null

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {})
          }
        })

        return {
          ...conv,
          lastReadAt,
          unreadCount
        }
      })
    )

    const bookResponse = { 
      ...book,
      conversations: conversationsWithUnread
    } as any
    delete bookResponse.passwordHash

    return res.json(bookResponse)
  } catch (error) {
    console.error('Get Book detail error:', error)
    return res.status(500).json({ error: 'Server error retrieving Book detail.' })
  }
})

// @route   PATCH /api/books/:bookId
// @desc    Update Book metadata (creator only)
router.patch('/:bookId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { bookId } = req.params as { bookId: string }
    const { name, password } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // Verify creator authorization
    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' })
    }

    if (book.creatorId !== userId) {
      logger.permissionDenied(userId, 'Update Book Settings', bookId)
      return res.status(403).json({ error: 'Access denied. Only the Book creator can edit settings.' })
    }

    const updateData: any = {}
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Book name cannot be empty.' })
      }
      updateData.name = sanitizeInput(name.trim())
    }

    if (password !== undefined) {
      if (password === null || !password.trim()) {
        updateData.passwordHash = null
      } else {
        const salt = await bcrypt.genSalt(10)
        updateData.passwordHash = await bcrypt.hash(password, salt)
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: updateData,
    })

    const bookResponse = { ...updatedBook } as any
    delete bookResponse.passwordHash

    return res.json(bookResponse)
  } catch (error) {
    console.error('Update book error:', error)
    return res.status(500).json({ error: 'Server error updating Book settings.' })
  }
})

// @route   DELETE /api/books/:bookId
// @desc    Delete a Book entirely (creator only)
router.delete('/:bookId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { bookId } = req.params as { bookId: string }
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // Verify creator authorization
    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' })
    }

    if (book.creatorId !== userId) {
      logger.permissionDenied(userId, 'Delete Book', bookId)
      return res.status(403).json({ error: 'Access denied. Only the Book creator can delete this Book.' })
    }

    // Cascading deletes on memberships, conversations, messages are handled at db key constraint levels
    await prisma.book.delete({ where: { id: bookId } })

    return res.json({ message: 'Book deleted successfully.' })
  } catch (error) {
    console.error('Delete Book error:', error)
    return res.status(500).json({ error: 'Server error deleting Book.' })
  }
})

// @route   DELETE /api/books/:bookId/members/:targetUserId
// @desc    Remove a member from the Book (creator only)
router.delete('/:bookId/members/:targetUserId', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { bookId, targetUserId } = req.params as { bookId: string; targetUserId: string }
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // 1. Fetch book details
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found.' })
    }

    // 2. Verify requester is the creator of the book
    if (book.creatorId !== userId) {
      logger.permissionDenied(userId, 'Remove Book Member', bookId)
      return res.status(403).json({ error: 'Access denied. Only the Book creator can remove members.' })
    }

    // 3. Block self-removal (creator cannot delete themselves)
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'As the Book creator, you cannot remove yourself from the ledger.' })
    }

    // 4. Perform removal in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete BookMember record
      await tx.bookMember.delete({
        where: {
          bookId_userId: { bookId, userId: targetUserId }
        }
      })

      // Get conversations of the book
      const conversations = await tx.conversation.findMany({
        where: { bookId }
      })
      const conversationIds = conversations.map((c) => c.id)

      // Remove from conversation member lists
      await tx.conversationMember.deleteMany({
        where: {
          conversationId: { in: conversationIds },
          userId: targetUserId
        }
      })

      // Set defaultBookId to null if this book was their default
      const targetUserObj = await tx.user.findUnique({
        where: { id: targetUserId }
      })
      if (targetUserObj && targetUserObj.defaultBookId === bookId) {
        await tx.user.update({
          where: { id: targetUserId },
          data: { defaultBookId: null }
        })
      }
    })

    return res.json({ message: 'Member removed successfully.' })
  } catch (error) {
    console.error('Remove member error:', error)
    return res.status(500).json({ error: 'Server error removing member from Book.' })
  }
})

export default router
