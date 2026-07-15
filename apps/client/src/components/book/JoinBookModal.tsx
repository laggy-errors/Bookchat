import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface JoinBookModalProps {
  onClose: () => void
  onJoinSuccess: (updatedUser: any) => void
}

export const JoinBookModal: React.FC<JoinBookModalProps> = ({ onClose, onJoinSuccess }) => {
  const [joinCode, setJoinCode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [needPassword, setNeedPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedCode = joinCode.trim().toUpperCase()
    if (!trimmedCode) {
      setError('Please enter a Join Code.')
      return
    }

    if (trimmedCode.length !== 6) {
      setError('Join Code must be exactly 6 characters (e.g. ABC234).')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/books/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          joinCode: trimmedCode,
          password: passcode || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.isPasswordRequired) {
          setNeedPassword(true)
          setError('This Book is password-protected. Please enter the passcode.')
        } else {
          setError(data.error || 'Failed to join the journal.')
        }
      } else {
        // Success! Set selection Persistence
        onJoinSuccess(data)
      }
    } catch (err) {
      console.error(err)
      setError('Connection failed. Please check network state.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      {/* Skeuomorphic Paper Envelope Sheet */}
      <div className="relative w-full max-w-md bg-[#F4ECDD] rounded-[6px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] font-serif text-[#1F1B16] paper-texture animate-fade-in">
        {/* Inner envelope lining detail */}
        <div className="absolute inset-3 border border-[#E3D5B8]/40 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 border-b border-dashed border-[#B08D57]/30 pb-2">
          <h2 className="font-display font-bold text-xl text-[#4A3223] m-0">
            ✉️ Redeem Invitation
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-lg font-bold text-[#7A3B2E] hover:opacity-80 cursor-pointer bg-none border-none p-0 focus:outline-none"
            aria-label="Close invite modal"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-[#8c7f67] italic mb-6 text-center">
          Enter the unique code written on your wax-sealed invitation card.
        </p>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Join Code Input */}
          <div className="flex flex-col ink-underline-wrapper">
            <label htmlFor="join-code-input" className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">
              Join Code
            </label>
            <input
              id="join-code-input"
              type="text"
              placeholder="e.g. ABC234"
              value={joinCode}
              disabled={needPassword || loading} // lock code input if password check is active
              onChange={(e) => setJoinCode(e.target.value)}
              className="ink-underline-input text-base p-1 text-center font-display tracking-widest uppercase placeholder-[#a89877]"
              maxLength={6}
              required
            />
            <div className="ink-underline-bar" />
          </div>

          {/* Dynamic Passcode input (Revealed only if required) */}
          {needPassword && (
            <div className="flex flex-col animate-fade-in ink-underline-wrapper mt-2">
              <label htmlFor="join-book-passcode" className="text-[10px] font-sans uppercase tracking-wider text-[#7A3B2E] mb-1 font-bold">
                🔒 Passcode Required
              </label>
              <input
                id="join-book-passcode"
                type="password"
                placeholder="Enter password to unlock cover"
                value={passcode}
                disabled={loading}
                onChange={(e) => setPasscode(e.target.value)}
                className="ink-underline-input text-base p-1 placeholder-[#a89877]"
                required
              />
              <div className="ink-underline-bar" />
              <button 
                type="button"
                onClick={() => {
                  setNeedPassword(false)
                  setPasscode('')
                  setError(null)
                }}
                disabled={loading}
                aria-label="Change code and reset password challenge field"
                className="text-[10px] text-[#6B7A4F] hover:underline text-left mt-1 cursor-pointer bg-none border-none p-0 focus:outline-none"
              >
                Change Code
              </button>
            </div>
          )}

          {/* Action strip */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Cancel join book"
              className="flex-1 bg-transparent border border-[#7A3B2E] text-[#7A3B2E] hover:bg-[#7A3B2E]/5 font-bold py-2 px-4 rounded text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-label="Redeem invitation join code"
              className="flex-1 bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold py-2 px-4 rounded text-sm shadow-md transition cursor-pointer"
            >
              {loading ? 'Redeeming...' : needPassword ? 'Unlock & Join' : 'Redeem Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinBookModal
