import { useRef, useState } from 'react'
import { ThemeToggleButton } from '../ThemeContext.jsx'

const wrappedTextStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export default function UploadScreen({ onFile, loading }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (file && file.name.endsWith('.csv')) {
      onFile(file)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div className="min-h-screen flex flex-col bg-(--c-bg) relative">
      <div className="absolute top-4 right-6">
        <ThemeToggleButton />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="text-(--c-ink) leading-tight text-4xl sm:text-5xl mb-4" style={{fontFamily: '-apple-system,"system-ui","Segoe UI",Helvetica,Arial,sans-serif', fontWeight: 800, letterSpacing: '-0.025em'}}>
              Cam<span className="text-(--c-accent)">Log</span>{' '}
              <span style={{...wrappedTextStyle, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: 'normal'}}>Wrapped</span>
            </h1>
            <p className="text-sm text-(--c-ink2) font-['DM_Sans']">
              Your production, wrapped.
            </p>
          </div>

          <div
            onClick={() => !loading && inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${dragging
                ? 'border-(--c-accent) bg-(--c-accent)/5'
                : 'hover:border-(--c-accent)/50'
              }
              ${loading ? 'pointer-events-none opacity-60' : ''}
            `}
            style={{
              borderColor: dragging ? undefined : 'var(--c-dropzone-border)',
              backgroundColor: dragging ? undefined : 'var(--c-dropzone-bg)',
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--c-ink3)">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <p className="text-(--c-ink) text-sm font-['DM_Sans'] font-medium">
                Attach CSV here
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  )
}
