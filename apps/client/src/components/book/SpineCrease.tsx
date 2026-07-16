import React from 'react'

export const SpineCrease: React.FC = () => {
  return (
    <div className="absolute left-1/2 top-0 bottom-0 w-[32px] -translate-x-1/2 flex pointer-events-none z-10">
      {/* Left gradient shadow */}
      <div className="w-[14px] h-full" style={{
        background: 'linear-gradient(to right, rgba(0,0,0,0.0), rgba(0,0,0,0.08))'
      }} />
      {/* Center spine line */}
      <div className="w-[4px] h-full bg-[#3C3830]/20" />
      {/* Right gradient shadow */}
      <div className="w-[14px] h-full" style={{
        background: 'linear-gradient(to left, rgba(0,0,0,0.0), rgba(0,0,0,0.08))'
      }} />
    </div>
  )
}
