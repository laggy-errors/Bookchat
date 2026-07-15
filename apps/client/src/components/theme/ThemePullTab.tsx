import React, { useState, useEffect, useRef } from 'react'

interface ThemePullTabProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
}

export const ThemePullTab: React.FC<ThemePullTabProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    startYRef.current = e.clientY
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    startYRef.current = e.touches[0].clientY
  }

  const handleKeyDownTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen(!isOpen)
    }
  }

  const handleKeyDownSwatch = (e: React.KeyboardEvent<HTMLDivElement>, themeId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onThemeChange(themeId)
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY
      if (isOpen) {
        setDragY(Math.max(-120, Math.min(0, -deltaY)))
      } else {
        setDragY(Math.max(0, Math.min(120, deltaY)))
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = startYRef.current - e.touches[0].clientY
      if (isOpen) {
        setDragY(Math.max(-120, Math.min(0, -deltaY)))
      } else {
        setDragY(Math.max(0, Math.min(120, deltaY)))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (isOpen) {
        if (dragY < -50) {
          setIsOpen(false)
        }
      } else {
        if (dragY > 50) {
          setIsOpen(true)
        }
      }
      setDragY(0)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, isOpen, dragY])

  const themes = [
    { id: 'paper', name: 'Paper Ledger', desc: 'Cream pages, mahogany desk', cover: '#4A3223', accent: '#6B7A4F' },
    { id: 'cabinet', name: 'Brass Cabinet', desc: 'Warm ivory sheets, slate workspace', cover: '#2E2B27', accent: '#8A6A3C' },
    { id: 'library', name: 'Library Log', desc: 'Vintage parchment, oak desk', cover: '#5C2E16', accent: '#8A4F2A' },
    { id: 'corkboard', name: 'Corkboard File', desc: 'Ochre paper, tan board desk', cover: '#7A5A3A', accent: '#A9432E' }
  ]

  return (
    <>
      {/* Theme Drawer Unfolds from bottom */}
      <div 
        className={`fixed bottom-0 left-0 right-0 h-44 bg-[#EDE3D0] border-t border-[#E3D5B8] shadow-[0_-15px_30px_rgba(0,0,0,0.3)] z-40 flex flex-col justify-center p-6`}
        style={{
          transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen 
            ? `translateY(${dragY}px)`
            : `translateY(calc(100% - ${dragY}px))`
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-display font-bold text-sm text-[#4A3223] m-0">🎗️ Desk & Journal Environment Swapper</h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#7A3B2E] hover:underline cursor-pointer bg-none border-none focus:outline-none"
              aria-label="Fold theme selection drawer shut"
            >
              Fold Drawer
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4" role="radiogroup" aria-label="Select journal environment theme">
            {themes.map((theme) => {
              const active = currentTheme === theme.id
              return (
                <div 
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  onKeyDown={(e) => handleKeyDownSwatch(e, theme.id)}
                  tabIndex={0}
                  role="radio"
                  aria-checked={active}
                  aria-label={`Select ${theme.name} environment. ${theme.desc}`}
                  className={`border rounded p-3 cursor-pointer transition flex items-center gap-3 select-none ${
                    active 
                      ? 'bg-[#F4ECDD] border-[#B08D57] shadow-sm' 
                      : 'border-black/5 hover:bg-black/5'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="w-5 h-5 rounded shadow-inner" style={{ backgroundColor: theme.cover }} />
                    <span className="w-5 h-1.5 rounded" style={{ backgroundColor: theme.accent }} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#1F1B16] font-serif">{theme.name}</div>
                    <div className="text-[9px] text-[#8c7f67] font-serif mt-0.5">{theme.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Draggable Ribbon Tab — unified transform in inline style to avoid Tailwind/style conflict */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDownTab}
        tabIndex={0}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fold theme swapper drawer shut" : "Unfold theme swapper drawer open"}
        className="fixed bottom-0 left-1/2 flex flex-col items-center cursor-ns-resize z-50 group focus:outline-none"
        style={{
          transform: isOpen
            ? `translateX(-50%) translateY(${dragY - 176}px)`
            : `translateX(-50%) translateY(${-dragY}px)`,
          transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Ribbon bookmark fabric strip */}
        <div className="w-8 h-20 bg-[#B08D57] shadow-[0_5px_15px_rgba(0,0,0,0.35)] rounded-t-[4px] relative flex flex-col justify-end items-center pb-2 select-none hover:bg-[#9B7744] transition-colors border-t border-black/10">
          <span className="text-[10px] select-none text-[#1F1B16] font-bold group-hover:scale-110 transition-transform">
            {isOpen ? '▼' : '▲'}
          </span>
          <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#1F1B16] select-none mt-1 leading-none">
            Swap
          </span>
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-black/10" />
        </div>
      </div>
    </>
  )
}
