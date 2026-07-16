import React from 'react'

interface LeftHardcoverNavProps {
  onShowSwitcher: () => void
  onGoToShelf: () => void
  onLogout: () => void
  onShowSettings: () => void
}

export const LeftHardcoverNav: React.FC<LeftHardcoverNavProps> = ({
  onShowSwitcher,
  onGoToShelf,
  onLogout,
  onShowSettings
}) => {
  return (
    <div className="hidden md:flex absolute left-[-42px] top-10 bottom-10 w-9 bg-[#2D2116] rounded-l-[12px] flex-col items-center py-6 gap-6 shadow-[-5px_5px_15px_rgba(0,0,0,0.5)] border-r border-[#6D3F2C]/30 z-0">
      <button 
        type="button"
        onClick={onGoToShelf}
        className="text-[#C8A96A] hover:text-[#F8F3E8] hover:scale-110 active:scale-95 transition cursor-pointer text-base bg-none border-none p-0 touch-target"
        title="Bookshelf"
        aria-label="Bookshelf directories"
      >
        📖
      </button>
      <button 
        type="button"
        onClick={onShowSwitcher}
        className="text-[#C8A96A] hover:text-[#F8F3E8] hover:scale-110 active:scale-95 transition cursor-pointer text-base bg-none border-none p-0 touch-target"
        title="Change Book"
        aria-label="Switch journal ledger"
      >
        🎗️
      </button>
      <button 
        type="button"
        onClick={onShowSettings}
        className="text-[#C8A96A] hover:text-[#F8F3E8] hover:scale-110 active:scale-95 transition cursor-pointer text-base bg-none border-none p-0 touch-target"
        title="Ledger Settings"
        aria-label="Open ledger settings"
      >
        ⚙️
      </button>
        <button 
          type="button"
          onClick={onLogout}
          className="text-[#8A5B44] hover:text-[#F8F3E8] hover:scale-110 active:scale-95 transition cursor-pointer text-base bg-none border-none p-0 mt-auto touch-target"
          title="Logout Scribe"
          aria-label="Logout scribe profile"
        >
          🚪
        </button>
    </div>
  )
}
