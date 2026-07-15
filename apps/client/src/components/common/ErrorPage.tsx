import React from 'react'

interface ErrorPageProps {
  code: 401 | 403 | 404 | 500
  message?: string
  onReset: () => void
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ code, message, onReset }) => {
  const getErrorDetails = () => {
    switch (code) {
      case 401:
        return {
          title: '📜 Scribe Unauthenticated',
          desc: 'Your signature has not been logged in this session ledger. You must log in or sign the registry first.',
          quote: '"Only registered hands may ink these sacred pages."'
        }
      case 403:
        return {
          title: '🔒 Forbidden Archive Section',
          desc: 'Access denied. You do not hold credentials to consult this specific log volume.',
          quote: '"Some passages are sealed in wax for a reason."'
        }
      case 500:
        return {
          title: '🌋 Torn Binding (Server Failure)',
          desc: 'The archives database registry has suffered an internal ink spill. Scribes are recovering the sheets.',
          quote: '"A torn binding loses the finest script."'
        }
      case 404:
      default:
        return {
          title: '🍂 Lost Ledger Page',
          desc: 'The page index you seek has been torn or misplaced from the journal bindings.',
          quote: '"A path taken that is not written in any map."'
        }
    }
  };

  const details = getErrorDetails()

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#1A1009] p-6 font-serif select-none">
      {/* Torn Paper Page wrapper */}
      <div 
        className="relative w-full max-w-lg bg-[#F4ECDD] rounded-[4px] p-12 md:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-[#E3D5B8] text-center paper-texture animate-fade-in"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 98% 95%, 85% 98%, 50% 95%, 15% 98%, 0% 92%)'
        }}
      >
        {/* Soft layout margins */}
        <div className="absolute inset-4 border border-[#E3D5B8]/40 pointer-events-none"></div>

        <span className="text-[10px] font-sans uppercase tracking-widest text-[#7A3B2E] block mb-2 font-bold">
          Archive Error {code}
        </span>
        
        <h1 className="font-display font-bold text-3xl text-[#4A3223] m-0 mb-4">
          {details.title}
        </h1>
        
        <div className="w-16 h-[1.5px] bg-[#B08D57] mx-auto my-4"></div>

        <p className="text-xs text-[#3B352C] leading-relaxed mb-6 font-serif italic text-justify px-4">
          {message || details.desc}
        </p>

        <p className="text-[10px] text-[#8c7f67] italic font-serif mb-8 block">
          {details.quote}
        </p>

        <button
          onClick={onReset}
          className="bg-transparent border border-[#B08D57] hover:bg-[#B08D57]/10 text-[#4A3223] font-bold text-xs py-2.5 px-8 rounded tracking-wider uppercase transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
        >
          Return to Shelf
        </button>
      </div>
    </div>
  )
}

export default ErrorPage
