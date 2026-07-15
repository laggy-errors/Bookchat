import React from 'react'

interface RibbonBookmarkTabProps {
  onClick?: () => void
}

export const RibbonBookmarkTab: React.FC<RibbonBookmarkTabProps> = ({ onClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div 
      id="tour-invite"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Copy ledger invite code bookmark"
      className="absolute top-[-6px] right-[45px] w-6 h-20 bg-[#52664A] z-20 cursor-pointer shadow-md ribbon-sway hover:brightness-110 transition-all focus:brightness-110"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)' }}
      title="Bookmark Tab - Copy Invite Code"
    >
      {/* Thread design stripe */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-white/10" />
    </div>
  )
}
