import React from 'react'

interface ContentAreaProps {
  children?: React.ReactNode
  className?: string
}

export const ContentArea: React.FC<ContentAreaProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex-1 overflow-y-auto flex flex-col pr-[6px] ${className}`}>
      {children || <div className="text-stone-500 italic text-sm m-auto">Content Area Placeholder</div>}
    </div>
  )
}
