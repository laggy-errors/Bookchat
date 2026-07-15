import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../lib/apiClient'

interface GuidedTourProps {
  user: any
  onComplete: (updatedUser: any) => void
}

interface TourStep {
  targetId: string
  title: string
  content: string
  position: 'left' | 'right' | 'top-right' | 'bottom'
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const steps: TourStep[] = [
    {
      targetId: 'tour-sidebar',
      title: '📖 The Book Shelf (Sidebar)',
      content: 'This left page displays your conversation log folders, direct messages, settings rail, and journal directories.',
      position: 'left',
    },
    {
      targetId: 'tour-writing-area',
      title: '✒️ The Writing Area',
      content: 'This right page is your ruled sheets. Messages are written in ink directly onto the paper with a live fountain pen.',
      position: 'right',
    },
    {
      targetId: 'tour-invite',
      title: '🔖 Ribbon Invite Tab',
      content: 'Pull this cloth bookmark at the top-right corner to copy join codes and invite new scribes to this journal.',
      position: 'top-right',
    },
    {
      targetId: 'tour-theme-tab',
      title: '🎗️ Theme Pull-Tab',
      content: 'Drag or click this bottom-center ribbon to select framing styles (Notebook, Cabinet, Library, or Corkboard).',
      position: 'bottom',
    },
  ]

  // Add temporary overlay visual markers around targets in DOM
  useEffect(() => {
    steps.forEach((step, idx) => {
      const el = document.getElementById(step.targetId)
      if (el) {
        if (idx === currentStep) {
          el.classList.add('ring-4', 'ring-[#B08D57]', 'ring-offset-2', 'ring-offset-[#1E130C]', 'transition-all', 'duration-300')
        } else {
          el.classList.remove('ring-4', 'ring-[#B08D57]', 'ring-offset-2', 'ring-offset-[#1E130C]')
        }
      }
    })

    return () => {
      steps.forEach((step) => {
        const el = document.getElementById(step.targetId)
        if (el) {
          el.classList.remove('ring-4', 'ring-[#B08D57]', 'ring-offset-2', 'ring-offset-[#1E130C]')
        }
      })
    }
  }, [currentStep])

  const handleFinishTour = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ hasSeenTour: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(data.error || 'Failed to complete tour.')
        onComplete(user) // fallback to prevent blocking
      } else {
        onComplete(data)
      }
    } catch (err) {
      console.error(err)
      onComplete(user) // fallback
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinishTour()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const activeStep = steps[currentStep]

  // Determine tooltip overlay alignment
  const getTooltipStyle = (): React.CSSProperties => {
    switch (activeStep.position) {
      case 'left':
        return { top: '35%', left: '42%', transform: 'translateY(-50%)' }
      case 'right':
        return { top: '35%', right: '42%', transform: 'translateY(-50%)' }
      case 'top-right':
        return { top: '15%', right: '12%' }
      case 'bottom':
        return { bottom: '15%', left: '50%', transform: 'translateX(-50%)' }
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 pointer-events-none font-serif">
      {/* Floating Tooltip Box with Paper Lifting & Fade-in */}
      <div 
        className="absolute z-50 w-80 bg-[#F4ECDD] rounded-[6px] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-[#E3D5B8] pointer-events-auto transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 paper-texture animate-fade-in"
        style={getTooltipStyle()}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-sans uppercase tracking-wider text-[#8c7f67]">
            Guided Tour · {currentStep + 1} of {steps.length}
          </span>
          <button 
            onClick={handleFinishTour}
            disabled={loading}
            aria-label="Skip guided tour"
            className="text-xs text-[#7A3B2E] hover:underline cursor-pointer bg-none border-none p-0"
          >
            Skip
          </button>
        </div>

        <h3 className="text-base font-bold text-[#1F1B16] m-0 mb-2">
          {activeStep.title}
        </h3>
        
        <p className="text-xs text-[#3B352C] leading-relaxed mb-4 text-justify italic">
          {activeStep.content}
        </p>

        <div className="flex justify-between items-center border-t border-dashed border-[#B08D57]/30 pt-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || loading}
            aria-label="Previous tour step"
            className="text-xs text-[#6B7A4F] hover:underline cursor-pointer disabled:opacity-30 bg-none border-none p-0"
          >
            &larr; Prev
          </button>
          
          <button
            onClick={handleNext}
            disabled={loading}
            aria-label={currentStep === steps.length - 1 ? 'Finish guided tour' : 'Next tour step'}
            className="bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-bold text-[11px] py-1.5 px-3 rounded shadow-sm transition duration-200 cursor-pointer"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next \u2192'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GuidedTour
