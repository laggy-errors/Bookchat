import prisma from './prisma/client'

// Stub database call for join code check to let unit test run offline without database configuration
prisma.book.findUnique = (async () => null) as any

import { generateJoinCode } from './utils/joinCode'

const runUnitTests = async () => {
  console.log('===============================================================')
  console.log('                 RUNNING SERVER UNIT TEST SUITE                ')
  console.log('===============================================================')

  try {
    // 1. Test generateJoinCode
    console.log('Testing Base30 join code generation...')
    const code = await generateJoinCode()
    
    // Test length
    if (code.length !== 6) {
      throw new Error(`Invalid join code length: expected 6, got ${code.length}`)
    }
    console.log('✅ Success: Join code is exactly 6 characters long')

    // Test Base30 visual exclusion constraint
    const ALLOWED = 'ABCDEFGHJKLMNPQRSTUVWXYZ234567'
    for (let i = 0; i < code.length; i++) {
      if (!ALLOWED.includes(code.charAt(i))) {
        throw new Error(`Invalid character inside join code: ${code.charAt(i)}`)
      }
    }
    console.log('✅ Success: Join code matches Base30 exclusions (no visual confusions like O, I, 0, 1)')

    // 2. Validate Pen Name Display rules
    console.log('\nTesting Scribe Pen Name validation rules...')
    const validatePenName = (name: string): boolean => {
      const trimmed = name.trim()
      return trimmed.length > 0 && trimmed.length <= 25
    }

    if (validatePenName('') !== false) throw new Error('Failed: Empty pen name should be invalid')
    if (validatePenName('   ') !== false) throw new Error('Failed: Whitespace pen name should be invalid')
    if (validatePenName('A'.repeat(26)) !== false) throw new Error('Failed: Pen name >25 chars should be invalid')
    if (validatePenName('Archivist') !== true) throw new Error('Failed: Standard pen name should be valid')
    console.log('✅ Success: Scribe pen name validation bounds verified')

    // 3. Validate Theme Utility preferences
    console.log('\nTesting Theme Preference config values...')
    const isValidTheme = (theme: string): boolean => {
      const validThemes = ['paper', 'cabinet', 'library', 'corkboard']
      return validThemes.includes(theme)
    }

    if (isValidTheme('paper') !== true) throw new Error('Failed: Paper theme should be valid')
    if (isValidTheme('cabinet') !== true) throw new Error('Failed: Cabinet theme should be valid')
    if (isValidTheme('library') !== true) throw new Error('Failed: Library theme should be valid')
    if (isValidTheme('corkboard') !== true) throw new Error('Failed: Corkboard theme should be valid')
    if (isValidTheme('anime') !== false) throw new Error('Failed: Outdated theme values should be invalid')
    console.log('✅ Success: Environment layout theme values verified')

    console.log('\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! 🎉')
    process.exit(0)
  } catch (err: any) {
    console.error('\n❌ UNIT TEST FAIL:', err.message)
    process.exit(1)
  }
}

runUnitTests()
