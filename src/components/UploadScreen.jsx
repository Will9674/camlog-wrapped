import { useRef, useState } from 'react'
import { ThemeToggleButton } from '../ThemeContext.jsx'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadScreen({ onFile, loading }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [fileInfo, setFileInfo] = useState(null)

  function handleFile(file) {
    if (file && file.name.endsWith('.csv')) {
      setFileInfo({ name: file.name, size: file.size })
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
    <div className="min-h-screen flex flex-col bg-(--c-bg)">
      {/* Header bar */}
      <header className="bg-(--c-surface) border-b border-(--c-border) px-8 sm:px-12 h-14 flex items-center justify-between">
        <span className="font-['DM_Mono'] text-base font-bold text-(--c-ink) tracking-tight">
          Cam<span className="text-(--c-accent)">Log</span><span className="text-(--c-ink3)"> Wrapped</span>
        </span>
        <ThemeToggleButton />
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-xl font-['DM_Mono'] font-medium tracking-tight text-(--c-ink)">
              Your production, wrapped.
            </h1>
            <p className="mt-1.5 text-sm text-(--c-ink2) font-['DM_Sans']">
              Import a camera log CSV export.
            </p>
          </div>

          {/* Drop zone */}
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
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-(--c-accent) border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-['DM_Mono'] text-(--c-ink2)">Parsing…</span>
                {fileInfo && (
                  <div className="text-xs font-['DM_Mono'] text-(--c-ink3) text-center space-y-0.5">
                    <div className="truncate max-w-[16rem]">{fileInfo.name}</div>
                    <div>
                      {formatSize(fileInfo.size)}
                      {fileInfo.size > 500_000 && ' — large file, hang tight'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-(--c-ink3)">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <div>
                  <p className="text-(--c-ink) text-sm font-['DM_Sans'] font-medium">
                    Attach your CSV here
                  </p>
                  <p className="text-(--c-ink2) text-xs font-['DM_Sans'] mt-1">
                    or click to browse
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          <p className="text-xs text-(--c-ink3) font-['DM_Mono'] mt-5">
            All processing happens in your browser — no data is uploaded.
          </p>
        </div>
      </div>
    </div>
  )
}
