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

// Deterministic warm-toned avatar colors from name
const AVATAR_COLORS = [
  '#7A6048', '#5C4A32', '#8A6A3C', '#4A6048', '#7A3B2E',
  '#4A5C7A', '#6B5C3E', '#8A4F2A', '#5C6B4A', '#7A5C3E',
]
function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
  user,
  bookDetails,
  activeConversationId,
  onSelectConversation,
  onlineUsers,
  lastActiveTimes: _lastActiveTimes,
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
  handleLogout: _handleLogout,
  onShowSettings,
  mobileActivePage
}) => {
  return (
    <div
      id="tour-sidebar"
      className={`w-full md:w-1/2 h-full flex flex-col justify-between border-b md:border-b-0 md:border-r border-black/8 shadow-[inset_-20px_0_30px_rgba(0,0,0,0.04)] ruled-paper paper-texture overflow-hidden ${
        mobileActivePage === 'sidebar' ? 'flex' : 'hidden md:flex'
      }`}
    >
      {/* Scrollable top area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-7 pt-7 pb-3">

        {/* Title */}
        <h1 className="font-serif font-bold text-[22px] text-[#1F1B16] m-0 mb-0.5 flex items-center gap-2 leading-tight">
          <span className="w-2 h-2 rounded-full bg-[#1F1B16] inline-block flex-shrink-0 mt-0.5"></span>
          BookChat Shelf
        </h1>
        <p className="italic text-[11px] text-[#8c7f67] mb-5 font-serif tracking-wide">
          Volume IV · Active Dialogues
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="search archives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            aria-label="Search ledger entries"
            className="w-full bg-transparent border-none outline-none text-[12px] text-[#3B352C] placeholder-[#bdb099] font-serif py-1.5 border-b border-[#D0C2A8] focus:border-[#8c7f67] transition-colors"
          />
        </div>

        {/* Edit + Write to member button */}
        <button
          type="button"
          onClick={() => setShowSwitcher(true)}
          className="w-full bg-[#6B3A2A] hover:bg-[#7A4330] active:bg-[#5A2E1C] text-[#F4ECDD] font-serif text-[12px] font-bold py-2.5 px-4 rounded-[6px] mb-6 transition-all duration-200 cursor-pointer border-none shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.3)] select-none tracking-wide"
          aria-label="Edit book or write to member"
        >
          edit &nbsp;+&nbsp; Write to member
        </button>

        {/* Conversations */}
        <div className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#9a8c78] mb-3 font-bold">
          Conversations
        </div>

        <div className="flex flex-col gap-0.5">
          {!bookDetails?.conversations?.length ? (
            <div className="text-[11px] text-[#8c7f67] italic font-serif py-2">
              No conversations yet.
            </div>
          ) : (
            bookDetails.conversations.map((c: any) => {
              const isActive = c.id === activeConversationId
              const hasUnread = c.unreadCount > 0

              // Build a display name for the conversation
              const convName = c.name || (c.isGroup ? bookDetails.name || 'General Thread' : 'Private Dialogue')

              // Find first other member for avatar display
              const otherMembers = bookDetails?.members?.filter((m: any) => m.userId !== user.id) || []
              const firstOther = otherMembers[0]
              const avatarName = c.isGroup
                ? (convName || 'G')
                : (firstOther?.user?.displayName || convName || 'P')
              const initials = c.isGroup && (convName === bookDetails?.name || convName === 'General Thread')
                ? (bookDetails?.name ? bookDetails.name.slice(0, 4).toLowerCase() : 'book')
                : getInitials(avatarName)
              const bgColor = avatarColor(convName)

              // Find a "last active" member
              const lastMember = bookDetails?.members?.find((m: any) => onlineUsers.has(m.userId) && m.userId !== user.id)
              const activeScribeName = lastMember?.user?.displayName || (bookDetails?.members?.[0]?.user?.displayName || 'Aryan')

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
                  aria-label={`Open conversation: ${convName}${hasUnread ? `, ${c.unreadCount} new messages` : ''}`}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[4px] cursor-pointer transition-all duration-150 select-none group ${
                    isActive
                      ? 'bg-[#EDE0C4] border-l-[3px] border-[#6B3A2A] shadow-sm'
                      : 'border-l-[3px] border-transparent hover:bg-[#EDE0C4]/50'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-serif text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: bgColor }}
                  >
                    {initials.length > 2 ? (
                      <span className="text-[8px] font-bold tracking-tight leading-none text-center px-0.5">{initials}</span>
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-serif text-[13px] font-bold truncate ${isActive ? 'text-[#1F1B16]' : 'text-[#2C2418]'}`}>
                        {convName}
                      </span>
                      {hasUnread && (
                        <span className="flex-shrink-0 bg-[#A63F3F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#9a8c78] font-serif mt-0.5 truncate">
                      {activeScribeName} · Active
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Search results if any */}
        {(searching || searchResults !== null) && (
          <div className="mt-5 border-t border-dashed border-black/10 pt-4">
            <div className="text-[10px] font-sans uppercase tracking-[0.18em] text-[#9a8c78] mb-2 font-bold">
              Search Results
            </div>
            {searching ? (
              <div className="text-[10px] text-[#8c7f67] italic font-serif py-2">Consulting log books...</div>
            ) : searchResults?.length === 0 ? (
              <div className="text-[10px] text-[#8c7f67] italic font-serif py-2">No matching entries found.</div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                {searchResults?.map((msg: any) => (
                  <div
                    key={msg.id}
                    onClick={() => handleJumpToMessage(msg)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleJumpToMessage(msg) } }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Jump to message from ${msg.sender?.displayName || 'Scribe'}`}
                    className="bg-[#F4ECDD]/50 border border-black/5 hover:bg-[#F4ECDD] rounded p-2 cursor-pointer transition text-left paper-card-hover"
                  >
                    <div className="flex justify-between text-[8px] text-[#8c7f67] mb-1 font-sans uppercase tracking-wider">
                      <span>{msg.sender?.displayName || 'Scribe'}</span>
                      <span>{new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <p className="text-[10px] text-[#3B352C] font-serif leading-relaxed m-0 italic truncate">
                      {highlightText(msg.content, searchQuery)}
                    </p>
                  </div>
                ))}
                {searchTotalPages > 1 && (
                  <div className="flex justify-between items-center text-[9px] text-[#8c7f67] mt-2 font-serif">
                    <button disabled={searchPage === 1} onClick={() => handleSearch(searchPage - 1)} className="text-[#B08D57] disabled:opacity-30 hover:underline cursor-pointer bg-none border-none p-0">Prev</button>
                    <span>Page {searchPage} of {searchTotalPages}</span>
                    <button disabled={searchPage === searchTotalPages} onClick={() => handleSearch(searchPage + 1)} className="text-[#B08D57] disabled:opacity-30 hover:underline cursor-pointer bg-none border-none p-0">Next</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom User Rail */}
      <div className="flex-shrink-0 border-t border-[#D0C2A8]/60 px-7 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Dark avatar circle */}
          <div
            className="w-9 h-9 rounded-full bg-[#1F1B16] flex items-center justify-center text-[#F4ECDD] flex-shrink-0 shadow-md overflow-hidden"
            aria-hidden="true"
          >
            <span className="font-serif text-[11px] font-bold select-none">
              {getInitials(user.displayName || user.email || '?')}
            </span>
          </div>
          <div>
            <div className="font-serif font-bold text-[11px] text-[#1F1B16] uppercase tracking-wider leading-tight">
              {user.displayName || 'Scribe'}
            </div>
            <div className="font-serif text-[9px] text-[#8c7f67] mt-0.5">
              Vol. III · Curator
            </div>
          </div>
        </div>
        <button
          onClick={onShowSettings}
          className="font-serif text-[12px] text-[#5c5040] hover:text-[#1F1B16] transition cursor-pointer bg-none border-none p-0 select-none"
          aria-label="Open settings panel"
        >
          settings
        </button>
      </div>
    </div>
  )
}
