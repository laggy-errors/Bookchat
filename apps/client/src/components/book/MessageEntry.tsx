import React, { useEffect, useState } from 'react'

interface MessageEntryProps {
  msg: any
  isMe: boolean
  isHighlighted: boolean
  highlightText: (text: string, search: string) => React.ReactNode
  searchQuery: string
}

// Track which message IDs have already been animated in this session
const animatedIds = new Set<string>()

export const MessageEntry = React.memo<MessageEntryProps>((({
  msg,
  isMe,
  isHighlighted,
  highlightText,
  searchQuery
}) => {
  const timestamp = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const senderName = (msg.sender?.displayName || 'Scribe').toUpperCase()

  const isNew = !animatedIds.has(msg.id)
  const [animate, setAnimate] = useState(isNew)

  useEffect(() => {
    if (isNew) {
      animatedIds.add(msg.id)
      const timer = setTimeout(() => setAnimate(false), 800)
      return () => clearTimeout(timer)
    }
  }, [msg.id, isNew])

  const animClass = animate ? 'ink-bleed' : ''

  if (isMe) {
    // Right-aligned "YOU" message — italic, right border
    return (
      <div
        className={`flex flex-col items-end text-right py-3 border-b border-[#D0C2A8]/30 transition-colors duration-500 ${animClass} ${
          isHighlighted ? 'bg-[#B08D57]/10' : ''
        }`}
      >
        {/* Timestamp row */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[9px] font-sans text-[#9a8c78] tracking-wider">
            {timestamp}
          </span>
          <span className="text-[9px] font-sans font-bold text-[#9a8c78] tracking-widest uppercase">
            YOU
            {msg.status === 'pending' ? ' · writing…' : ''}
            {msg.status === 'failed_pending_retry' ? ' · pending retry…' : ''}
            {msg.status === 'failed' ? ' · failed' : ''}
          </span>
        </div>
        {/* Message text — italic, serif */}
        <p className="font-serif text-[14px] text-[#2C2418] italic leading-relaxed m-0 max-w-full break-words">
          {highlightText(msg.content, searchQuery)}
        </p>
      </div>
    )
  } else {
    // Left-aligned message — sender name + time above
    return (
      <div
        className={`flex flex-col items-start text-left py-3 border-b border-[#D0C2A8]/30 transition-colors duration-500 ${animClass} ${
          isHighlighted ? 'bg-[#B08D57]/10' : ''
        }`}
      >
        {/* Sender + timestamp row */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[9px] font-sans font-bold text-[#9a8c78] tracking-widest uppercase">
            {senderName}
          </span>
          <span className="text-[9px] font-sans text-[#9a8c78] tracking-wider">
            {timestamp}
          </span>
        </div>
        {/* Message text — plain serif */}
        <p className="font-serif text-[14px] text-[#2C2418] leading-relaxed m-0 max-w-full break-words">
          {highlightText(msg.content, searchQuery)}
        </p>
      </div>
    )
  }
}), (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.status === nextProps.msg.status &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.isMe === nextProps.isMe &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.searchQuery === nextProps.searchQuery
  )
})
