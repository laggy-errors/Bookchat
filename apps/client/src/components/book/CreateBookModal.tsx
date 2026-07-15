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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        {/* Success Card Sheet */}
        <div className="relative w-full max-w-md bg-[#F4ECDD] rounded-[6px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] font-serif text-[#1F1B16] text-center">
          <div className="absolute inset-3 border border-[#E3D5B8]/40 pointer-events-none"></div>

          <h2 className="font-display font-bold text-2xl text-[#52664A] mb-2">
            🎉 Journal Bound!
          </h2>
          <p className="text-xs text-[#8c7f67] italic mb-6">
            Your new ledger has been successfully logged in the archives.
          </p>

          <div className="bg-[#EDE3D0] border-2 border-dashed border-[#B08D57] rounded p-5 my-6 relative">
            <span className="text-[9px] font-sans uppercase tracking-widest text-[#8c7f67] block mb-2">
              Shareable Join Code
            </span>
            <span className="text-3xl font-bold font-display tracking-widest text-[#4A3223] select-all">
              {createdBook.joinCode}
            </span>
          </div>

          <p className="text-xs text-[#3B352C] leading-relaxed mb-6">
            Provide this unique code to other scribes to grant them access to this notebook.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleCopyCode}
              className="flex-1 bg-transparent border border-[#B08D57] text-[#4A3223] font-bold py-2.5 px-4 rounded text-xs transition cursor-pointer"
            >
              Copy Code
            </button>
            <button
              onClick={() => onCreate(createdBook)}
              className="flex-1 bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold py-2.5 px-4 rounded text-xs shadow-md transition cursor-pointer"
            >
              Enter Journal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      {/* Notebook Sheet Overlay */}
      <div className="relative w-full max-w-md bg-[#F4ECDD] rounded-[6px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] font-serif text-[#1F1B16]">
        {/* Decorative inner notebook border line */}
        <div className="absolute inset-3 border border-[#E3D5B8]/40 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 border-b border-dashed border-[#B08D57]/30 pb-2">
          <h2 className="font-display font-bold text-xl text-[#4A3223] m-0">
            ✒️ Bind a New Journal
          </h2>
          <button 
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Close bind journal modal"
            className="text-lg font-bold text-[#7A3B2E] hover:opacity-80 cursor-pointer bg-none border-none p-0 disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Book Name */}
          <div className="flex flex-col">
            <label htmlFor="create-book-name" className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">
              Book Name
            </label>
            <input
              id="create-book-name"
              type="text"
              placeholder="e.g. Chronicles of 1894"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              className="ink-underline-input text-sm p-1 placeholder-[#a89877]"
              maxLength={50}
              required
            />
          </div>

          {/* Optional Passcode */}
          <div className="flex flex-col">
            <label htmlFor="create-book-passcode" className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67] mb-1">
              Passcode (Optional)
            </label>
            <input
              id="create-book-passcode"
              type="password"
              placeholder="Leave blank for public access"
              value={passcode}
              disabled={loading}
              onChange={(e) => setPasscode(e.target.value)}
              className="ink-underline-input text-sm p-1 placeholder-[#a89877]"
            />
            <span className="text-[10px] text-[#8c7f67] italic mt-1">
              Locks the book cover from other scribes.
            </span>
          </div>

          {/* Set as Default Toggle */}
          <div className="flex items-center justify-between mt-2 py-2 border-y border-dashed border-[#B08D57]/20">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#1F1B16]">Auto-Open as Default</span>
              <span className="text-[10px] text-[#8c7f67] italic mt-0.5">
                Opens automatically on next login.
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
              <div className="w-11 h-6 bg-[#EDE3D0] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#B08D57] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#B08D57] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#52664A]"></div>
            </label>
          </div>

          {/* Action strip */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              aria-label="Cancel binding new book"
              className="flex-1 bg-transparent border border-[#7A3B2E] text-[#7A3B2E] hover:bg-[#7A3B2E]/5 font-bold py-2 px-4 rounded text-sm transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-label="Submit bindings to create new book"
              className="flex-1 bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold py-2 px-4 rounded text-sm shadow-md transition cursor-pointer disabled:opacity-50"
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
