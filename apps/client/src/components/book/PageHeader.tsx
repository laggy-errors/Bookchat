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
    <div className="flex-shrink-0 border-b border-[#D0C2A8]/50 pb-4 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif font-bold text-[22px] text-[#1F1B16] m-0 mb-1 leading-tight truncate">
            {bookName}
          </h1>
          <p className="text-[11px] text-[#B08D57] font-serif m-0 tracking-wide">
            Started on Oct 14th, 1894
          </p>
        </div>

        {/* More options / actions */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <button
            onClick={onToggleDefault}
            disabled={updatingDefault}
            title={isDefault ? 'Remove as Default Journal' : 'Set as Default Journal'}
            aria-label={isDefault ? 'Remove journal from defaults' : 'Set journal as default'}
            className="text-[#8c7f67] hover:text-[#4A3223] transition cursor-pointer bg-none border-none p-0 select-none disabled:opacity-50 font-sans text-xs leading-none"
          >
            <span className="font-serif text-base">{isDefault ? '⭐' : '☆'}</span>
          </button>
          {onCopyInvite && (
            <button
              onClick={onCopyInvite}
              title="Copy invite code"
              aria-label="Copy invite code for this journal"
              className="text-[11px] font-sans text-[#8c7f67] hover:text-[#4A3223] transition cursor-pointer bg-none border-none p-0 select-none leading-none tracking-wide"
            >
              more_vert
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
