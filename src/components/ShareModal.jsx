import { useState, useRef, useEffect } from 'react'
import { ShareCardContent, CARD_SIZE, CARD_HEIGHT_STORY } from './ShareCard'

const PREVIEW_W = 300

const VIEWS = [
  { id: 'lens',    label: 'Lens Usage' },
  { id: 'support', label: 'Support' },
  { id: 'camera',  label: 'Camera' },
  { id: 'days',    label: 'Per Day' },
  { id: 'filters', label: 'Filters' },
]

const FORMATS = [
  { id: 'square', label: 'Square' },
  { id: 'story',  label: 'Story 9:16' },
]

export default function ShareModal({ rows, stats, projectTitle, onClose }) {
  const [activeView, setActiveView]   = useState('lens')
  const [format, setFormat]           = useState('square')
  const [exporting, setExporting]     = useState(false)
  const [exported, setExported]       = useState(false)
  const [exportError, setExportError] = useState(false)
  // previewScale is derived from ResizeObserver on the flex-1 container,
  // so CSS layout (not JS viewport math) determines how big the preview is.
  const [previewScale, setPreviewScale] = useState(PREVIEW_W / CARD_SIZE)
  const previewAreaRef = useRef(null)
  const exportRef      = useRef(null)

  const portrait   = format === 'story'
  const cardH      = portrait ? CARD_HEIGHT_STORY : CARD_SIZE
  const pixelRatio = portrait ? (1080 / CARD_SIZE) : 3

  // Measure the flex-1 preview area and compute scale to fill it.
  // Only update on the first measure or when width changes (orientation change).
  // Address-bar scroll changes height only — we ignore those to keep the preview stable.
  useEffect(() => {
    const el = previewAreaRef.current
    if (!el) return
    let prevW = -1

    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width === prevW) return   // height-only change (address bar) — ignore
      prevW = width

      const scaleW = Math.min(width, PREVIEW_W) / CARD_SIZE
      const scaleH = portrait ? height / CARD_HEIGHT_STORY : height / CARD_SIZE
      setPreviewScale(Math.min(scaleW, scaleH))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [portrait])

  const scale          = previewScale
  const effectivePreviewW = Math.round(scale * CARD_SIZE)
  const previewH          = Math.round(scale * cardH)

  async function handleExport() {
    const el = exportRef.current
    if (!el || exporting) return
    setExporting(true)
    el.style.position = 'fixed'
    el.style.left = '0'
    el.style.top = '0'
    el.style.visibility = 'visible'
    el.style.zIndex = '9999'
    try {
      await new Promise((r) => setTimeout(r, 300))
      const { toPng } = await import('html-to-image')
      await toPng(el, { pixelRatio })
      const dataUrl = await toPng(el, { pixelRatio })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${projectTitle || 'CamLog-Wrapped'}-${activeView}-${format}.png`
      a.click()
      setExported(true)
      setTimeout(() => setExported(false), 2500)
    } catch {
      setExportError(true)
      setTimeout(() => setExportError(false), 2500)
    } finally {
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      el.style.visibility = 'hidden'
      el.style.zIndex = '-1'
      setExporting(false)
    }
  }

  const btnBase     = "px-2.5 py-1.5 rounded-lg border text-xs font-['DM_Mono'] transition-colors"
  const btnActive   = 'bg-(--c-accent) text-white border-transparent'
  const btnInactive = 'bg-transparent text-(--c-nav-fg) border-(--c-border) hover:text-(--c-nav-fg-hover) hover:border-(--c-border-strong)'

  const exportLabel = portrait ? 'Save PNG  1080 × 1920' : 'Save PNG  1080 × 1080'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Modal — flex column, capped at 90dvh so it never overflows the visible screen */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-(--c-surface) border border-(--c-border) rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[95dvh] sm:max-h-[90dvh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-(--c-border) flex-shrink-0">
            <span className="font-['DM_Mono'] text-sm font-medium text-(--c-ink)">Share as Image</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors"
              aria-label="Close"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Format picker */}
          <div className="px-6 pt-3 pb-2 flex-shrink-0">
            <div className="flex gap-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`${btnBase} ${format === f.id ? btnActive : btnInactive}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview area — flex-1 fills all remaining space between chrome elements.
              ResizeObserver measures this container and scales the card to fill it. */}
          <div
            ref={previewAreaRef}
            className="flex-1 min-h-0 flex justify-center items-start px-6 pb-2 overflow-hidden"
          >
            <div style={{ width: effectivePreviewW, height: previewH, overflow: 'hidden', borderRadius: 10, flexShrink: 0 }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: CARD_SIZE, height: cardH }}>
                <ShareCardContent
                  viewId={activeView}
                  rows={rows}
                  stats={stats}
                  projectTitle={projectTitle}
                  portrait={portrait}
                />
              </div>
            </div>
          </div>

          {/* View picker — always visible */}
          <div className="px-6 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`${btnBase} ${activeView === v.id ? btnActive : btnInactive}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button — always visible */}
          <div className="px-6 pb-4 pt-2 border-t border-(--c-border) flex-shrink-0">
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`w-full h-10 rounded-xl text-sm font-['DM_Mono'] font-medium transition-colors ${
                exportError
                  ? 'bg-(--c-accent)/20 text-(--c-accent)'
                  : exported
                  ? 'bg-(--c-accent)/20 text-(--c-accent)'
                  : 'bg-(--c-accent) text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-default'
              }`}
            >
              {exporting ? 'Saving…' : exportError ? 'Export failed' : exported ? 'Saved!' : exportLabel}
            </button>
          </div>

        </div>
      </div>

      {/* Off-screen export target */}
      <div
        ref={exportRef}
        style={{ position: 'fixed', left: -9999, top: 0, visibility: 'hidden', zIndex: -1 }}
      >
        <ShareCardContent
          viewId={activeView}
          rows={rows}
          stats={stats}
          projectTitle={projectTitle}
          portrait={portrait}
        />
      </div>
    </>
  )
}
