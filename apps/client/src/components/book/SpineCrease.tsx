import React from 'react'

export const SpineCrease: React.FC = () => {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-[50px] -translate-x-1/2 flex pointer-events-none z-10">
      <div className="w-1/2 h-full gutter-gradient-left"></div>
      <div className="w-[2px] h-full bg-black/15"></div>
      <div className="w-1/2 h-full gutter-gradient-right"></div>
    </div>
  )
}
