import { useRef, useState } from 'react'

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-['DM_Mono'] font-medium tracking-tight text-[#1a1916]">
            CineLog Wrapped
          </h1>
          <p className="mt-1 text-sm text-[#a09e99] font-['DM_Sans']">
            Your production, wrapped. Drop a CineLog CSV export to begin.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !loading && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${dragging ? 'border-[#1a1916] bg-[#f0ede6]' : 'border-[#e2dfd8] bg-white hover:border-[#1a1916]'}
            ${loading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#1a1916] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-['DM_Mono'] text-[#a09e99]">Parsing…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a09e99" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div>
                <p className="text-[#1a1916] text-sm font-['DM_Sans'] font-medium">
                  Drop your CSV here
                </p>
                <p className="text-[#a09e99] text-xs font-['DM_Sans'] mt-1">
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

        <p className="text-center text-xs text-[#a09e99] font-['DM_Mono'] mt-6">
          All processing happens in your browser — no data is uploaded.
        </p>
      </div>
    </div>
  )
}
