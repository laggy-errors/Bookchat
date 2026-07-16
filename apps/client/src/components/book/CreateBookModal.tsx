import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface CreateBookModalProps {
  onClose: () => void
  onCreate: (book: any) => void
}

export const CreateBookModal: React.FC<CreateBookModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [setDefault, setSetDefault] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [createdBook, setCreatedBook] = useState<any | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Book name cannot be empty.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: trimmedName,
          password: passcode,
          setDefault,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to bind the ledger.')
      } else {
        setCreatedBook(data)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to reach the library records.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (createdBook) {
      navigator.clipboard.writeText(createdBook.joinCode)
      alert('Join code copied to clipboard!')
    }
  }

  if (createdBook) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#150F0B]/75 backdrop-blur-[8px] p-4 animate-fade-in">
        {/* Success Card Sheet (Glassmorphic) */}
        <div className="relative w-full max-w-[540px] bg-[#34251a]/85 backdrop-blur-[12px] rounded-[20px] p-9 border border-[#9F7A42]/50 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_3px_rgba(212,176,106,0.25)] font-serif text-[#F2E7D3] text-center overflow-hidden">
          {/* Subtle Walnut Overlay texture */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(82,59,41,0.15),transparent_80%)] opacity-30"></div>
          {/* Subtle Corner Ornaments */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#D4B06A]/20 pointer-events-none"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#D4B06A]/20 pointer-events-none"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#D4B06A]/20 pointer-events-none"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#D4B06A]/20 pointer-events-none"></div>

          <h2 className="font-display font-bold text-2xl text-[#D4B06A] mb-2 tracking-wide">
            🎉 Journal Bound!
          </h2>
          <p className="text-xs text-[#B8A58B] italic mb-6">
            Your new ledger has been successfully logged in the archives.
          </p>

          <div className="bg-[#241A12]/60 border border-[#9F7A42]/50 rounded-[12px] p-6 my-6 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#B8A58B] block mb-2 font-semibold">
              Shareable Join Code
            </span>
            <span className="text-3xl font-bold font-display tracking-widest text-[#D4B06A] select-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {createdBook.joinCode}
            </span>
          </div>

          <p className="text-xs text-[#B8A58B] leading-relaxed mb-6 px-4">
            Provide this unique code to other scribes to grant them access to this notebook.
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleCopyCode}
              className="flex-1 bg-transparent border border-[#9F7A42] hover:border-[#D4B06A] text-[#F2E7D3] hover:text-[#FFFFFF] font-sans uppercase tracking-wider text-xs py-3 px-4 rounded-[12px] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_10px_rgba(212,176,106,0.15)]"
            >
              Copy Code
            </button>
            <button
              onClick={() => onCreate(createdBook)}
              className="flex-1 bg-gradient-to-b from-[#8C6B3A] to-[#6E4F23] hover:from-[#9F7A42] hover:to-[#8C6B3A] active:scale-[0.98] text-[#1F1B16] font-sans font-bold uppercase tracking-wider py-3 px-4 rounded-[12px] text-xs shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 cursor-pointer"
            >
              Enter Journal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#150F0B]/75 backdrop-blur-[8px] p-4 animate-fade-in">
      {/* Modal Container: Walnut Smoked Glass with Antique Gold Shimmer */}
      <div 
        className="relative w-full max-w-[540px] bg-[#34251a]/85 backdrop-blur-[12px] rounded-[20px] p-9 shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_1px_3px_rgba(212,176,106,0.25)] border border-[#9F7A42]/50 font-serif text-[#F2E7D3] overflow-hidden"
        style={{
          boxShadow: '0 30px 70px rgba(0,0,0,0.85), 0 0 40px rgba(159,122,66,0.08), inset 0 1px 3px rgba(212,176,106,0.25)'
        }}
      >
        {/* Subtle Walnut Overlay texture */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(82,59,41,0.15),transparent_80%)] opacity-30"></div>
        {/* Subtle Corner Ornaments */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4B06A]/20 pointer-events-none"></div>
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4B06A]/20 pointer-events-none"></div>
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4B06A]/20 pointer-events-none"></div>
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4B06A]/20 pointer-events-none"></div>

        {/* Shimmer line indicator (Subtle decorative glow) */}
        <div className="absolute top-0 left-[-100%] right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4B06A]/40 to-transparent animate-[shimmer_12s_infinite_linear]"></div>

        <div className="flex justify-between items-center mb-4 border-b border-[#9F7A42]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[#D4B06A] text-lg select-none">✒️</span>
            <h2 className="font-display font-bold text-xl text-[#D4B06A] m-0 tracking-wide">
              Bind a New Journal
            </h2>
          </div>
          <button 
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Close bind journal modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-light text-[#B8A58B] hover:text-[#D4B06A] hover:bg-[#9F7A42]/10 transition-all duration-300 hover:rotate-90 cursor-pointer bg-none border-none p-0 disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Elegant divider */}
        <div className="text-center text-[10px] text-[#9F7A42]/40 tracking-[0.3em] mb-6 select-none">
          ──────── ✦ ────────
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-[#7A3B2E]/20 border border-[#7A3B2E]/50 rounded-[12px] text-[#F2E7D3] text-xs p-3 mb-5 text-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Book Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-book-name" className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#D4B06A] font-semibold">
              Book Name
            </label>
            <input
              id="create-book-name"
              type="text"
              placeholder="e.g., Chronicles of 1894"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#201711]/60 border border-[#9F7A42]/40 focus:border-[#D4B06A] rounded-[12px] text-sm p-3.5 text-[#F2E7D3] placeholder-[#B8A58B]/50 transition-all duration-300 outline-none focus:shadow-[0_0_10px_rgba(212,176,106,0.15)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
              maxLength={50}
              required
            />
          </div>

          {/* Optional Passcode */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-book-passcode" className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#D4B06A] font-semibold">
              Password (Optional)
            </label>
            <input
              id="create-book-passcode"
              type="password"
              placeholder="Leave blank for public access"
              value={passcode}
              disabled={loading}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-[#201711]/60 border border-[#9F7A42]/40 focus:border-[#D4B06A] rounded-[12px] text-sm p-3.5 text-[#F2E7D3] placeholder-[#B8A58B]/50 transition-all duration-300 outline-none focus:shadow-[0_0_10px_rgba(212,176,106,0.15)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
            />
            <span className="text-[10px] text-[#B8A58B]/70 italic mt-0.5">
              Locks the book cover from other scribes.
            </span>
          </div>

          {/* Set as Default Toggle (Bronze Track, Gold Knob Switch) */}
          <div className="flex items-center justify-between py-3 px-1.5 border-y border-[#9F7A42]/15">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#F2E7D3] tracking-wide">Auto-Open as Default</span>
              <span className="text-[10px] text-[#B8A58B]/70 italic mt-0.5">
                Opens automatically on next launch.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none" htmlFor="create-book-default">
              <input
                id="create-book-default"
                type="checkbox"
                checked={setDefault}
                disabled={loading}
                onChange={(e) => setSetDefault(e.target.checked)}
                className="sr-only peer"
                aria-label="Set as default automatically opening journal"
              />
              {/* Custom bronze track and gold knob styling */}
              <div className="w-12 h-6 bg-[#201711] border border-[#9F7A42]/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-[#D4B06A] after:shadow-[0_0_6px_rgba(212,176,106,0.6)] after:rounded-full after:h-[18px] after:w-[18px] after:transition-all duration-300 peer-checked:bg-[#5C4328]/80 peer-checked:border-[#D4B06A]"></div>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              aria-label="Cancel binding new book"
              className="flex-1 bg-transparent border border-[#9F7A42]/70 text-[#B8A58B] hover:text-[#F2E7D3] hover:border-[#D4B06A] font-sans font-semibold uppercase tracking-wider text-xs py-3 px-4 rounded-[12px] transition-all duration-300 cursor-pointer hover:shadow-[0_0_8px_rgba(159,122,66,0.1)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-label="Submit bindings to create new book"
              className="flex-1 bg-gradient-to-b from-[#8C6B3A] to-[#6E4F23] hover:from-[#9F7A42] hover:to-[#8C6B3A] active:scale-[0.98] text-[#1F1B16] font-sans font-bold uppercase tracking-wider py-3 px-4 rounded-[12px] text-xs shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_6px_16px_rgba(212,176,106,0.25)] transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Binding...' : 'Bind Journal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBookModal

