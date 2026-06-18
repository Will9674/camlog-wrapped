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
  const [vpH, setVpH]                 = useState(() => window.visualViewport?.height ?? window.innerHeight)
  const exportRef = useRef(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let prevW = vv.width
    // Only update vpH on orientation change (width changes), not address-bar scroll (height-only)
    const handler = () => {
      if (vv.width !== prevW) {
        prevW = vv.width
        setVpH(vv.height)
      }
    }
    vv.addEventListener('resize', handler)
    return () => vv.removeEventListener('resize', handler)
  }, [])

  const portrait   = format === 'story'
  const cardH      = portrait ? CARD_HEIGHT_STORY : CARD_SIZE
  const pixelRatio = portrait ? (1080 / CARD_SIZE) : 3

  // In portrait mode, shrink preview so all UI fits within 90vh without scrolling.
  // Reserved: header ~56px, format picker ~52px, view picker ~56px, save ~72px, gaps ~36px = ~272px
  // header ~57 + format ~60 + preview-padding ~16 + view-picker ~44 + save ~73 = ~250px
  const RESERVED_H = 250
  const maxPortraitPreviewH = vpH * 0.9 - RESERVED_H
  const effectivePreviewW = portrait
    ? Math.min(PREVIEW_W, Math.max(160, Math.round(maxPortraitPreviewH * CARD_SIZE / CARD_HEIGHT_STORY)))
    : PREVIEW_W
  const previewH = Math.round(effectivePreviewW * (cardH / CARD_SIZE))
  const scale    = effectivePreviewW / CARD_SIZE

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

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div className="bg-(--c-surface) border border-(--c-border) rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto flex flex-col max-h-[90dvh]">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-(--c-border) flex-shrink-0">
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
          <div className="px-6 pt-4 pb-3 flex-shrink-0">
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

          {/* Preview */}
          <div className="flex justify-center pb-4 px-6 flex-shrink-0">
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

          {/* View picker — always visible, outside scroll */}
          <div className="px-6 pb-3 flex-shrink-0">
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
          <div className="px-6 pb-5 pt-3 border-t border-(--c-border) flex-shrink-0">
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
