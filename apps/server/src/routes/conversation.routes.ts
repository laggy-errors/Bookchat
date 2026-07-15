import { Router, Response } from 'express'
import prisma from '../prisma/client'
import requireAuth, { AuthenticatedRequest } from '../middleware/requireAuth'
import { createLimiter } from '../middleware/rateLimiter'

const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'Too many search requests. Please throttle your queries.'
})

const router = Router()

// All routes require auth
router.use(requireAuth)

// @route   GET /api/conversations/:conversationId/messages
// @desc    Fetch chronological message history for a conversation
router.get('/:conversationId/messages', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { conversationId } = req.params as { conversationId: string }
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // Find the conversation and confirm book membership authorization
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        book: {
          include: {
            members: true
          }
        }
      }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    const isMember = conversation.book.members.some((m) => m.userId === userId)
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this journal.' })
    }

    const { cursor, limit } = req.query
    const limitVal = parseInt(limit as string) || 30

    const queryOptions: any = {
      where: { conversationId },
      take: limitVal,
      include: {
        sender: {
          select: { id: true, displayName: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }

    if (cursor) {
      queryOptions.cursor = { id: cursor as string }
      queryOptions.skip = 1
    }

    const messages = await prisma.message.findMany(queryOptions)
    
    // If we fetched the limit amount, set the oldest message id in this batch as the nextCursor
    const nextCursor = messages.length === limitVal ? messages[messages.length - 1].id : null

    // Reverse messages to chronological order (asc) for client log thread views
    const chronologicalMessages = [...messages].reverse()

    return res.json({
      messages: chronologicalMessages,
      nextCursor
    })
  } catch (error) {
    console.error('Fetch messages error:', error)
    return res.status(500).json({ error: 'Server error retrieving messages.' })
  }
})

// @route   POST /api/conversations/:conversationId/read
// @desc    Mark conversation messages up to now as read
router.post('/:conversationId/read', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { conversationId } = req.params as { conversationId: string }
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    // Check if user is conversation member
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    })

    if (!member) {
      // Find conversation to verify book member access
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { book: { include: { members: true } } }
      })
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found.' })
      }
      const isBookMember = conversation.book.members.some(m => m.userId === userId)
      if (!isBookMember) {
        return res.status(403).json({ error: 'Access denied.' })
      }
      
      // Create ConversationMember entry
      await prisma.conversationMember.create({
        data: {
          conversationId,
          userId,
          lastReadAt: new Date()
        }
      })
    } else {
      // Update lastReadAt
      await prisma.conversationMember.update({
        where: { id: member.id },
        data: { lastReadAt: new Date() }
      })
    }

    return res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    return res.status(500).json({ error: 'Server error updating read status.' })
  }
})

// @route   GET /api/conversations/:conversationId/search
// @desc    Perform full-text search on message logs inside a conversation
router.get('/:conversationId/search', searchLimiter, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { conversationId } = req.params as { conversationId: string }
    const { query, page, limit } = req.query
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    if (!query || !(query as string).trim()) {
      return res.status(400).json({ error: 'Search query is required.' })
    }

    // Verify membership access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { book: { include: { members: true } } }
    })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    const isMember = conversation.book.members.some((m) => m.userId === userId)
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied.' })
    }

    const pageVal = parseInt(page as string) || 1
    const limitVal = parseInt(limit as string) || 10
    const skipVal = (pageVal - 1) * limitVal

    const queryStr = (query as string).trim()

    // Query messages matching case-insensitive text
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        content: {
          contains: queryStr,
          mode: 'insensitive'
        }
      },
      include: {
        sender: {
          select: { id: true, displayName: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limitVal,
      skip: skipVal
    })

    const totalCount = await prisma.message.count({
      where: {
        conversationId,
        content: {
          contains: queryStr,
          mode: 'insensitive'
        }
      }
    })

    return res.json({
      messages,
      totalCount,
      page: pageVal,
      totalPages: Math.ceil(totalCount / limitVal)
    })
  } catch (error) {
    console.error('Search messages error:', error)
    return res.status(500).json({ error: 'Server error searching messages.' })
  }
})

export default router
