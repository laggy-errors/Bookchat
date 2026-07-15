import React from 'react'

interface BookShellProps {
  children?: React.ReactNode
  className?: string
}

export const BookShell: React.FC<BookShellProps> = ({ children, className = '' }) => {
  return (
    <div className={`book-outer book-shadow paper-texture w-[1120px] h-[700px] relative ${className}`}>
      {/* 3D Page stack edge effect */}
      <div className="pages-stack-effect absolute inset-[12px]"></div>
      
      {/* Open book page spread container */}
      <div className="spread absolute inset-[16px] flex overflow-hidden">
        {/* Center Spine Gutter */}
        <div className="gutter absolute left-1/2 top-0 bottom-0 w-[50px] -translate-x-1/2 pointer-events-none z-10">
          <div className="gutter-line absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-black/15"></div>
          <div className="stitch-top absolute left-1/2 -translate-x-1/2 top-[12px] w-[8px] height-[12px] border-l-2 border-r-2 border-black/25"></div>
          <div className="stitch-bottom absolute left-1/2 -translate-x-1/2 bottom-[12px] w-[8px] height-[12px] border-l-2 border-r-2 border-black/25"></div>
        </div>
        
        {children}
      </div>
    </div>
  )
}
