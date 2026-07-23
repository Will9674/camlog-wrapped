import { useRef, useState } from 'react'
import { ThemeToggleButton } from '../ThemeContext.jsx'

const wrappedTextStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export default function UploadScreen({ onFile, onDemo, loading, error }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  // Pass every dropped/selected file straight to App, which validates the type
  // and surfaces a friendly message — so an unsupported file is never a silent
  // no-op the way an extension gate here would be.
  function handleFile(file) {
    if (file) onFile(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
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
              <p className="text-xs text-(--c-ink3) font-['DM_Mono']">
                Export from CamLog or ZoeLog
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

          {/* Friendly, specific message for an unsupported / unrecognized file */}
          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-(--c-accent)/40 bg-(--c-accent)/5 px-3.5 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-(--c-accent) flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-(--c-ink) font-['DM_Mono'] leading-relaxed">{error}</p>
            </div>
          )}

          {/* Try it without your own log */}
          <p className="mt-5 text-center text-xs text-(--c-ink2) font-['DM_Sans']">
            Don’t have a log handy?{' '}
            <button
              onClick={() => !loading && onDemo?.()}
              className="text-(--c-accent) font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              disabled={loading}
            >
              See a sample →
            </button>
          </p>

          {/* Privacy: the whole pipeline runs client-side; nothing is uploaded */}
          <div className="mt-10 flex items-center justify-center gap-1.5 text-(--c-ink3)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[11px] font-['DM_Mono']">
              Your logs never leave your device
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
