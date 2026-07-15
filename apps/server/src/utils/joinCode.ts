import prisma from '../prisma/client'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ234567' // Base30 (excluding O, I, 0, 1, 8, 9 to avoid visual confusion)

export const generateJoinCode = async (): Promise<string> => {
  let attempts = 0
  while (attempts < 10) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }

    // Check database for unique code constraint
    const existing = await prisma.book.findUnique({ where: { joinCode: code } })
    if (!existing) {
      return code
    }
    attempts++
  }
  throw new Error('Failed to generate unique join code.')
}

export default generateJoinCode
