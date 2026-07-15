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
      className={`w-full md:w-1/2 h-full flex flex-col justify-between p-6 md:p-10 md:pl-[38px] border-l border-black/5 shadow-[inset_30px_0_40px_rgba(0,0,0,0.06)] ruled-paper paper-texture ${
        mobileActivePage === 'writing' ? 'flex' : 'hidden md:flex'
      }`}
    >
      {/* Ribbon Bookmark copy invite code tab */}
      <RibbonBookmarkTab onClick={handleCopyInviteCode} />

      <div>
        <div className="flex items-center gap-3 mb-2 md:hidden">
          {/* Calligraphy Mobile Back Arrow */}
          <button 
            onClick={onMobileBack}
            className="text-xs text-[#B08D57] hover:text-[#4A3223] transition-all cursor-pointer font-serif select-none font-bold uppercase tracking-wider"
            title="Return to directories"
          >
            ← Shelf Entries
          </button>
        </div>

        <PageHeader 
          bookName={bookDetails?.name || currentBook.name}
          isDefault={user.defaultBookId === (bookDetails?.id || currentBook.id)}
          updatingDefault={updatingDefault}
          onToggleDefault={handleToggleDefault}
        />

        {/* Dynamic ruled notebook paper message log */}
        <div 
          ref={messageContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pr-2 my-2 flex flex-col gap-4 max-h-[350px] custom-scrollbar scroll-smooth-active"
        >
          {loadingMessages ? (
            <div className="flex flex-col gap-6 py-4 animate-fade-in w-full">
              {/* Message Placeholder A (Left) */}
              <div className="flex flex-col items-start w-3/4 max-w-[280px] pl-4 pr-3 py-2 bg-[#ede3d0]/30 rounded border-l-2 border-[#B08D57]/20 animate-pulse">
                <div className="h-2.5 w-16 bg-[#B08D57]/20 rounded mb-2"></div>
                <div className="h-2 w-full bg-[#EDE3D0]/60 rounded mb-1"></div>
                <div className="h-2 w-5/6 bg-[#EDE3D0]/40 rounded"></div>
              </div>
              {/* Message Placeholder B (Right) */}
              <div className="flex flex-col items-end w-3/4 max-w-[280px] ml-auto pr-4 pl-3 py-2 bg-[#ede3d0]/30 rounded border-r-2 border-[#B08D57]/20 animate-pulse">
                <div className="h-2.5 w-12 bg-[#B08D57]/20 rounded mb-2"></div>
                <div className="h-2 w-full bg-[#EDE3D0]/60 rounded mb-1"></div>
                <div className="h-2 w-3/4 bg-[#EDE3D0]/40 rounded"></div>
              </div>
              {/* Message Placeholder C (Left) */}
              <div className="flex flex-col items-start w-3/4 max-w-[280px] pl-4 pr-3 py-2 bg-[#ede3d0]/30 rounded border-l-2 border-[#B08D57]/20 animate-pulse">
                <div className="h-2.5 w-20 bg-[#B08D57]/20 rounded mb-2"></div>
                <div className="h-2 w-5/6 bg-[#EDE3D0]/60 rounded"></div>
              </div>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-xs text-[#8c7f67] italic text-center py-10 font-serif">
              No ink has been spilled in this journal yet. Write below to begin.
            </div>
          ) : (
            <>
              {fetchingMore && (
                <div className="text-[9px] text-[#8c7f67] italic text-center py-1 border-b border-dashed border-[#B08D57]/20 mb-2 font-serif">
                  📜 Unrolling older entries...
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
            </>
          )}
        </div>
      </div>

      <div>
        {/* Subtle Typing Indicator Print */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="px-4 py-1 text-[10px] text-[#8c7f67] italic animate-pulse flex items-center gap-1.5 font-serif text-left mb-2">
            <span>✒️</span>
            <span>{renderTypingText()}</span>
          </div>
        )}

        {/* Bottom Composer Capsule */}
        <ComposerBar 
          composerText={composerText}
          onChange={handleComposerChange}
          onKeyDown={handleKeyDown}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  )
}
