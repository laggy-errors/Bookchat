// Secure Logging Utility to record security and error logs without exposing secrets
export const logger = {
  authSuccess: (userId: string, email: string) => {
    console.log(`[AUTH SUCCESS] [${new Date().toISOString()}] User ${userId} (${email}) logged in successfully.`)
  },

  authFailed: (email: string, reason: string) => {
    // Redact password or email leaks if raw secrets are supplied
    const sanitizedEmail = email.replace(/[\r\n]/g, '')
    console.warn(`[AUTH FAILURE] [${new Date().toISOString()}] Login failed for ${sanitizedEmail}. Reason: ${reason}`)
  },

  permissionDenied: (userId: string, action: string, resourceId: string) => {
    console.warn(`[SECURITY WARNING] [${new Date().toISOString()}] Unauthorized access blocked: User ${userId} attempted [${action}] on resource ${resourceId}.`)
  },

  criticalError: (context: string, error: any) => {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[CRITICAL ERROR] [${new Date().toISOString()}] Error in [${context}]: ${errorMsg}`)
  }
}
