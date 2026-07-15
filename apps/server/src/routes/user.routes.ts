import { Router, Response } from 'express'
import requireAuth, { AuthenticatedRequest } from '../middleware/requireAuth'
import prisma from '../prisma/client'
import { sanitizeInput } from '../utils/sanitize'

const router = Router()

// @route   PATCH /api/users/me
// @desc    Update user profile details
router.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { displayName, themePreference, defaultBookId, hasSeenPreamble, hasSeenTour } = req.body
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' })
    }

    const updateData: any = {}
    if (displayName !== undefined) {
      const trimmedName = displayName.trim()
      if (!trimmedName) {
        return res.status(400).json({ error: 'Display name cannot be empty.' })
      }
      updateData.displayName = sanitizeInput(trimmedName)
    }
    if (themePreference !== undefined) {
      updateData.themePreference = themePreference
    }
    if (defaultBookId !== undefined) {
      updateData.defaultBookId = defaultBookId
    }
    if (hasSeenPreamble !== undefined) {
      updateData.hasSeenPreamble = hasSeenPreamble
    }
    if (hasSeenTour !== undefined) {
      updateData.hasSeenTour = hasSeenTour
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        themePreference: true,
        hasSeenPreamble: true,
        hasSeenTour: true,
        defaultBookId: true
      }
    })

    return res.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({ error: 'Server error updating user profile.' })
  }
})

export default router
