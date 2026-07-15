import React from 'react'

interface PageHeaderProps {
  bookName: string
  isDefault: boolean
  updatingDefault: boolean
  onToggleDefault: () => void
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  bookName,
  isDefault,
  updatingDefault,
  onToggleDefault
}) => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-[#1F1B16] m-0 mb-1 flex items-center gap-2">
        {bookName}
        <button
          onClick={onToggleDefault}
          disabled={updatingDefault}
          title={isDefault ? 'Remove as Default Journal' : 'Set as Default Journal'}
          aria-label={isDefault ? 'Remove journal from defaults' : 'Set journal as default'}
          className="text-base hover:scale-110 active:scale-95 transition bg-none border-none p-0 cursor-pointer select-none outline-none disabled:opacity-50"
        >
          {isDefault ? '⭐' : '☆'}
        </button>
      </h1>
      <p className="text-[10px] text-[#8a7c62] mb-6 font-serif">Started on Oct 14th, 1894</p>
    </div>
  )
}
