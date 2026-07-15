import React from 'react'

interface NavigationProps {
  children?: React.ReactNode
  className?: string
}

export const Navigation: React.FC<NavigationProps> = ({ children, className = '' }) => {
  return (
    <nav className={`settings-rail flex items-center justify-between border-t border-dashed border-stone-500/20 pt-[14px] mt-[14px] ${className}`}>
      {children || <div className="text-stone-400 italic text-xs">Navigation Placeholder</div>}
    </nav>
  )
}
