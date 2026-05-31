import { useState, useMemo, useRef, useEffect } from 'react'
import FilterPanel from './FilterPanel'
import PrintLayout from './PrintLayout'
import LensView from '../views/LensView'
import SupportView from '../views/SupportView'
import DaysView from '../views/DaysView'
import FiltersView from '../views/FiltersView'
import CameraView from '../views/CameraView'
import { ThemeToggleButton } from '../ThemeContext.jsx'
import { filterRows, summaryStats, getDateRange, getCamerasInData } from '../utils/stats'

const VIEWS = [
  { id: 'lens', label: 'Lens Usage' },
  { id: 'support', label: 'Camera Support' },
  { id: 'camera', label: 'Camera Breakdown' },
  { id: 'days', label: 'Per Day Data' },
  { id: 'filters', label: 'Optical Filters' },
]

export default function Dashboard({ rows, projectTitle, onReset }) {
  const [activeView, setActiveView] = useState('lens')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)
  const shareRef = useRef(null)

  // Close share popover on outside click
  useEffect(() => {
    if (!shareOpen) return
    function handleClick(e) {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [shareOpen])

  async function handleExport() {
    const el = printRef.current
    if (!el || exporting) return
    setExporting(true)
    setShareOpen(false)
    el.style.position = 'fixed'
    el.style.left = '0'
    el.style.top = '0'
    el.style.visibility = 'visible'
    el.style.zIndex = '9999'
    try {
      await new Promise((r) => setTimeout(r, 400))

      const { toPng } = await import('html-to-image')
      const exportOpts = { pixelRatio: 6, backgroundColor: '#f0ece4' }
      await toPng(el, exportOpts)
      const dataUrl = await toPng(el, exportOpts)

      const img = new Image()
      await new Promise((res) => { img.onload = res; img.src = dataUrl })

      const { jsPDF } = await import('jspdf')
      const pdfW = 595
      const pdfH = (img.naturalHeight / img.naturalWidth) * pdfW
      const pdf = new jsPDF({ unit: 'pt', format: [pdfW, pdfH] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${projectTitle || 'CamLog-Wrapped'}.pdf`)
    } finally {
      el.style.position = 'fixed'
      el.style.left = '-9999px'
      el.style.visibility = 'hidden'
      el.style.zIndex = '-1'
      setExporting(false)
    }
  }

  async function handleCopyLink() {
    try {
      const { compressToEncodedURIComponent } = await import('lz-string')
      const payload = JSON.stringify({ projectTitle, rows })
      const compressed = compressToEncodedURIComponent(payload)
      const url = `${window.location.origin}${window.location.pathname}#s=${compressed}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setShareOpen(false)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard write failed — silently ignore
    }
  }

  const [dateMin, dateMax] = useMemo(() => getDateRange(rows), [rows])
  const availableCameras = useMemo(() => getCamerasInData(rows), [rows])

  const [filters, setFilters] = useState({
    cameras: ['All'],
    dateRange: [dateMin, dateMax],
  })

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => summaryStats(rows, filters), [rows, filters])

  const ViewComponent = {
    lens: LensView,
    support: SupportView,
    camera: CameraView,
    days: DaysView,
    filters: FiltersView,
  }[activeView]

  const NavButton = ({ view, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-['DM_Sans'] transition-colors ${
        activeView === view.id
          ? 'text-[#e63946] bg-[#e63946]/10'
          : 'text-(--c-nav-fg) hover:text-(--c-nav-fg-hover) hover:bg-(--c-nav-hover-bg)'
      }`}
    >
      {view.label}
    </button>
  )

  const SidebarContents = ({ onNavClick }) => (
    <>
      <div className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-2">
        Views
      </div>
      {VIEWS.map((v) => (
        <NavButton key={v.id} view={v} onClick={() => onNavClick(v.id)} />
      ))}
      <div className="mt-8">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          dateMin={dateMin}
          dateMax={dateMax}
          availableCameras={availableCameras}
        />
      </div>
    </>
  )

  return (
    <>
    <div className="min-h-screen flex flex-col bg-(--c-bg) no-print">
      {/* Top bar */}
      <header className="relative bg-(--c-surface) border-b border-(--c-border) px-10 sm:px-12 h-14 flex items-center justify-between flex-shrink-0">
        <span className="hidden sm:block font-['DM_Mono'] text-base font-bold text-(--c-ink) tracking-tight">
          Cam<span className="text-[#e63946]">Log</span><span className="text-(--c-ink3)"> Wrapped</span>
        </span>
        {projectTitle && (
          <span className="flex-1 text-center sm:flex-none sm:absolute sm:left-1/2 sm:-translate-x-1/2 font-['DM_Mono'] text-xl font-medium text-(--c-ink) tracking-tight">
            {projectTitle}
          </span>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="sm:hidden text-(--c-ink2) hover:text-(--c-ink) transition-colors"
            aria-label="Toggle filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="20" y2="12"/>
              <line x1="12" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
          <ThemeToggleButton />

          {/* Share button + popover */}
          <div ref={shareRef} className="relative">
            <button
              onClick={() => setShareOpen((s) => !s)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                copied
                  ? 'text-[#e63946] bg-[#e63946]/10'
                  : 'text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg)'
              }`}
              aria-label="Share"
            >
              {copied ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
              )}
            </button>

            {shareOpen && (
              <div className="absolute right-0 top-10 bg-(--c-surface) border border-(--c-border) rounded-xl shadow-lg overflow-hidden z-50 min-w-[168px]">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-['DM_Mono'] text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Copy Link
                </button>
                <div className="h-px bg-(--c-border)" />
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-['DM_Mono'] text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  {exporting ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center rounded-full text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors font-['DM_Mono'] text-xl leading-none"
            aria-label="New file"
          >
            +
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden sm:flex flex-col w-72 bg-(--c-sidebar) border-r border-(--c-border) flex-shrink-0 overflow-y-auto">
          <nav className="px-14 pt-8 pb-8 flex-1">
            <SidebarContents onNavClick={(id) => setActiveView(id)} />
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 w-72 bg-(--c-sidebar) flex flex-col overflow-y-auto">
              <div className="px-8 pt-8 pb-8">
                <SidebarContents onNavClick={(id) => { setActiveView(id); setSidebarOpen(false) }} />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8">
            {/* Mobile nav tabs */}
            <div className="sm:hidden flex gap-1.5 overflow-x-auto pb-4 mb-2">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-['DM_Mono'] transition-colors ${
                    activeView === v.id
                      ? 'bg-[#e63946] text-white'
                      : 'bg-(--c-surface) text-(--c-ink2) border border-(--c-border)'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <ViewComponent rows={filteredRows} stats={stats} />
          </div>
        </main>
      </div>
    </div>
    <PrintLayout ref={printRef} rows={filteredRows} stats={stats} projectTitle={projectTitle} />
    </>
  )
}
