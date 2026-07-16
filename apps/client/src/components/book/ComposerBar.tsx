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
    <div className="flex-shrink-0 border-t border-[#503723]/15 bg-transparent select-none">
      <div className="flex items-center gap-0">

        {/* Attachment stamp */}
        <span className="flex-shrink-0 font-serif text-[11px] uppercase tracking-wider text-[#8A5B44] px-5 py-4 border-r border-[#503723]/15 select-none opacity-80">
          attachment
        </span>

        {/* Text area (writing page lines cursor) */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Write on page..."
          value={composerText}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={500}
          aria-label="Journal message input"
          className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#2D2116] placeholder-[#8A5B44]/50 font-serif resize-none max-h-24 px-5 py-4 custom-scrollbar leading-[24px] fountain-pen-cursor"
          style={{ height: 'auto' }}
        />

        {/* Circular Wax Seal Send button */}
        <div className="px-5 py-3 flex-shrink-0 flex items-center justify-center">
          <button
            type="button"
            onClick={onSend}
            disabled={!composerText.trim() || composerText.length > 500}
            aria-label="Spill ink message"
            className="w-8 h-8 rounded-full bg-[#6D3F2C] hover:bg-[#8A5B44] text-[#F8F3E8] flex items-center justify-center font-serif text-[11px] font-bold shadow-[0_2px_6px_rgba(50,30,10,0.22)] cursor-pointer hover:rotate-4 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed select-none border-none outline-none"
            title="Press Enter to send"
          >
            ✒️
          </button>
        </div>
      </div>

      {/* Character limit overlay */}
      {composerText.length > 400 && (
        <div className="flex justify-end px-5 pb-1 text-[8px] font-sans text-[#8A5B44]/60">
          <span
            aria-live="polite"
            className={composerText.length > 480 ? 'text-[#6D3F2C] font-bold' : ''}
          >
            {composerText.length}/500
          </span>
        </div>
      )}
    </div>
  )
}
