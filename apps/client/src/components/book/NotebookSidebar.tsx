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

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  user: _user,
  bookDetails,
  activeConversationId,
  onSelectConversation,
  onlineUsers: _onlineUsers,
  lastActiveTimes: _lastActiveTimes,
  searchQuery,
  setSearchQuery,
  searching,
  searchResults,
  searchPage: _searchPage,
  searchTotalPages: _searchTotalPages,
  handleSearch,
  handleJumpToMessage,
  highlightText,
  setShowSwitcher,
  handleLogout: _handleLogout,
  onShowSettings,
  mobileActivePage
}) => {
  return (
    <div
      id="tour-sidebar"
      className={`w-full md:w-1/2 h-full flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#503723]/12 shadow-[inset_-20px_0_30px_rgba(35,20,10,0.03)] ruled-paper paper-texture overflow-hidden ${
        mobileActivePage === 'sidebar' ? 'flex' : 'hidden md:flex'
      }`}
    >
      {/* Top area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pt-8 pb-3">

        {/* Title */}
        <h1 className="font-display font-bold text-[24px] text-[#2D2116] m-0 mb-1 leading-tight select-none">
          BookChat Shelf
        </h1>
        <p className="italic text-[11px] text-[#8A5B44] mb-5 font-serif select-none">
          Volume IV · Active Dialogues
        </p>

        {/* Search Underline input (built flat into page) */}
        <div className="relative mb-6 flex items-center border-b border-[#503723]/25 focus-within:border-[#6D3F2C] transition-colors">
          <input
            type="text"
            placeholder="Search archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            aria-label="Search ledger entries"
            className="w-full bg-transparent border-none outline-none text-[12px] text-[#2D2116] placeholder-[#8A5B44]/55 font-serif py-1.5 pr-6"
          />
          <button 
            type="button"
            onClick={() => handleSearch(1)}
            aria-label="Submit search query"
            className="absolute right-0 text-[10px] text-[#8A5B44] hover:text-[#6D3F2C] transition-colors bg-none border-none p-0 cursor-pointer"
          >
            🔍
          </button>
        </div>

        {/* Primary Button: Write to member */}
        <button
          type="button"
          onClick={() => setShowSwitcher(true)}
          className="w-full bg-[#6D3F2C] hover:bg-[#8A5B44] active:translate-y-[1px] text-[#F8F3E8] font-serif text-[13px] font-bold py-2.5 px-4 rounded-[4px] mb-8 transition-all duration-200 cursor-pointer border-none shadow-[0_2px_4px_rgba(50,30,10,0.18)] select-none tracking-wide text-center"
        >
          ✒ Write to member
        </button>

        {/* Conversations Header */}
        <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A5B44]/75 mb-4 font-bold select-none">
          CONVERSATIONS
        </div>

        {/* Conversation list spaced at 24px */}
        <div className="flex flex-col gap-6">
          {!bookDetails?.conversations?.length ? (
            <div className="text-[12px] text-[#8A5B44] italic font-serif py-2">
              No archives found.
            </div>
          ) : (
            bookDetails.conversations.map((c: any) => {
              const isActive = c.id === activeConversationId
              const hasUnread = c.unreadCount > 0

              const convName = c.name || (c.isGroup ? bookDetails.name || 'General Thread' : 'Private Dialogue')

              // Get first initials
              const initials = getInitials(convName)

              // Build a vintage timestamp fallback
              const mockTime = "10:45 AM"

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
                  aria-label={`Open dialogue: ${convName}`}
                  className={`flex items-center gap-3 p-3 rounded-[3px] cursor-pointer transition-all duration-250 select-none relative border border-[#503723]/0 hover:translate-x-[3px] hover:shadow-[0_4px_12px_rgba(50,30,10,0.08)] hover:bg-[#F3E9D7]/40 ${
                    isActive
                      ? 'bg-[#F3E9D7] border-l-[3px] border-[#6D3F2C] shadow-[0_2px_8px_rgba(50,30,10,0.06)]'
                      : ''
                  }`}
                >
                  {/* Wax Seal style avatar */}
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-[#F3E9D7] border border-[#503723]/15 flex items-center justify-center font-serif text-[11px] font-bold text-[#6D3F2C] shadow-[0_2px_4px_rgba(35,20,10,0.08)]"
                  >
                    {initials}
                  </div>

                  {/* Conversation info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-serif text-[13px] font-bold text-[#2D2116] truncate">
                        {convName}
                      </span>
                      <span className="text-[9px] font-sans text-[#8A5B44]/75 flex-shrink-0">
                        {mockTime}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8A5B44]/80 font-serif mt-0.5 truncate flex items-center justify-between gap-2">
                      <span className="italic truncate">Aryan · Active</span>
                      {hasUnread && (
                        /* Unread gold circle indicator */
                        <span 
                          className="w-2.5 h-2.5 rounded-full bg-[#C8A96A] inline-block shadow-sm"
                          title="New entries available"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Dynamic Conversations search entries list */}
        {(searching || searchResults !== null) && (
          <div className="mt-8 border-t border-dashed border-[#503723]/15 pt-4">
            <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8A5B44]/75 mb-3 font-bold select-none">
              SEARCH ENTRIES
            </div>
            {searching ? (
              <div className="text-[11px] text-[#8A5B44] italic font-serif py-2">Consulting log books...</div>
            ) : searchResults?.length === 0 ? (
              <div className="text-[11px] text-[#8A5B44] italic font-serif py-2">No matching entries found.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                {searchResults?.map((msg: any) => (
                  <div
                    key={msg.id}
                    onClick={() => handleJumpToMessage(msg)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleJumpToMessage(msg) } }}
                    tabIndex={0}
                    role="button"
                    className="bg-[#F3E9D7]/40 border border-[#503723]/10 hover:bg-[#F3E9D7]/75 rounded-[3px] p-2 cursor-pointer transition-all hover:translate-x-[2px]"
                  >
                    <div className="flex justify-between text-[8px] text-[#8A5B44] mb-1 font-sans uppercase tracking-wider">
                      <span>{msg.sender?.displayName || 'Scribe'}</span>
                      <span>{new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="text-[10px] text-[#2D2116] font-serif leading-relaxed m-0 italic truncate">
                      {highlightText(msg.content, searchQuery)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Profile card: Small paper strip style */}
      <div className="flex-shrink-0 border-t border-[#503723]/15 bg-[#F3E9D7]/65 px-8 py-3.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* Vintage Portrait style avatar */}
          <div
            className="w-9 h-9 rounded-[4px] bg-[#2D2116] border border-[#503723]/30 flex items-center justify-center text-[#F8F3E8] shadow-sm overflow-hidden"
          >
            {/* Draw a subtle skeuomorphic portrait silhouette */}
            <svg className="w-6 h-6 opacity-85" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" />
            </svg>
          </div>
          <div>
            <div className="font-serif font-bold text-[11px] text-[#2D2116] tracking-wider uppercase leading-tight">
              THE ARCHIVIST
            </div>
            <div className="font-serif text-[9px] text-[#8A5B44] mt-0.5 leading-none">
              Vol. III · Curator
            </div>
          </div>
        </div>
        <button
          onClick={onShowSettings}
          className="text-xs text-[#8A5B44] hover:text-[#6D3F2C] transition-colors cursor-pointer bg-none border-none p-0 focus:outline-none"
          aria-label="Open settings panel"
          title="Archive Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
