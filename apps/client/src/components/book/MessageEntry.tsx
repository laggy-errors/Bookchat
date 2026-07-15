import React, { useEffect, useState } from 'react'

interface MessageEntryProps {
  msg: any
  isMe: boolean
  isHighlighted: boolean
  highlightText: (text: string, search: string) => React.ReactNode
  searchQuery: string
}

// Track which message IDs have already been animated in this session
// (module-level so it persists across re-renders without triggering re-render itself)
const animatedIds = new Set<string>()

export const MessageEntry = React.memo<MessageEntryProps>(({
  msg,
  isMe,
  isHighlighted,
  highlightText,
  searchQuery
}) => {
  const timestamp = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Only play ink animations if this message hasn't been seen before
  const isNew = !animatedIds.has(msg.id)
  const [animate, setAnimate] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      animatedIds.add(msg.id)
      // Remove animation classes after they complete so they don't replay
      const timer = setTimeout(() => setAnimate(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [msg.id, isNew])

  const animClass = animate ? 'ink-bleed ink-reveal-active' : ''

  if (isMe) {
    return (
      <div
        className={`flex flex-col items-end text-right pl-12 pr-3 border-r-2 border-[#B08D57]/70 py-1 mb-5 transition-colors duration-1000 ${animClass} ${
          isHighlighted ? 'bg-[#B08D57]/20 rounded-l' : ''
        }`}
      >
        <span className="text-[8px] font-sans uppercase tracking-widest text-[#8c7f67]/80 mb-1 select-none">
          {timestamp} YOU {msg.status === 'pending' ? '· writing...' : msg.status === 'failed_pending_retry' ? '· retry pending...' : msg.status === 'failed' ? '· failed' : ''}
        </span>
        <span className="text-[17px] text-[#1F1B16] font-handwritten leading-loose italic block break-words max-w-full">
          {highlightText(msg.content, searchQuery)}
        </span>
      </div>
    )
  } else {
    return (
      <div
        className={`flex flex-col items-start text-left pr-12 pl-3 py-1 mb-5 transition-colors duration-1000 ${animClass} ${
          isHighlighted ? 'bg-[#B08D57]/20 rounded-r' : ''
        }`}
      >
        <span className="text-[8px] font-sans uppercase tracking-widest text-[#B08D57]/90 mb-1 select-none">
          {(msg.sender?.displayName || 'Scribe').toUpperCase()} · {timestamp}
        </span>
        <span className="text-[17px] text-[#3B352C] font-handwritten leading-loose block break-words max-w-full font-normal">
          {highlightText(msg.content, searchQuery)}
        </span>
      </div>
    )
  }
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.status === nextProps.msg.status &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.isMe === nextProps.isMe &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.searchQuery === nextProps.searchQuery
  )
})
