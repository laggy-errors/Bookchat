import React, { useState } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface PreamblePageProps {
  user: any
  onComplete: (updatedUser: any) => void
}

export const PreamblePage: React.FC<PreamblePageProps> = ({ user, onComplete }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ hasSeenPreamble: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to record preamble state.')
      } else {
        onComplete(data)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to save settings to the ledger.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#1E130C] p-6 overflow-hidden select-none">
      {/* Novel Page Wrapper with Paper Lifting & Fade-In */}
      <div className="relative w-full max-w-xl bg-[#F4ECDD] rounded-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-[#E3D5B8] p-12 md:p-16 flex flex-col justify-between min-h-[550px] font-serif text-[#1F1B16] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 paper-texture animate-fade-in">
        {/* Soft page margins / border frame */}
        <div className="absolute inset-4 border border-[#E3D5B8]/40 pointer-events-none"></div>

        {/* Frontispiece Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8c7f67] block mb-2">
            Introduction & Guidelines
          </span>
          <h1 className="font-display font-bold text-3xl text-[#4A3223] m-0">
            The Ledger Rules
          </h1>
          <div className="w-16 h-[1px] bg-[#B08D57] mx-auto mt-4 mb-2"></div>
        </div>

        {/* Scrollable text pane */}
        <div className="flex-1 text-sm md:text-base leading-relaxed text-[#3B352C] mb-8 pr-2 max-h-[300px] overflow-y-auto">
          {error && (
            <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-4 text-center">
              {error}
            </div>
          )}

          {/* First paragraph with massive Drop Cap */}
          <p className="mb-6 indent-4 text-justify">
            <span className="float-left text-6xl font-bold font-display mr-2.5 mt-1 text-[#4A3223] line-height-none leading-[0.8]">
              W
            </span>
            elcome to BookChat, {user?.displayName || 'Scribe'}. In these pages, we record active dialogues, storing private correspondence in binding logs. Before you commit ink to these sheets, you must bind your intent to the rules of this record.
          </p>

          <ol className="list-none p-0 flex flex-col gap-4 mt-6">
            <li className="flex gap-3">
              <span className="font-bold text-[#B08D57]">I.</span>
              <p className="m-0 text-justify">
                <strong>The Binding Code.</strong> Access to journals is governed by secret sharing keys. You may create a new Book or join an existing ledger using a unique shareable code.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#B08D57]">II.</span>
              <p className="m-0 text-justify">
                <strong>Ledger Isolation.</strong> Every Book is a separate, private journal. Conversations, lists, and direct messages remain completely isolated within the borders of that specific book.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#B08D57]">III.</span>
              <p className="m-0 text-justify">
                <strong>The Cap of 25.</strong> To preserve intimacy and focus, no Book may exceed a total of 25 active members in its records.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#B08D57]">IV.</span>
              <p className="m-0 text-justify">
                <strong>Free Passage.</strong> You are permitted to join multiple Books and switch between your journals immediately at your leisure.
              </p>
            </li>
          </ol>

          <p className="mt-8 text-center italic text-xs text-[#8c7f67]">
            Commit these to memory, Scribe, and turn the page to begin.
          </p>
        </div>

        {/* Continue Button */}
        <div className="text-center mt-auto">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="bg-transparent border border-[#B08D57] hover:bg-[#B08D57]/10 text-[#4A3223] font-serif font-bold text-sm py-2 px-8 rounded transition-all duration-200 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            {loading ? 'Turning page...' : 'Turn Page'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreamblePage
