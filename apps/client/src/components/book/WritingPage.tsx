import React from 'react'
import { PageHeader } from './PageHeader'
import { RibbonBookmarkTab } from './RibbonBookmarkTab'
import { MessageEntry } from './MessageEntry'
import { ComposerBar } from './ComposerBar'

interface WritingPageProps {
  user: any
  currentBook: any
  bookDetails: any
  messages: any[] | null
  loadingMessages: boolean
  fetchingMore: boolean
  highlightedMessageId: string | null
  searchQuery: string
  highlightText: (text: string, search: string) => React.ReactNode
  typingUsers: Record<string, string>
  renderTypingText: () => string | null
  composerText: string
  handleComposerChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleSendMessage: () => void
  handleToggleDefault: () => void
  updatingDefault: boolean
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
  messageContainerRef: React.RefObject<HTMLDivElement | null>
  handleCopyInviteCode: () => void
  mobileActivePage: 'sidebar' | 'writing'
  onMobileBack: () => void
}

export const WritingPage: React.FC<WritingPageProps> = ({
  user,
  currentBook,
  bookDetails,
  messages,
  loadingMessages,
  fetchingMore,
  highlightedMessageId,
  searchQuery,
  highlightText,
  typingUsers,
  renderTypingText,
  composerText,
  handleComposerChange,
  handleKeyDown,
  handleSendMessage,
  handleToggleDefault,
  updatingDefault,
  handleScroll,
  messageContainerRef,
  handleCopyInviteCode,
  mobileActivePage,
  onMobileBack
}) => {
  return (
    <div
      id="tour-writing-area"
      className={`w-full md:w-1/2 h-full flex flex-col border-l border-black/5 shadow-[inset_20px_0_30px_rgba(0,0,0,0.04)] ruled-paper paper-texture overflow-hidden ${
        mobileActivePage === 'writing' ? 'flex' : 'hidden md:flex'
      }`}
    >
      {/* Ribbon Bookmark — top-right copy invite code tab */}
      <RibbonBookmarkTab onClick={handleCopyInviteCode} />

      {/* Mobile back button */}
      {mobileActivePage === 'writing' && (
        <div className="md:hidden px-6 pt-4 pb-0">
          <button
            onClick={onMobileBack}
            className="text-[11px] text-[#B08D57] hover:text-[#4A3223] transition font-serif cursor-pointer bg-none border-none p-0 select-none"
          >
            ← Back to Shelf
          </button>
        </div>
      )}

      {/* Header — fixed at top */}
      <div className="flex-shrink-0 px-8 pt-7">
        <PageHeader
          bookName={bookDetails?.name || currentBook.name}
          isDefault={user.defaultBookId === (bookDetails?.id || currentBook.id)}
          updatingDefault={updatingDefault}
          onToggleDefault={handleToggleDefault}
          onCopyInvite={handleCopyInviteCode}
        />
      </div>

      {/* Message Log — scrollable */}
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth-active px-8 py-2 flex flex-col"
      >
        {loadingMessages ? (
          /* Skeleton Loaders */
          <div className="flex flex-col gap-0 animate-fade-in">
            {/* Left skeleton */}
            <div className="py-3 border-b border-[#D0C2A8]/30">
              <div className="h-2 w-24 bg-[#D0C2A8]/60 rounded mb-2 animate-pulse" />
              <div className="h-2.5 w-4/5 bg-[#D0C2A8]/40 rounded mb-1 animate-pulse" />
              <div className="h-2.5 w-3/5 bg-[#D0C2A8]/30 rounded animate-pulse" />
            </div>
            {/* Right skeleton */}
            <div className="py-3 border-b border-[#D0C2A8]/30 flex flex-col items-end">
              <div className="h-2 w-20 bg-[#D0C2A8]/60 rounded mb-2 animate-pulse" />
              <div className="h-2.5 w-4/5 bg-[#D0C2A8]/40 rounded mb-1 animate-pulse" />
              <div className="h-2.5 w-2/5 bg-[#D0C2A8]/30 rounded animate-pulse" />
            </div>
            {/* Left skeleton 2 */}
            <div className="py-3 border-b border-[#D0C2A8]/30">
              <div className="h-2 w-20 bg-[#D0C2A8]/60 rounded mb-2 animate-pulse" />
              <div className="h-2.5 w-3/5 bg-[#D0C2A8]/40 rounded animate-pulse" />
            </div>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[12px] text-[#9a8c78] italic font-serif text-center leading-relaxed max-w-[220px]">
              No ink has been spilled in this journal yet.<br />Write below to begin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {fetchingMore && (
              <div className="text-[9px] text-[#8c7f67] italic text-center py-2 border-b border-dashed border-[#B08D57]/20 mb-2 font-serif">
                📜 Unrolling older entries…
              </div>
            )}
            {messages.slice(-100).map((msg) => {
              const isMe = msg.senderId === user.id
              const isHighlighted = msg.id === highlightedMessageId
              return (
                <MessageEntry
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  isHighlighted={isHighlighted}
                  highlightText={highlightText}
                  searchQuery={searchQuery}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="flex-shrink-0 px-8 py-1.5 flex items-center gap-1.5 text-[10px] text-[#8c7f67] italic animate-pulse font-serif">
          <span>✒️</span>
          <span>{renderTypingText()}</span>
        </div>
      )}

      {/* Composer Bar — always at bottom */}
      <ComposerBar
        composerText={composerText}
        onChange={handleComposerChange}
        onKeyDown={handleKeyDown}
        onSend={handleSendMessage}
      />
    </div>
  )
}
