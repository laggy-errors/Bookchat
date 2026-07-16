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
    // Current User: Right-aligned, italic serif, looks like handwritten ink, -1deg rotation, no background
    return (
      <div
        className={`flex flex-col items-end text-right py-4 mb-4 transition-all duration-500 ${animClass} ${
          isHighlighted ? 'bg-[#C8A96A]/10' : ''
        }`}
        style={{ transform: 'rotate(-1deg)', transformOrigin: 'right center' }}
      >
        {/* Timestamp header */}
        <div className="flex items-baseline gap-2 mb-1 select-none">
          <span className="text-[9px] font-sans text-[#8A5B44]/70 tracking-wider">
            {timestamp}
          </span>
          <span className="text-[9px] font-sans font-bold text-[#8A5B44] tracking-widest uppercase">
            YOU
          </span>
        </div>
        {/* Message body: Italic EB Garamond (looks like handwriting) */}
        <p 
          className="font-serif text-[15px] italic text-[#2D2116] leading-[40px] m-0 max-w-[85%] break-words outline-none"
          style={{ letterSpacing: '0.02em' }}
        >
          {highlightText(msg.content, searchQuery)}
        </p>
      </div>
    )
  } else {
    // Other User: Left-aligned, small uppercase brown name, EB Garamond readable serif, no bubbles
    return (
      <div
        className={`flex flex-col items-start text-left py-4 mb-4 transition-colors duration-500 ${animClass} ${
          isHighlighted ? 'bg-[#C8A96A]/10' : ''
        }`}
      >
        {/* Sender + timestamp */}
        <div className="flex items-baseline gap-2 mb-1 select-none">
          <span className="text-[9px] font-sans font-bold text-[#8A5B44] tracking-widest uppercase">
            {senderName}
          </span>
          <span className="text-[9px] font-sans text-[#8A5B44]/70 tracking-wider">
            {timestamp}
          </span>
        </div>
        {/* Message body: EB Garamond readable serif */}
        <p className="font-serif text-[15px] text-[#2D2116] leading-[40px] m-0 max-w-[85%] break-words">
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
