import React from 'react'
import type { User, Book, Message } from '../../types'

interface NotebookSidebarProps {
  user: User
  bookDetails: Book | null
  activeConversationId: string | null
  onSelectConversation: (convId: string) => void
  onlineUsers: Set<string>
  lastActiveTimes: Record<string, string>
  searchQuery: string
  setSearchQuery: (q: string) => void
  searching: boolean
  searchResults: Message[] | null
  searchPage: number
  searchTotalPages: number
  handleSearch: (page: number) => Promise<void>
  handleJumpToMessage: (msg: Message) => Promise<void>
  highlightText: (text: string, search: string) => React.ReactNode
  setShowSwitcher: (show: boolean) => void
  handleLogout: () => void
  onShowSettings: () => void
  mobileActivePage: 'sidebar' | 'writing'
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  user,
  bookDetails,
  activeConversationId,
  onSelectConversation,
  onlineUsers,
  lastActiveTimes,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  searchPage,
  searchTotalPages,
  handleSearch,
  handleJumpToMessage,
  highlightText,
  setShowSwitcher,
  handleLogout,
  onShowSettings,
  mobileActivePage
}) => {
  return (
    <div 
      id="tour-sidebar"
      className={`w-full md:w-1/2 h-full flex flex-col justify-between p-6 md:p-10 md:pr-[38px] border-b md:border-b-0 md:border-r border-black/5 shadow-[inset_-30px_0_40px_rgba(0,0,0,0.06)] paper-texture ${
        mobileActivePage === 'sidebar' ? 'flex' : 'hidden md:flex'
      }`}
    >
      <div>
        <h1 className="font-display font-bold text-2xl text-[#1F1B16] m-0 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6B7A4F] inline-block shadow-sm"></span>
          BookChat Shelf
        </h1>
        <p className="italic text-xs text-[#8c7f67] mb-6 font-serif">Volume IV - Active Dialogues</p>
        
        <div className="text-[11px] font-sans uppercase tracking-widest text-[#8c7f67] mb-2 font-bold">Conversations</div>
        <div className="flex flex-col gap-2">
          {bookDetails?.conversations?.map((c: any) => {
            const hasUnread = c.unreadCount > 0
            return (
              <div 
                key={c.id} 
                onClick={() => onSelectConversation(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectConversation(c.id)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open ${c.isGroup ? 'general thread' : 'private dialogue'}. ${hasUnread ? c.unreadCount + ' new messages' : ''}`}
                className={`rounded border-l-3 p-3 shadow-sm flex items-center justify-between transition cursor-pointer paper-card-hover ${
                  c.id === activeConversationId 
                    ? 'bg-[#FBF4E4] border-[#6B7A4F] shadow-[0_2px_4px_rgba(90,70,45,0.1)]' 
                    : 'bg-[#FBF4E4]/40 border-[#8c7f67]/20 hover:bg-[#FBF4E4]/60'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-[#1F1B16] font-serif">
                    {c.isGroup ? 'General Ledger Thread' : 'Private Scribe Dialogue'}
                  </div>
                  <div className="text-[10px] text-[#8a7c62] mt-1 font-serif">
                    {c.isGroup ? 'Active Scribes Dialogue' : 'Private correspondence'}
                  </div>
                </div>

                {/* Paper-themed unread crimson wax-seal indicator */}
                {hasUnread && (
                  <span className="bg-[#A63F3F] text-[#FBF4E4] font-serif text-[9px] px-2 py-0.5 rounded-full shadow-sm font-bold animate-pulse ml-2">
                    {c.unreadCount} new
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Real-time Scribes Presence Rail */}
        <div className="text-[11px] font-sans uppercase tracking-widest text-[#8c7f67] mb-2 mt-6 font-bold">Scribes</div>
        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto custom-scrollbar">
          {bookDetails?.members?.map((m: any) => {
            const isOnline = onlineUsers.has(m.userId)
            const lastActiveStr = lastActiveTimes[m.userId]
            
            let isRecentlyActive = false
            if (!isOnline && lastActiveStr) {
              const diffMs = Date.now() - new Date(lastActiveStr).getTime()
              isRecentlyActive = diffMs < 5 * 60 * 1000 // recently active threshold: 5 mins
            }

            // Presence theme styling
            let presenceDotColor = 'border border-[#8c7f67]/40 bg-transparent' // offline (hollow)
            let statusLabel = 'Offline'
            if (isOnline) {
              presenceDotColor = 'bg-[#6B7A4F] shadow-sm' // online
              statusLabel = 'Online'
            } else if (isRecentlyActive) {
              presenceDotColor = 'bg-[#B08D57] animate-pulse shadow-sm' // recently active (amber)
              statusLabel = 'Recently Active'
            }

            return (
              <div key={m.userId} className="flex items-center justify-between bg-[#FBF4E4]/40 rounded p-2 hover:bg-[#FBF4E4] transition border border-black/5">
                <div className="flex items-center gap-2">
                  {/* Dot indicator */}
                  <span 
                    className={`w-2 h-2 rounded-full inline-block ${presenceDotColor}`} 
                    title={statusLabel}
                  />
                  <div>
                    <span className="font-serif text-[11px] text-[#1F1B16] font-bold block">
                      {m.user?.displayName || 'Scribe'} {m.userId === user.id ? '(You)' : ''}
                    </span>
                    <span className="text-[8px] font-sans uppercase tracking-wider text-[#8c7f67] block mt-0.5">
                      {m.role === 'creator' ? '⭐ Creator' : 'Member'}
                    </span>
                  </div>
                </div>
                <span className="text-[8px] text-[#8c7f67]/60 font-sans">
                  {new Date(m.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })}
        </div>

        {/* Dynamic Conversations log search panel */}
        <div className="border-t border-dashed border-black/10 mt-6 pt-4">
          <div className="text-[11px] font-sans uppercase tracking-widest text-[#8c7f67] mb-2 font-bold">Search Entries</div>
          <div className="flex gap-2 bg-[#EDE3D0] rounded-full px-3 py-1.5 border border-black/5 mb-3">
            <input 
              type="text"
              placeholder="Search in ink..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              aria-label="Search ledger entries"
              className="bg-transparent border-none outline-none flex-1 text-[11px] text-[#1F1B16] placeholder-[#a89877] font-serif"
            />
            <button 
              type="button"
              onClick={() => handleSearch(1)}
              aria-label="Submit search query"
              className="text-xs cursor-pointer hover:scale-110 active:scale-95 transition bg-none border-none p-0 touch-target"
            >
              🔍
            </button>
          </div>

          {searching ? (
            <div className="text-[10px] text-[#8c7f67] italic text-center py-2 font-serif">Consulting log books...</div>
          ) : searchResults !== null ? (
            <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
              {searchResults.length === 0 ? (
                <div className="text-[10px] text-[#8c7f67] italic text-center py-2 font-serif">No matching entries found.</div>
              ) : (
                <>
                  {searchResults.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      onClick={() => handleJumpToMessage(msg)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleJumpToMessage(msg) } }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Jump to message from ${msg.sender?.displayName || 'Scribe'}: ${msg.content?.slice(0, 60)}`}
                      className="bg-[#FBF4E4]/50 border border-black/5 hover:bg-[#FBF4E4] rounded p-2 transition cursor-pointer text-left shadow-sm paper-card-hover"
                    >
                      <div className="flex justify-between text-[8px] text-[#8c7f67] mb-1 font-sans uppercase tracking-wider">
                        <span>{msg.sender?.displayName || 'Scribe'}</span>
                        <span>{new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-[10px] text-[#3B352C] font-serif leading-relaxed m-0 italic block truncate">
                        {highlightText(msg.content, searchQuery)}
                      </p>
                    </div>
                  ))}
                  
                  {/* Search Pagination rails */}
                  {searchTotalPages > 1 && (
                    <div className="flex justify-between items-center text-[9px] text-[#8c7f67] mt-2 font-serif" aria-label="Search pagination">
                      <button 
                        disabled={searchPage === 1}
                        onClick={() => handleSearch(searchPage - 1)}
                        aria-label="Previous search page"
                        className="text-[#B08D57] disabled:opacity-30 hover:underline cursor-pointer bg-none border-none p-0"
                      >
                        Previous
                      </button>
                      <span>Page {searchPage} of {searchTotalPages}</span>
                      <button 
                        disabled={searchPage === searchTotalPages}
                        onClick={() => handleSearch(searchPage + 1)}
                        aria-label="Next search page"
                        className="text-[#B08D57] disabled:opacity-30 hover:underline cursor-pointer bg-none border-none p-0"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Settings Rail */}
      <div className="border-t border-dashed border-black/10 pt-4 flex justify-between items-center text-xs text-[#8c7f67] font-serif">
        <span>{user.displayName}</span>
        <div className="flex gap-2.5">
          <button 
            onClick={onShowSettings}
            className="text-[#B08D57] hover:underline cursor-pointer bg-none border-none p-0"
            aria-label="Open settings panel"
          >
            Settings
          </button>
          <span>·</span>
          <button 
            onClick={() => setShowSwitcher(true)}
            className="text-[#B08D57] hover:underline cursor-pointer bg-none border-none p-0"
            aria-label="Switch current book"
          >
            Switch
          </button>
          <span>·</span>
          <button 
            onClick={handleLogout}
            className="text-[#7A3B2E] hover:underline cursor-pointer bg-none border-none p-0"
            aria-label="Logout scribe profile"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
