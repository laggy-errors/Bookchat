import React, { useRef, useEffect } from 'react'

interface ComposerBarProps {
  composerText: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
}

export const ComposerBar: React.FC<ComposerBarProps> = ({
  composerText,
  onChange,
  onKeyDown,
  onSend
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`
    }
  }, [composerText])

  return (
    <div className="flex-shrink-0 border-t border-[#D0C2A8]/60 bg-transparent">
      <div className="flex items-center gap-0">

        {/* Attachment label */}
        <span className="flex-shrink-0 font-serif text-[11px] text-[#9a8c78] px-4 py-3 border-r border-[#D0C2A8]/50 select-none">
          attachment
        </span>

        {/* Text input area */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Write on page..."
          value={composerText}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={500}
          aria-label="Journal ledger message input"
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#2C2418] placeholder-[#bdb099] font-serif resize-none max-h-24 px-4 py-3 custom-scrollbar leading-relaxed"
          style={{ height: 'auto' }}
        />

        {/* Send / edit button */}
        <button
          type="button"
          onClick={onSend}
          disabled={!composerText.trim() || composerText.length > 500}
          aria-label="Send message"
          className="flex-shrink-0 font-serif text-[12px] font-bold text-[#2C2418] hover:text-[#6B3A2A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition px-4 py-3 bg-none border-none select-none border-l border-[#D0C2A8]/50"
          title="Press Enter to send"
        >
          edit
        </button>
      </div>

      {/* Character limit indicator */}
      {composerText.length > 400 && (
        <div className="flex justify-end px-4 pb-1 text-[8px] font-sans text-[#8c7f67]/60">
          <span
            aria-live="polite"
            className={composerText.length > 480 ? 'text-[#7A3B2E] font-bold' : ''}
          >
            {composerText.length}/500
          </span>
        </div>
      )}
    </div>
  )
}
