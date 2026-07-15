import React from 'react'

interface SidebarProps {
  children?: React.ReactNode
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => {
  return (
    <aside className={`left-page ${className}`}>
      {children || <div className="text-stone-500 italic text-sm m-auto">Left Page Sidebar Placeholder</div>}
    </aside>
  )
}
