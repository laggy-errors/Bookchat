import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface DisplayNameModalProps {
  user: any
  onSave: (updatedUser: any) => void
}

export const DisplayNameModal: React.FC<DisplayNameModalProps> = ({ user, onSave }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setError('Name cannot contain only spaces.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ displayName: trimmedName }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        onSave(data)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to save name to the ledger.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      {/* Modal Container */}
      {/* Modal Container with Paper Lifting & Fade-In */}
      <div className="relative w-full max-w-md bg-[#F4ECDD] rounded-[8px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] text-center font-serif transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 paper-texture animate-fade-in">
        <h2 className="font-display font-bold text-2xl text-[#1F1B16] mb-2">
          ✒️ Choose Your Pen Name
        </h2>
        <p className="text-sm text-[#8c7f67] italic mb-6">
          Every line you write in this journal will be recorded under this name.
        </p>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-4 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col text-left ink-underline-wrapper">
            <label htmlFor="display-name-input" className="text-xs font-sans uppercase tracking-wider text-[#8c7f67] mb-1">
              Display Name
            </label>
            <input
              id="display-name-input"
              type="text"
              placeholder="e.g. Archivist, Scribe"
              value={displayName}
              disabled={loading}
              onChange={(e) => setDisplayName(e.target.value)}
              className="ink-underline-input text-base p-1 text-[#1F1B16] placeholder-[#a89877] transition-all duration-300 focus:bg-[#EDE3D0]/30 rounded-t px-2"
              maxLength={25}
              autoComplete="nickname"
              required
            />
            <div className="ink-underline-bar" />
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-label="Commit pen name and enter the ledger"
            className="mt-2 bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold py-2.5 px-4 rounded shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-[1.03] active:scale-[0.97]"
          >
            {loading ? 'Registering...' : 'Commit Name'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DisplayNameModal
