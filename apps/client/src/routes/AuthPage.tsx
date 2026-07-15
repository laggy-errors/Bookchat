import React, { useState, useRef } from 'react'
import { API_BASE_URL } from '../lib/apiClient'

interface AuthPageProps {
  onSuccess: (user: any) => void
}

/* ─────────────────────────────────────────────
   Inline SVG Noise — loaded once as data-URI
───────────────────────────────────────────── */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin]             = useState(true)
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]   = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [isOpening, setIsOpening]         = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)

  /* ── Auth logic (unchanged) ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) { setError('Please enter a valid email address.'); setLoading(false); return }
    if (!isLogin && password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const res  = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedEmail, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false) }
      else { setIsOpening(true); setTimeout(() => onSuccess(data), 1100) }
    } catch (err) {
      console.error(err)
      setError('Unable to connect to the ledger.')
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    alert('A password reset link would be sent to your email.')
  }

  const switchMode = () => { setIsLogin(v => !v); setError(null) }

  /* ─────────────────────────────
     Render
  ───────────────────────────── */
  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Cormorant:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bc-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', 'Cormorant', Georgia, serif;
          background-color: #1a0e07;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* ── Leather background ── */
        .bc-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            ${NOISE_SVG},
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.018) 2px,
              rgba(0,0,0,0.018) 4px
            );
          background-size: 300px 300px, 4px 4px;
          opacity: 0.55;
          pointer-events: none;
        }

        /* ── Radial vignette ── */
        .bc-page::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 75% 65% at 50% 48%,
            transparent 0%,
            rgba(5,2,0,0.45) 75%,
            rgba(5,2,0,0.82) 100%
          );
          pointer-events: none;
        }

        /* ── Card ── */
        .bc-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 820px;
          border-radius: 16px;
          padding: 64px 56px 56px;
          background:
            ${NOISE_SVG},
            linear-gradient(160deg, #5e3b22 0%, #4a2c16 38%, #3d2410 65%, #4a2d16 100%);
          background-size: 280px 280px, 100% 100%;
          background-blend-mode: multiply, normal;
          box-shadow:
            0 2px 0 rgba(255,220,160,0.06) inset,
            0 -3px 0 rgba(0,0,0,0.35) inset,
            1px 0 0 rgba(255,220,160,0.04) inset,
            -1px 0 0 rgba(0,0,0,0.2) inset,
            0 50px 100px rgba(0,0,0,0.55),
            0 20px 40px rgba(0,0,0,0.4),
            0 5px 12px rgba(0,0,0,0.35);
          transition: transform 1s cubic-bezier(0.4,0,0.2,1), opacity 0.9s ease;
        }

        .bc-card.is-opening {
          transform: scale(0.97) rotateY(-4deg);
          opacity: 0.7;
        }

        /* ── Inner inset border ── */
        .bc-card::before {
          content: '';
          position: absolute;
          inset: 22px;
          border: 1px solid rgba(255, 225, 175, 0.13);
          border-radius: 8px;
          pointer-events: none;
        }

        /* ── Corner ornaments (top-right & bottom-right) ── */
        .bc-card::after {
          content: '';
          position: absolute;
          top: 14px; right: 14px;
          width: 22px; height: 22px;
          border-top: 1.5px solid rgba(200,160,90,0.35);
          border-right: 1.5px solid rgba(200,160,90,0.35);
          border-radius: 0 4px 0 0;
          pointer-events: none;
        }

        /* extra corner bottom-left */
        .bc-card-corner-bl,
        .bc-card-corner-tr {
          position: absolute;
          width: 22px; height: 22px;
          border-color: rgba(200,160,90,0.35);
          border-style: solid;
          pointer-events: none;
        }
        .bc-card-corner-bl {
          bottom: 14px; left: 14px;
          border-width: 0 0 1.5px 1.5px;
          border-radius: 0 0 0 4px;
        }
        .bc-card-corner-tr {
          top: 14px; left: 14px;
          border-width: 1.5px 0 0 1.5px;
          border-radius: 4px 0 0 0;
        }

        /* ── Title ── */
        .bc-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(52px, 8vw, 78px);
          font-weight: 700;
          color: #f5dfbe;
          letter-spacing: 1px;
          line-height: 1;
          text-align: center;
          text-shadow:
            0 1px 0 rgba(255,220,160,0.18),
            0 3px 12px rgba(0,0,0,0.5),
            0 6px 24px rgba(0,0,0,0.3);
          user-select: none;
        }

        /* ── Subtitle ── */
        .bc-subtitle {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(18px, 2.5vw, 26px);
          font-weight: 300;
          font-style: italic;
          color: #e0c7a0;
          opacity: 0.82;
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* ── Tab bar ── */
        .bc-tabs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }
        .bc-tab-sep {
          color: rgba(200,165,100,0.45);
          font-size: 16px;
          user-select: none;
        }
        .bc-tab {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.3px;
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding-bottom: 5px;
          transition: color 250ms ease, opacity 250ms ease;
          user-select: none;
        }
        .bc-tab.active {
          color: #f5dfbe;
        }
        .bc-tab.inactive {
          color: rgba(200,165,100,0.55);
        }
        .bc-tab.inactive:hover {
          color: rgba(220,185,130,0.8);
        }
        .bc-tab::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1.5px;
          background: #c9a96e;
          border-radius: 1px;
          transform: scaleX(0);
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1);
          transform-origin: left;
        }
        .bc-tab.active::after {
          transform: scaleX(1);
        }

        /* ── Form ── */
        .bc-form {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        /* ── Field label ── */
        .bc-label {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 2.2px;
          text-transform: uppercase;
          color: #c7a37d;
          margin-bottom: 8px;
          display: block;
          user-select: none;
        }

        /* ── Input ── */
        .bc-input {
          width: 100%;
          height: 48px;
          background: rgba(30, 12, 4, 0.72);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 5px;
          padding: 0 40px 0 14px;
          color: #f2e3d0;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          font-weight: 400;
          letter-spacing: 0.2px;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(0,0,0,0.2);
          transition: border-color 220ms ease, box-shadow 220ms ease;
          outline: none;
        }
        .bc-input::placeholder {
          color: rgba(220,190,145,0.3);
          font-style: italic;
        }
        .bc-input:focus {
          border-color: rgba(200,155,90,0.55);
          box-shadow:
            inset 0 2px 6px rgba(0,0,0,0.3),
            0 0 0 3px rgba(200,155,90,0.12),
            0 0 12px rgba(200,155,90,0.08);
        }
        .bc-input:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── Input wrapper (for eye icon) ── */
        .bc-input-wrap {
          position: relative;
        }
        .bc-input-wrap .bc-input {
          padding-right: 42px;
        }
        .bc-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(200,160,90,0.5);
          font-size: 14px;
          line-height: 1;
          padding: 4px;
          transition: color 200ms;
          display: flex;
          align-items: center;
        }
        .bc-eye:hover { color: rgba(200,160,90,0.85); }

        /* ── Open the Book button ── */
        .bc-btn-primary {
          width: 100%;
          height: 56px;
          background: linear-gradient(180deg, #d4a55e 0%, #c08940 60%, #b57c32 100%);
          border: none;
          border-radius: 6px;
          color: #2e1608;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.4px;
          cursor: pointer;
          box-shadow:
            0 1px 0 rgba(255,220,150,0.3) inset,
            0 -2px 0 rgba(0,0,0,0.25) inset,
            0 8px 20px rgba(0,0,0,0.35),
            0 3px 8px rgba(0,0,0,0.25);
          transition: transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease, background 220ms ease, opacity 220ms ease;
          position: relative;
          overflow: hidden;
        }
        .bc-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          border-radius: inherit;
          pointer-events: none;
        }
        .bc-btn-primary:hover:not(:disabled) {
          background: linear-gradient(180deg, #dbb068 0%, #ca974a 60%, #be8438 100%);
          transform: translateY(-2px);
          box-shadow:
            0 1px 0 rgba(255,220,150,0.35) inset,
            0 -2px 0 rgba(0,0,0,0.25) inset,
            0 12px 28px rgba(0,0,0,0.4),
            0 5px 12px rgba(0,0,0,0.3);
        }
        .bc-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .bc-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Google button ── */
        .bc-btn-google {
          width: 100%;
          height: 48px;
          background: rgba(20, 8, 2, 0.55);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 6px;
          color: #d4b88a;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow:
            0 1px 0 rgba(255,210,140,0.05) inset,
            0 3px 8px rgba(0,0,0,0.2);
          transition: background 220ms ease, border-color 220ms ease, transform 220ms ease;
        }
        .bc-btn-google:hover:not(:disabled) {
          background: rgba(35, 15, 5, 0.72);
          border-color: rgba(200,160,90,0.22);
          transform: translateY(-1px);
        }
        .bc-btn-google:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* Google G icon */
        .bc-google-icon {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(200,165,100,0.18);
          border: 1px solid rgba(200,165,100,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #d4b070;
          flex-shrink: 0;
          font-family: Georgia, serif;
        }

        /* ── Error banner ── */
        .bc-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(160,45,30,0.12);
          border: 1px solid rgba(180,60,40,0.28);
          border-radius: 5px;
          padding: 10px 14px;
          color: #d47a65;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14.5px;
          font-style: italic;
          letter-spacing: 0.1px;
        }

        /* ── Switch mode links ── */
        .bc-link {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14.5px;
          font-style: italic;
          color: rgba(195,155,95,0.7);
          letter-spacing: 0.1px;
          padding: 0;
          transition: color 200ms;
          line-height: 1.4;
        }
        .bc-link:hover:not(:disabled) { color: rgba(215,175,115,0.95); }
        .bc-link:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Decorative rule ── */
        .bc-rule {
          display: flex;
          align-items: center;
          gap: 14px;
          color: rgba(180,145,85,0.3);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .bc-rule::before, .bc-rule::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(180,145,85,0.2);
        }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          .bc-card { padding: 44px 28px 44px; border-radius: 12px; }
          .bc-card::before { inset: 14px; }
        }
        @media (max-width: 420px) {
          .bc-card { padding: 36px 20px 36px; border-radius: 10px; }
        }
      `}</style>

      {/* ── Page ── */}
      <div className="bc-page">

        {/* ── Opening overlay ── */}
        {isOpening && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'radial-gradient(ellipse at center, #2a1608 0%, #0a0502 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'bcFadeIn 0.6s ease forwards',
          }}>
            <style>{`@keyframes bcFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '22px', fontStyle: 'italic', fontWeight: 300,
              color: '#c9a96e', letterSpacing: '1px',
            }}>
              📖 &nbsp;Opening ledger...
            </p>
          </div>
        )}

        {/* ── Card ── */}
        <div className={`bc-card${isOpening ? ' is-opening' : ''}`}>
          {/* Corner ornaments */}
          <div className="bc-card-corner-bl" />
          <div className="bc-card-corner-tr" />

          {/* ────── HEADER ────── */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 className="bc-title">BookChat</h1>

            <p className="bc-subtitle" style={{ marginTop: '16px' }}>
              A place to write, together.
            </p>

            {/* ── Tabs ── */}
            <div className="bc-tabs" style={{ marginTop: '36px' }}>
              <button
                className={`bc-tab ${isLogin ? 'active' : 'inactive'}`}
                onClick={() => { setIsLogin(true); setError(null) }}
                disabled={loading || isOpening}
                aria-label="Sign in tab"
              >
                Sign In
              </button>
              <span className="bc-tab-sep">·</span>
              <button
                className={`bc-tab ${!isLogin ? 'active' : 'inactive'}`}
                onClick={() => { setIsLogin(false); setError(null) }}
                disabled={loading || isOpening}
                aria-label="Sign up tab"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* ────── FORM ────── */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="bc-form">

              {/* Error */}
              {error && (
                <div className="bc-error" style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* EMAIL */}
              <div style={{ marginBottom: '20px' }}>
                <label className="bc-label" htmlFor="auth-email">Email</label>
                <input
                  ref={emailRef}
                  className="bc-input"
                  id="auth-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || isOpening}
                  autoComplete="email"
                  required
                  aria-label="Email address"
                />
              </div>

              {/* PASSWORD */}
              <div style={{ marginBottom: !isLogin ? '20px' : '0' }}>
                <label className="bc-label" htmlFor="auth-password">Password</label>
                <div className="bc-input-wrap">
                  <input
                    className="bc-input"
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading || isOpening}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="bc-eye"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD (signup only) */}
              {!isLogin && (
                <div>
                  <label className="bc-label" htmlFor="auth-confirm">Confirm Password</label>
                  <input
                    className="bc-input"
                    id="auth-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading || isOpening}
                    autoComplete="new-password"
                    required={!isLogin}
                    aria-label="Confirm password"
                  />
                </div>
              )}

              {/* ── Open the Book button ── */}
              <button
                type="submit"
                className="bc-btn-primary"
                disabled={loading || isOpening}
                style={{ marginTop: '26px' }}
                aria-label={isLogin ? 'Sign in' : 'Create account'}
              >
                {loading ? 'Opening…' : 'Open the Book'}
              </button>

              {/* ── Continue with Google ── */}
              <button
                type="button"
                className="bc-btn-google"
                disabled={loading || isOpening}
                style={{ marginTop: '12px' }}
                onClick={() => alert('Google OAuth coming soon.')}
                aria-label="Continue with Google"
              >
                <span className="bc-google-icon">G</span>
                Continue with Google
              </button>

              {/* ── Rule + links ── */}
              <div className="bc-rule" style={{ marginTop: '26px' }}>or</div>

              <div style={{ marginTop: '18px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="bc-link"
                  onClick={switchMode}
                  disabled={loading || isOpening}
                  aria-label={isLogin ? 'Switch to sign up' : 'Switch to sign in'}
                >
                  {isLogin ? '✦ Write a new story — Register' : '✦ Already have an account — Sign In'}
                </button>

                {isLogin && (
                  <button
                    type="button"
                    className="bc-link"
                    onClick={handleForgotPassword}
                    disabled={loading || isOpening}
                    aria-label="Forgot password"
                  >
                    🔑 Forgot passcode?
                  </button>
                )}
              </div>

            </div>{/* /bc-form */}
          </form>

        </div>{/* /bc-card */}
      </div>{/* /bc-page */}
    </>
  )
}

export default AuthPage
