/**
 * parseCookies
 * Parses a raw HTTP Cookie header string into a key-value record.
 * Used for Socket.IO handshake middleware where Express cookie-parser is not available.
 */
export function parseCookies(cookieStr: string | undefined): Record<string, string> {
  if (!cookieStr) return {}
  return Object.fromEntries(
    cookieStr.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, decodeURIComponent(v.join('='))]
    })
  )
}

