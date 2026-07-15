import React from 'react'

interface PageContainerProps {
  children?: React.ReactNode
  className?: string
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <main className={`right-page ruled-paper ${className}`}>
      {children || <div className="text-stone-500 italic text-sm m-auto">Right Page Container Placeholder</div>}
    </main>
  )
}
