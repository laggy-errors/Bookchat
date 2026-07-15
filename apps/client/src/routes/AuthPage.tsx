import React, { useState } from 'react'
import { API_BASE_URL } from '../lib/apiClient'

interface AuthPageProps {
  onSuccess: (user: any) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
      } else {
        setIsOpening(true)
        setTimeout(() => onSuccess(data), 1100)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the ledger.')
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    alert('Forgot Passcode: A letter has been sent to your supervisor (Placeholder flow).')
  }

  return (
    <>
      {/* Google Font: Cormorant Garamond */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');

        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* Leather texture noise overlay */
        .leather-bg {
          background-color: #1e1208;
          background-image:
            radial-gradient(ellipse at center, #2e1c10 0%, #160d06 85%);
          position: relative;
        }
        .leather-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }
        /* Vignette */
        .leather-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* Book cover leather texture */
        .book-cover {
          background-color: #5c3a24;
          background-image:
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n2)' opacity='0.07'/%3E%3C/svg%3E"),
            linear-gradient(160deg, #6a4230 0%, #522e1a 50%, #3d2010 100%);
        }

        /* Inner inset border */
        .book-inner-border {
          position: absolute;
          inset: 20px;
          border: 1px solid rgba(255,230,190,0.12);
          border-radius: 8px;
          pointer-events: none;
        }

        /* Parchment panel */
        .parchment {
          background: #f0e6d0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)' opacity='0.04'/%3E%3C/svg%3E");
        }

        /* Input gold glow on focus */
        .ledger-input:focus {
          outline: none;
          border-color: #c89b5a !important;
          box-shadow: 0 0 0 3px rgba(200,155,90,0.18), inset 0 1px 3px rgba(0,0,0,0.15);
        }

        /* Ornamental divider SVG line */
        .ornament-line {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
          color: #b08d57;
          opacity: 0.5;
        }
        .ornament-line::before,
        .ornament-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: currentColor;
          opacity: 0.5;
        }

        /* Book open animation */
        .book-wrapper {
          transition: transform 1.1s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease;
          transform-style: preserve-3d;
        }
        .book-wrapper.opening {
          transform: perspective(1200px) rotateY(-8deg) scale(0.96);
          opacity: 0.85;
        }

        /* Page-behind reveal */
        .page-behind {
          transition: transform 1.1s cubic-bezier(0.4,0,0.2,1);
        }
        .page-behind.opening {
          transform: translateX(8px);
        }

        /* Submit button hover */
        .open-book-btn {
          transition: background 200ms, transform 200ms, box-shadow 200ms;
        }
        .open-book-btn:hover:not(:disabled) {
          background: #7a5230 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.4) !important;
        }
        .open-book-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        /* Tab underline animation */
        .tab-underline {
          position: absolute;
          bottom: -2px;
          height: 2px;
          background: #c9a96e;
          border-radius: 1px;
          transition: left 300ms ease, width 300ms ease;
        }
      `}</style>

      {/* ── Page Background ── */}
      <div
        className="leather-bg flex items-center justify-center min-h-screen w-full overflow-hidden"
        style={{ position: 'relative' }}
      >
        {/* ── Opening ledger tab (appears at top when opening) ── */}
        <div
          style={{
            position: 'absolute',
            top: isOpening ? '10%' : '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            transition: 'top 0.7s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            className="parchment cg"
            style={{
              padding: '8px 24px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#7a5a34',
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              border: '1px solid #d4b88a',
              whiteSpace: 'nowrap',
              fontStyle: 'italic',
            }}
          >
            📖 Opening ledger...
          </div>
        </div>

        {/* ── Book ambient shadow ── */}
        <div
          style={{
            position: 'absolute',
            width: '310px',
            height: '480px',
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '16px',
            filter: 'blur(40px)',
            transform: 'translateY(24px)',
            zIndex: 1,
          }}
        />

        {/* ── Page Stack visible behind cover ── */}
        <div
          className={`page-behind ${isOpening ? 'opening' : ''}`}
          style={{
            position: 'absolute',
            width: '282px',
            height: '452px',
            background: 'linear-gradient(to right, #e8dcc8, #f0e6d4)',
            borderRadius: '4px 12px 12px 4px',
            zIndex: 2,
            boxShadow: 'inset -3px 0 8px rgba(0,0,0,0.12)',
          }}
        >
          {/* Page stack lines */}
          {[6, 12, 18].map(offset => (
            <div
              key={offset}
              style={{
                position: 'absolute',
                right: -offset,
                top: offset,
                bottom: offset,
                width: '6px',
                background: `rgba(0,0,0,${0.04 + offset * 0.005})`,
                borderRadius: '0 3px 3px 0',
              }}
            />
          ))}
          {/* Opening state content */}
          {isOpening && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="cg" style={{ color: '#8a6a3c', fontSize: '15px', fontStyle: 'italic', fontWeight: 600 }}>
                Preparing your records...
              </span>
            </div>
          )}
        </div>

        {/* ── Main Book Cover ── */}
        <div
          className={`book-cover book-wrapper ${isOpening ? 'opening' : ''}`}
          style={{
            position: 'relative',
            width: '290px',
            borderRadius: '4px 14px 14px 4px',
            zIndex: 10,
            boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -2px 0 rgba(0,0,0,0.25)',
            overflow: 'visible',
          }}
        >
          {/* Spine */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '16px',
            background: 'linear-gradient(to right, #2a1608, #3d2212)',
            borderRadius: '4px 0 0 4px',
            boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.3)',
            zIndex: 2,
          }}>
            {/* Spine gold lines */}
            <div style={{ position: 'absolute', top: '15%', left: '4px', right: '4px', height: '1px', background: 'rgba(200,155,90,0.25)' }} />
            <div style={{ position: 'absolute', bottom: '15%', left: '4px', right: '4px', height: '1px', background: 'rgba(200,155,90,0.25)' }} />
          </div>

          {/* Inset border */}
          <div className="book-inner-border" style={{ left: '36px' }} />

          {/* Cover content area */}
          <div style={{ paddingLeft: '20px', paddingRight: '18px', paddingTop: '36px', paddingBottom: '28px' }}>

            {/* ── Book Icon + Title ── */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '32px', lineHeight: 1, marginBottom: '10px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                📖
              </div>
              <h1
                className="cg"
                style={{
                  fontSize: '40px',
                  fontWeight: 700,
                  color: '#d4a96a',
                  letterSpacing: '1.5px',
                  margin: 0,
                  lineHeight: 1.1,
                  textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,200,120,0.2)',
                }}
              >
                BookChat
              </h1>
              <p
                className="cg"
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: '#c9a96e',
                  opacity: 0.85,
                  margin: '8px 0 0 0',
                  letterSpacing: '0.3px',
                }}
              >
                Volume IV — Active Dialogues
              </p>

              {/* Ornamental divider */}
              <div style={{ margin: '14px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.5 }}>
                <div style={{ height: '1px', width: '40px', background: '#c9a96e' }} />
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path d="M7 0 C5 3 1 4 0 5 C1 6 5 7 7 10 C9 7 13 6 14 5 C13 4 9 3 7 0Z" fill="#c9a96e" opacity="0.8"/>
                </svg>
                <div style={{ height: '1px', width: '40px', background: '#c9a96e' }} />
              </div>
            </div>

            {/* ── Parchment Form Panel ── */}
            <div
              className="parchment"
              style={{
                marginTop: '18px',
                borderRadius: '6px',
                padding: '20px 18px 18px',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.14), 0 2px 10px rgba(0,0,0,0.3)',
                border: '1px solid rgba(180,150,100,0.3)',
              }}
            >
              {/* Form title */}
              <h2
                className="cg"
                style={{
                  fontSize: '19px',
                  fontWeight: 600,
                  color: '#3a2410',
                  textAlign: 'center',
                  margin: '0 0 4px',
                  letterSpacing: '0.2px',
                }}
              >
                {isLogin ? 'Sign in to the ledger' : 'Register your name'}
              </h2>

              {/* Ornamental sub-divider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.4, marginBottom: '14px' }}>
                <div style={{ height: '1px', width: '28px', background: '#8a6a3c' }} />
                <svg width="10" height="7" viewBox="0 0 10 7" fill="none">
                  <path d="M5 0 C4 2 1 3 0 3.5 C1 4 4 5 5 7 C6 5 9 4 10 3.5 C9 3 6 2 5 0Z" fill="#8a6a3c"/>
                </svg>
                <div style={{ height: '1px', width: '28px', background: '#8a6a3c' }} />
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    background: 'rgba(180,60,40,0.08)',
                    border: '1px solid rgba(180,60,40,0.22)',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <span style={{ color: '#b84c38', fontSize: '12px' }}>⚠</span>
                  <span className="cg" style={{ color: '#b84c38', fontSize: '13px', fontStyle: 'italic' }}>
                    {error}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Email input */}
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9a7a50',
                    fontSize: '13px',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}>✉</span>
                  <input
                    type="email"
                    id="auth-email"
                    placeholder="Email Address"
                    value={email}
                    disabled={loading || isOpening}
                    onChange={e => setEmail(e.target.value)}
                    className="ledger-input"
                    aria-label="Email address"
                    autoComplete="email"
                    required
                    style={{
                      width: '100%',
                      height: '40px',
                      background: 'rgba(255,255,255,0.72)',
                      border: '1px solid rgba(160,120,70,0.25)',
                      borderRadius: '4px',
                      paddingLeft: '32px',
                      paddingRight: '10px',
                      color: '#2e1a0a',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Password input */}
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9a7a50',
                    fontSize: '13px',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    placeholder="Passcode"
                    value={password}
                    disabled={loading || isOpening}
                    onChange={e => setPassword(e.target.value)}
                    className="ledger-input"
                    aria-label="Passcode"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    style={{
                      width: '100%',
                      height: '40px',
                      background: 'rgba(255,255,255,0.72)',
                      border: '1px solid rgba(160,120,70,0.25)',
                      borderRadius: '4px',
                      paddingLeft: '32px',
                      paddingRight: '38px',
                      color: '#2e1a0a',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9a7a50',
                      fontSize: '13px',
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>

                {/* Confirm password (signup only) */}
                {!isLogin && (
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '11px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9a7a50',
                      fontSize: '13px',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}>🔒</span>
                    <input
                      type="password"
                      id="auth-confirm-password"
                      placeholder="Confirm Passcode"
                      value={confirmPassword}
                      disabled={loading || isOpening}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="ledger-input"
                      aria-label="Confirm passcode"
                      autoComplete="new-password"
                      required
                      style={{
                        width: '100%',
                        height: '40px',
                        background: 'rgba(255,255,255,0.72)',
                        border: '1px solid rgba(160,120,70,0.25)',
                        borderRadius: '4px',
                        paddingLeft: '32px',
                        paddingRight: '10px',
                        color: '#2e1a0a',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || isOpening}
                  className="open-book-btn cg"
                  aria-label={isLogin ? 'Sign into account' : 'Register account'}
                  style={{
                    width: '100%',
                    height: '44px',
                    marginTop: '6px',
                    background: '#5a3520',
                    border: '1px solid rgba(200,155,90,0.2)',
                    borderRadius: '5px',
                    color: '#e8c88a',
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    cursor: loading || isOpening ? 'not-allowed' : 'pointer',
                    opacity: loading || isOpening ? 0.65 : 1,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  <span>📖</span>
                  <span>{loading ? 'Opening...' : 'Open Book'}</span>
                </button>
              </form>

              {/* OR divider */}
              <div className="ornament-line" style={{ margin: '14px 0 12px', fontSize: '11px', color: '#9a7a50' }}>
                or
              </div>

              {/* Toggle login/signup */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  disabled={loading || isOpening}
                  onClick={() => { setIsLogin(!isLogin); setError(null) }}
                  aria-label={isLogin ? 'Switch to registration' : 'Switch to sign in'}
                  className="cg"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: loading || isOpening ? 'not-allowed' : 'pointer',
                    color: '#7a5a34',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    opacity: loading || isOpening ? 0.5 : 1,
                    padding: '2px 0',
                    textDecoration: 'none',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                  onMouseEnter={e => { if (!loading && !isOpening) (e.target as HTMLElement).style.color = '#a07840' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = '#7a5a34' }}
                >
                  ✏ {isLogin ? 'Write a new story (Register)' : 'Already in our records? (Login)'}
                </button>

                <button
                  type="button"
                  disabled={loading || isOpening}
                  onClick={handleForgotPassword}
                  aria-label="Forgot passcode"
                  className="cg"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: loading || isOpening ? 'not-allowed' : 'pointer',
                    color: '#7a5a34',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    opacity: loading || isOpening ? 0.5 : 1,
                    padding: '4px 0 0',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                  onMouseEnter={e => { if (!loading && !isOpening) (e.target as HTMLElement).style.color = '#a07840' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = '#7a5a34' }}
                >
                  🔑 Forgot passcode?
                </button>
              </div>
            </div>
            {/* ── End Parchment Panel ── */}

          </div>
          {/* End cover content */}
        </div>
        {/* ── End Main Book Cover ── */}

      </div>
    </>
  )
}

export default AuthPage
