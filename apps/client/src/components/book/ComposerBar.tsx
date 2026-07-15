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

  // Auto-grow calculation on change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`
    }
  }, [composerText])

  return (
    <div className="bg-[#EDE3D0] rounded-[16px] px-4 py-3 flex flex-col gap-1.5 shadow-inner border border-black/5 relative">
      <div className="flex items-center justify-between gap-3">
        <textarea 
          ref={textareaRef}
          rows={1}
          placeholder="Write on page... (Shift+Enter for new line)"
          value={composerText}
          onChange={onChange}
          onKeyDown={onKeyDown}
          maxLength={500}
          aria-label="Journal ledger message input"
          className="bg-transparent border-none outline-none flex-1 text-xs text-[#1F1B16] placeholder-[#a89877] font-serif resize-none max-h-24 py-0.5 custom-scrollbar"
          style={{ height: 'auto' }}
        />
        <button 
          type="button"
          onClick={onSend}
          disabled={!composerText.trim() || composerText.length > 500}
          aria-label="Send ink message to ledger"
          className="text-sm text-[#8c7f67] hover:text-[#4A3223] disabled:opacity-30 disabled:hover:text-[#8c7f67] cursor-pointer hover:scale-115 active:scale-95 transition bg-none border-none p-0 flex items-center justify-center self-end mb-0.5 touch-target"
          title="Press Enter to send"
        >
          {/* Calligraphy Fountain Pen Nib SVG */}
          <svg className="w-5 h-5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2s-3 4-3 9c0 3.5 2.5 5 3 7h0c.5-2 3-3.5 3-7 0-5-3-9-3-9z" />
            <line x1="12" y1="2" x2="12" y2="12" />
            <circle cx="12" cy="12" r="1.2" fill="currentColor" />
          </svg>
        </button>
      </div>
      
      {/* Footer character limit overlay */}
      {composerText.length > 0 && (
        <div className="flex justify-end text-[8px] font-sans tracking-wide text-[#8c7f67]/60">
          <span
            aria-live="polite"
            aria-atomic="true"
            aria-label={`${composerText.length} of 500 characters used`}
            className={composerText.length > 450 ? 'text-[#7A3B2E] font-bold' : ''}
          >
            {composerText.length}/500
          </span>
        </div>
      )}
    </div>
  )
}
