import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'
import CreateBookModal from './CreateBookModal'
import JoinBookModal from './JoinBookModal'

interface BookSelectionProps {
  user: any
  onSelectBook: (updatedUser: any) => void
}

export const BookSelection: React.FC<BookSelectionProps> = ({ user, onSelectBook }) => {
  const [books, setBooks] = useState<any[]>([])
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/books`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setBooks(data)
      } else {
        setError('Failed to fetch ledger archive.')
      }
    } catch (err) {
      console.error(err)
      setError('Unable to reach archives shelf.')
    } finally {
      setLoadingBooks(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const getSpineColor = (bookId: string) => {
    const colors = ['#5C2E16', '#4A3223', '#2E2B27', '#7A5A3A', '#3B2A1C']
    let hash = 0
    for (let i = 0; i < bookId.length; i++) {
      hash = bookId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const handleSelectBook = async (bookId: string) => {
    setLoading(bookId)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ defaultBookId: bookId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to open the book.')
      } else {
        onSelectBook(data)
      }
    } catch (err) {
      console.error(err)
      setError('Unable to record selection in the database ledger.')
    } finally {
      setLoading(null)
    }
  }

  const handleBookCreated = (newBook: any) => {
    setShowCreateModal(false)
    onSelectBook({
      ...user,
      defaultBookId: newBook.id
    })
  }

  const handleJoinSuccess = (joinedBook: any) => {
    setShowJoinModal(false)
    // Synchronize frontend state
    onSelectBook({
      ...user,
      defaultBookId: joinedBook.id
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#1A1009] p-6 font-serif select-none">
      {/* Bookshelf Outer Container */}
      <div 
        className="w-full max-w-2xl bg-[#2A1B10] rounded-[12px] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-[#3E2818]/60 relative flex flex-col justify-between min-h-[480px] paper-texture animate-fade-in"
        style={{
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <div>
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-3xl text-[#B08D57] m-0 drop-shadow-md">
              📖 The Library Archive
            </h1>
            <p className="text-xs text-amber-100/40 italic mt-2">
              Welcome, {user.displayName}. Choose a journal to load.
            </p>
            <div className="w-24 h-[1px] bg-[#B08D57]/30 mx-auto mt-4"></div>
          </div>

          {error && (
            <div className="bg-[#7A3B2E]/10 border border-[#7A3B2E]/30 rounded text-[#7A3B2E] text-xs p-2 mb-6 text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* Wooden Shelf Row */}
          <div className="relative border-b-16 border-[#1B1009] pb-4 flex justify-center gap-6 px-4 shadow-[0_8px_16px_rgba(0,0,0,0.4)] flex-wrap min-h-[220px] items-end">
            
            {loadingBooks ? (
              <div className="text-xs text-[#B08D57] italic py-8">Consulting archives catalog...</div>
            ) : books.length === 0 ? (
              <div className="text-xs text-[#8c7f67] italic py-8 text-center max-w-sm">
                No active journals found in archives. Bind a new journal or redeem an invitation code to begin.
              </div>
            ) : (
              books.map((book) => {
                const isOpening = loading === book.id
                const spineColor = getSpineColor(book.id)
                return (
                  <button
                    key={book.id}
                    onClick={() => handleSelectBook(book.id)}
                    disabled={loading !== null}
                    aria-label={`Open journal ledger ${book.name}`}
                    className="w-24 h-48 rounded-[4px] border-l-8 border-black/30 shadow-[4px_0_8px_rgba(0,0,0,0.5),-2px_-2px_10px_rgba(255,255,255,0.05)] flex flex-col justify-between p-3 text-left transition-all duration-300 hover:translate-y-[-8px] hover:shadow-[8px_0_16px_rgba(0,0,0,0.6)] cursor-pointer text-[#E3D5B8] disabled:opacity-50 disabled:translate-y-0 focus:outline-none"
                    style={{
                      backgroundColor: spineColor,
                      borderLeftColor: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="font-sans text-[8px] tracking-widest text-[#B08D57] uppercase font-bold">
                      VOL. I
                    </div>
                    
                    {/* Vertical text layout for title */}
                    <div className="flex-1 flex items-center justify-center py-2">
                      <span 
                        className="text-xs font-bold text-[#E3D5B8] tracking-wide select-none text-center block"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {book.name}
                      </span>
                    </div>

                    <div className="text-[8px] opacity-60 text-center font-sans">
                      {isOpening ? 'Loading...' : `${book.membersCount || 1} Scribes`}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Action strip */}
        <div className="mt-12 flex justify-between gap-4 text-xs font-sans">
          <button 
            disabled={loading !== null}
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-transparent border border-[#B08D57] text-[#B08D57] hover:bg-[#B08D57]/10 font-bold py-2.5 px-4 rounded transition duration-200 cursor-pointer disabled:opacity-50"
          >
            Create New Book
          </button>
          <button 
            disabled={loading !== null}
            onClick={() => setShowJoinModal(true)}
            className="flex-1 bg-transparent border border-[#B08D57] text-[#B08D57] hover:bg-[#B08D57]/10 font-bold py-2.5 px-4 rounded transition duration-200 cursor-pointer disabled:opacity-50"
          >
            Join with Code
          </button>
        </div>
      </div>

      {/* Render Create Book Modal Overlay */}
      {showCreateModal && (
        <CreateBookModal 
          onClose={() => setShowCreateModal(false)} 
          onCreate={handleBookCreated} 
        />
      )}

      {/* Render Join Book Modal Overlay */}
      {showJoinModal && (
        <JoinBookModal 
          onClose={() => setShowJoinModal(false)} 
          onJoinSuccess={handleJoinSuccess} 
        />
      )}
    </div>
  )
}

export default BookSelection
