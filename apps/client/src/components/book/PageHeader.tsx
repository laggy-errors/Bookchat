import React from 'react'

interface PageHeaderProps {
  bookName: string
  isDefault: boolean
  updatingDefault: boolean
  onToggleDefault: () => void
  onCopyInvite?: () => void
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  bookName,
  isDefault,
  updatingDefault,
  onToggleDefault,
  onCopyInvite
}) => {
  return (
    <div className="flex-shrink-0 border-b border-[#503723]/15 pb-4 mb-2 select-none relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Cormorant Garamond Display Serif Heading */}
          <h1 className="font-display font-bold text-[24px] text-[#2D2116] m-0 mb-1 leading-tight truncate">
            {bookName}
          </h1>
          <p className="text-[11px] text-[#8A5B44] font-serif m-0 tracking-wide">
            Started on Oct 14th, 1894
          </p>
        </div>

        {/* Top Right Action & Stars */}
        <div className="flex items-center gap-3 flex-shrink-0 mt-1">
          <button
            onClick={onToggleDefault}
            disabled={updatingDefault}
            title={isDefault ? 'Remove Default Scribe Log' : 'Set Default Scribe Log'}
            className="text-[#8A5B44] hover:text-[#6D3F2C] transition-colors cursor-pointer bg-none border-none p-0 focus:outline-none disabled:opacity-50"
          >
            <span className="font-serif text-base">{isDefault ? '★' : '☆'}</span>
          </button>
          {onCopyInvite && (
            <button
              onClick={onCopyInvite}
              title="Ledger options / Invite Code"
              className="text-[12px] font-serif text-[#8A5B44] hover:text-[#6D3F2C] transition-colors cursor-pointer bg-none border-none p-0 focus:outline-none tracking-wider font-bold"
            >
              more_vert
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
