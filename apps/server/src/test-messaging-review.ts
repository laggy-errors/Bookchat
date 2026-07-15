import { execSync } from 'child_process'

const tests = [
  'src/test-unit.ts',
  'src/test-api-integration.ts',
  'src/test-security-pen.ts',
  'src/test-socket-reliability.ts',
  'src/test-socket.ts',
  'src/test-messaging.ts',
  'src/test-pagination.ts',
  'src/test-typing.ts',
  'src/test-presence.ts',
  'src/test-unread.ts',
  'src/test-search.ts'
]

console.log('===============================================================')
console.log('   RUNNING MASTER MESSAGING SYSTEM INTEGRATION TEST SUITES     ')
console.log('===============================================================')

tests.forEach((test, idx) => {
  console.log(`\n[${idx + 1}/${tests.length}] Executing: ${test}...`)
  try {
    const output = execSync(`npx tsx ${test}`, { encoding: 'utf-8' })
    console.log(output)
  } catch (err: any) {
    console.error(`❌ Test Suite Failed: ${test}`)
    console.error(err.stdout || err.message)
    process.exit(1)
  }
})

console.log('===============================================================')
console.log('  🎉 SUCCESS: ALL MESSAGING INTEGRATION TESTS PASSED CLEANLY!  ')
console.log('===============================================================')
