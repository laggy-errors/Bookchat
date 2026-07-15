import React, { useState } from 'react'
import { API_BASE_URL } from '../lib/apiClient'
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

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
      className="flex items-center justify-center min-h-screen w-full bg-[#1A1009] p-4 overflow-hidden relative select-none"
      style={{ 
        perspective: '2000px',
        backgroundImage: 'radial-gradient(circle at center, #2C1A0F 0%, #0E0703 100%)'
      }}
    >
      {/* Visual Workspace Outer Blotter Frame (matches the box surrounding the book in Photo 1) */}
      <div 
        className="absolute w-full max-w-[840px] h-[520px] rounded-[12px] border border-amber-900/10 pointer-events-none hidden md:block"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.4)',
          background: 'rgba(0, 0, 0, 0.05)'
        }}
      ></div>

      {/* 3D Book Shadow Base */}
      <div 
        className="absolute w-[440px] h-[600px] rounded-[10px] bg-black/65 blur-[35px] transition-all duration-1000"
        style={{
          transform: isOpening ? 'translateY(25px) scale(0.96)' : 'translateY(10px) scale(1)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      ></div>

      {/* Responsive Scaling Wrapper to prevent squishing on narrow screens */}
      <div className="relative z-10 scale-90 sm:scale-100 transform transition-transform duration-300">
        
        {/* Top Ledger Tab ("Opening ledger...") */}
        <div 
          className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#EDE3D0] px-4 py-1.5 rounded-t-[5px] border-t border-x border-[#C2B29A] shadow-[0_-2px_5px_rgba(0,0,0,0.05)] text-[10px] font-sans font-semibold tracking-wide text-[#5C3E2D] flex items-center gap-1.5 transition-all duration-1000"
          style={{
            zIndex: 11,
            transform: isOpening ? 'translate(-50%, -10px) opacity-0' : 'translate(-50%, 0px) opacity-100'
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          📖 Opening ledger...
        </div>

        {/* 3D Book Container */}
        <div 
          className="relative w-[440px] h-[600px] transition-all duration-1000 ease-out"
          style={{ 
            transformStyle: 'preserve-3d',
            zIndex: 2
          }}
        >
          
          {/* 1. Underlying Page Stack (Revealed when cover swings open) */}
          <div 
            className="absolute inset-0 bg-[#EDE3D0] rounded-r-[8px] rounded-l-[4px] shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col justify-center items-center p-8 transition-transform paper-texture"
            style={{
              transform: isOpening ? 'translateZ(0px) rotateY(-2deg)' : 'translateZ(-8px)',
              transformOrigin: 'left center',
              transitionDuration: '1.1s',
              border: '1px solid #D6C6B2',
              borderLeft: '4px solid #3D2517'
            }}
          >
            {/* Symmetrical Book Page Stack Lines on the side */}
            <div className="absolute top-0 bottom-0 right-0 w-[6px] bg-gradient-to-r from-[#EDE3D0] via-[#D6C6B2] to-[#AF9F8B] rounded-r-[6px] border-r border-[#9B8C78]"></div>

            {/* Internal page layers */}
            <div className="absolute inset-3 bg-[#F5E9D3] rounded-[4px] shadow-inner border border-[#E3D5B8] flex flex-col items-center justify-center ruled-paper">
              <span className="font-display text-[#B08D57] font-semibold text-lg animate-pulse tracking-wide">
                📖 Opening ledger...
              </span>
              <p className="font-serif italic text-xs text-[#8c7f67] mt-2">Preparing your records...</p>
            </div>
          </div>

          {/* 2. Front Cover Panel (Flipped Y-Axis left-centered) */}
          <div 
            className="absolute inset-0 bg-[#422A1D] rounded-r-[10px] rounded-l-[4px] flex flex-col justify-between p-7 border-l-[16px] border-[#2C1C12] shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5),0_10px_35px_rgba(0,0,0,0.7)] transition-transform paper-texture"
            style={{
              transform: isOpening ? 'rotateY(-140deg)' : 'rotateY(0deg)',
              transformOrigin: 'left center',
              backfaceVisibility: 'hidden',
              transitionDuration: '1.1s',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 10
            }}
          >
            {/* Spine gold accent line */}
            <div className="absolute left-0 top-[3%] bottom-[3%] w-[1px] bg-amber-500/25"></div>
            
            {/* Gilded Corner Decorations (matches Photo 1) */}
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#B08D57]/45 rounded-tr-[3px]"></div>
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#B08D57]/45 rounded-br-[3px]"></div>

            {/* Spine detail line */}
            <div className="absolute left-0 top-[10%] bottom-[10%] w-[2px] bg-yellow-600/15 shadow-inner"></div>

            {/* Embossed Cover Header */}
            <div className="text-center mt-2 flex flex-col items-center">
              {/* Gold Book Icon (matches photo 1) */}
              <svg className="w-8 h-8 text-[#B08D57]/80 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
              </svg>
              <h1 className="font-display font-bold text-[28px] tracking-wide text-[#B08D57] select-none m-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                BookChat
              </h1>
              {/* Decorative Swash under header */}
              <div className="flex items-center gap-1.5 w-full justify-center my-1 opacity-60">
                <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#B08D57]"></span>
                <span className="text-[7px] text-[#B08D57]">♦</span>
                <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#B08D57]"></span>
              </div>
              <p className="font-serif italic text-[11px] text-amber-100/40 select-none">
                Volume IV — Active Dialogues
              </p>
            </div>

            {/* Inlaid Parchment Form Face */}
            <div className="bg-[#FDFBF7] rounded-[6px] p-5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.1),0_5px_20px_rgba(0,0,0,0.3)] border border-[#E3D5B8] flex-1 flex flex-col justify-between my-3">
              
              {/* Form Title & Decorative swash */}
              <div className="text-center">
                <h2 className="font-display font-semibold text-[15px] text-[#1F1B16] m-0">
                  {isLogin ? 'Sign into the ledger' : 'Enter your name'}
                </h2>
                {/* Decorative swash card divider (matches Photo 1) */}
                <div className="text-[10px] text-[#B08D57]/60 font-serif leading-none mt-1 select-none">
                  c~ɔ
                </div>
              </div>

              {/* Error Box with Alert Triangle Icon (matches Photo 1) */}
              {error && (
                <div className="bg-[#FDF2F0] border border-[#F5C2C2] rounded-[4px] text-[#7A3B2E] text-[11px] py-2 px-3 my-2 flex items-start gap-2 shadow-sm font-sans">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#A9432E] shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
                {/* Email Address Input with envelope icon */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E3D5B8] rounded-[6px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] focus-within:border-[#B08D57] transition">
                  <Mail className="w-4 h-4 text-[#a89877]" />
                  <input
                    type="email"
                    id="auth-email"
                    placeholder="Email Address"
                    value={email}
                    disabled={loading || isOpening}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-[#1F1B16] placeholder-[#a89877] font-serif p-0"
                    aria-label="Email address for registry sign-in"
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Passcode Input with lock icon and hide/show eye toggle */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E3D5B8] rounded-[6px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] focus-within:border-[#B08D57] transition">
                  <Lock className="w-4 h-4 text-[#a89877]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    placeholder="Passcode"
                    value={password}
                    disabled={loading || isOpening}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-[#1F1B16] placeholder-[#a89877] font-serif p-0"
                    aria-label="Scribe account passcode"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#a89877] hover:text-[#1F1B16] transition cursor-pointer p-0 bg-transparent border-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Passcode Input (Registration only) */}
                {!isLogin && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E3D5B8] rounded-[6px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] focus-within:border-[#B08D57] transition">
                    <Lock className="w-4 h-4 text-[#a89877]" />
                    <input
                      type="password"
                      id="auth-confirm-password"
                      placeholder="Confirm Passcode"
                      value={confirmPassword}
                      disabled={loading || isOpening}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs text-[#1F1B16] placeholder-[#a89877] font-serif p-0"
                      aria-label="Confirm new passcode"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                )}

                {/* Open Book Submit Button with rich wood/leather texture gradient (matches Photo 1) */}
                <button
                  type="submit"
                  disabled={loading || isOpening}
                  aria-label={isLogin ? 'Sign into scribe ledger account' : 'Register new scribe ledger account'}
                  className="mt-2 bg-gradient-to-b from-[#5C3E2D] to-[#422A1D] hover:from-[#6D4C3A] hover:to-[#503525] text-[#EDE3D0] border border-[#2C1C12] font-serif font-bold text-xs py-2.5 px-4 rounded-[6px] shadow-md transition duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                  </svg>
                  {loading ? 'Opening...' : 'Open Book'}
                </button>
              </form>

              {/* Dashed Separator (matches Photo 1) */}
              <div className="flex items-center gap-2 my-2 select-none">
                <span className="flex-1 border-b border-dashed border-[#B08D57]/20"></span>
                <span className="text-[9px] text-[#a89877]/60 font-serif">or</span>
                <span className="flex-1 border-b border-dashed border-[#B08D57]/20"></span>
              </div>

              {/* Action Toggle / Links */}
              <div className="flex flex-col gap-2 items-center text-center">
                {/* Switch Login/Register Link with Pen icon */}
                <button
                  type="button"
                  disabled={loading || isOpening}
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError(null)
                  }}
                  aria-label={isLogin ? 'Switch to registration form' : 'Switch to login form'}
                  className="font-serif text-[11px] text-[#6B7A4F] hover:text-[#52664A] hover:underline cursor-pointer bg-none border-none p-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>✍️</span>
                  <span>{isLogin ? "Write a new story (Register)" : "Already in our records? (Login)"}</span>
                </button>

                {/* Forgot Passcode Link with Lock icon */}
                <button
                  type="button"
                  disabled={loading || isOpening}
                  onClick={handleForgotPassword}
                  aria-label="Request a password reset for your scribe account"
                  className="font-serif text-[11px] text-[#B08D57] hover:text-[#9B7744] hover:underline cursor-pointer bg-none border-none p-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Forgot passcode?</span>
                </button>
              </div>
            </div>

            {/* Empty space at cover bottom */}
            <div className="h-2"></div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AuthPage
