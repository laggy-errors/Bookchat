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
      aria-label="Fabric archive bookmark"
      className="absolute top-0 right-[40px] w-5 h-24 bg-[#6D3F2C] z-30 cursor-pointer shadow-[2px_4px_8px_rgba(35,20,10,0.22)] ribbon-sway hover:brightness-110 transition-all focus:brightness-110 select-none"
      style={{ 
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(0,0,0,0.2)'
      }}
      title="Fabric Bookmark - Invite Scribes"
    >
      {/* Thread stripe detail to feel woven */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-black/15" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-black/35" />
    </div>
  )
}
