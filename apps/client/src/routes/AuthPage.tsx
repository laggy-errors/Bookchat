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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedEmail, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
      } else {
        // Trigger the book cover opening animation
        setIsOpening(true)
        setTimeout(() => {
          onSuccess(data)
        }, 1100) // Transition duration matches CSS transition timing (1.1s)
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
    <div 
      className="flex items-center justify-center min-h-screen w-full bg-[#1E130C] p-6 overflow-hidden"
      style={{ perspective: '1600px' }}
    >
      {/* 3D Book Container */}
      <div 
        className="relative w-[420px] h-[580px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        
        {/* 1. Underlying Page Stack (Revealed when cover swings open) */}
        <div 
          className="absolute inset-0 bg-[#EDE3D0] rounded-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col justify-center items-center p-8 transition-transform"
          style={{
            transform: isOpening ? 'translateZ(0px) rotateY(-5deg)' : 'translateZ(-5px)',
            transformOrigin: 'left center',
            transitionDuration: '1.1s',
            border: '1px solid #D6C6B2'
          }}
        >
          {/* Internal page layers */}
          <div className="absolute inset-2 bg-[#F4ECDD] rounded-[4px] shadow-inner border border-[#E3D5B8] flex flex-col items-center justify-center">
            <span className="font-display text-[#B08D57] font-semibold text-base animate-pulse">
              📖 Opening ledger...
            </span>
          </div>
        </div>

        {/* 2. Front Cover Panel (Flipped Y-Axis left-centered) */}
        <div 
          className="absolute inset-0 bg-[#3B2A1C] rounded-[8px] flex flex-col justify-between p-10 border-l-[14px] border-[#241A12] shadow-[inset_-8px_0_15px_rgba(0,0,0,0.3)] transition-transform"
          style={{
            transform: isOpening ? 'rotateY(-130deg)' : 'rotateY(0deg)',
            transformOrigin: 'left center',
            backfaceVisibility: 'hidden',
            transitionDuration: '1.1s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10
          }}
        >
          {/* Spine detail line */}
          <div className="absolute left-0 top-[10%] bottom-[10%] w-[2px] bg-yellow-600/20 shadow-inner"></div>

          {/* Embossed Cover Header */}
          <div className="text-center mt-4">
            <h1 className="font-display font-bold text-3xl tracking-wide text-[#B08D57] select-none m-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
              📖 BookChat
            </h1>
            <p className="font-serif italic text-xs text-amber-100/50 mt-1 select-none">
              Volume IV — Active Dialogues
            </p>
          </div>

          {/* Inlaid Parchment Form Face */}
          <div className="bg-[#F4ECDD] rounded-[4px] p-6 shadow-[inset_0_2px_5px_rgba(0,0,0,0.15),0_4px_15px_rgba(0,0,0,0.4)] border border-[#E3D5B8]">
            <h2 className="font-display font-semibold text-base text-[#1F1B16] text-center mb-4 border-b border-dashed border-[#B08D57]/30 pb-2">
              {isLogin ? 'Sign into the ledger' : 'Enter your name'}
            </h2>

            {error && (
              <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-3 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col">
                <input
                  type="email"
                  id="auth-email"
                  placeholder="Email Address"
                  value={email}
                  disabled={loading || isOpening}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ink-underline-input text-sm p-1 placeholder-[#a89877]"
                  aria-label="Email address for registry sign-in"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col">
                <input
                  type="password"
                  id="auth-password"
                  placeholder="Passcode"
                  value={password}
                  disabled={loading || isOpening}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ink-underline-input text-sm p-1 placeholder-[#a89877]"
                  aria-label="Scribe account passcode"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
              </div>

              {!isLogin && (
                <div className="flex flex-col">
                  <input
                    type="password"
                    id="auth-confirm-password"
                    placeholder="Confirm Passcode"
                    value={confirmPassword}
                    disabled={loading || isOpening}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="ink-underline-input text-sm p-1 placeholder-[#a89877]"
                    aria-label="Confirm new passcode"
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || isOpening}
                aria-label={isLogin ? 'Sign into scribe ledger account' : 'Register new scribe ledger account'}
                className="mt-4 bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-serif font-bold text-sm py-2 px-4 rounded shadow-md transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Opening...' : 'Open Book'}
              </button>
            </form>

            {/* Toggle link */}
            <div className="text-center mt-4">
              <button
                type="button"
                disabled={loading || isOpening}
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                }}
                aria-label={isLogin ? 'Switch to registration form' : 'Switch to login form'}
                className="font-serif text-xs text-[#6B7A4F] hover:underline cursor-pointer bg-none border-none p-0 disabled:opacity-50"
              >
                {isLogin ? "Write a new story (Register)" : "Already in our records? (Login)"}
              </button>
            </div>
          </div>

          {/* Footer controls */}
          <div className="text-center mb-2 flex justify-center gap-4">
            <button
              type="button"
              disabled={loading || isOpening}
              onClick={handleForgotPassword}
              aria-label="Request a password reset for your scribe account"
              className="font-serif text-xs text-[#B08D57] hover:text-[#9B7744] cursor-pointer bg-none border-none p-0 disabled:opacity-50"
            >
              Forgot passcode?
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AuthPage
