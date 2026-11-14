import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import FilterPanel from './FilterPanel'
import PrintLayout from './PrintLayout'
import ShareModal from './ShareModal'
import LensView from '../views/LensView'
import SupportView from '../views/SupportView'
import DaysView from '../views/DaysView'
import FiltersView from '../views/FiltersView'
import CameraView from '../views/CameraView'
import { ThemeToggleButton } from '../ThemeContext.jsx'
import { filterRows, summaryStats, getDateRange, getCamerasInData } from '../utils/stats'
import { fmtDate, safeFileStem } from '../utils/format'

const VIEWS = [
  { id: 'lens', label: 'Lens Usage' },
  { id: 'support', label: 'Camera Support' },
  { id: 'camera', label: 'Camera Breakdown' },
  { id: 'days', label: 'Per Day Data' },
  { id: 'filters', label: 'Optical Filters' },
]

function NavButton({ view, activeView, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-['DM_Sans'] transition-colors ${
        activeView === view.id
          ? 'text-(--c-accent) bg-(--c-accent)/10'
          : 'text-(--c-nav-fg) hover:text-(--c-nav-fg-hover) hover:bg-(--c-nav-hover-bg)'
      }`}
    >
      {view.label}
    </button>
  )
}

function SidebarContents({ activeView, onNavClick, filters, onFiltersChange, dateMin, dateMax, availableCameras }) {
  return (
    <>
      <div className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-2">
        Views
      </div>
      {VIEWS.map((v) => (
        <NavButton key={v.id} view={v} activeView={activeView} onClick={() => onNavClick(v.id)} />
      ))}
      <div className="mt-8">
        <FilterPanel
          filters={filters}
          onChange={onFiltersChange}
          dateMin={dateMin}
          dateMax={dateMax}
          availableCameras={availableCameras}
        />
      </div>
    </>
  )
}

// The headline is derived from the export's filename, which the exporting app has
// usually mangled — ZoeLog drops the spaces out of a project name, CamLog swaps them
// for underscores and appends "_all_cameras". Rather than have the app guess where the
// words were, let the user correct it. The value goes straight back to App state, so a
// fix reaches the share cards, the PDF and the export filenames without any extra
// plumbing. Deliberately not persisted: a re-upload re-derives the title, and a stale
// override would be harder to explain than retyping it.
const TITLE_SHELL =
  "flex-1 min-w-0 text-center lg:flex-none lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:max-w-[40%] font-['DM_Mono'] text-base sm:text-xl font-medium tracking-tight [overflow-wrap:anywhere]"

// Header Share button, labelled with a word rather than an icon.
const ACTION_BTN = "h-8 px-2.5 sm:px-3 min-w-[3rem] flex items-center justify-center rounded-full border font-['DM_Mono'] text-xs font-medium transition-colors border-(--c-border) text-(--c-ink) hover:border-(--c-border-strong) hover:bg-(--c-nav-hover-bg)"

function EditableTitle({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    const next = draft.trim()
    if (next !== value) onChange(next)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          // Escape abandons the draft — the committed title is untouched.
          if (e.key === 'Escape') { e.preventDefault(); setEditing(false) }
        }}
        maxLength={60}
        aria-label="Project title"
        className={`${TITLE_SHELL} w-full lg:w-96 bg-transparent text-(--c-ink) border-b border-(--c-accent) outline-none px-1 py-0.5`}
      />
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Rename this project"
      className={`${TITLE_SHELL} line-clamp-2 cursor-text transition-colors hover:text-(--c-accent) ${
        value ? 'text-(--c-ink)' : 'text-(--c-ink3)'
      }`}
    >
      {value || 'Add a title'}
    </button>
  )
}

export default function Dashboard({ rows, projectTitle, onTitleChange, onReset }) {
  const [activeView, setActiveView] = useState('lens')
  // Stable identity: React re-attaches this ref to whichever tab becomes active,
  // firing the callback to scroll it into view.
  const activeTabRef = useCallback((el) => {
    if (el) el.scrollIntoView({ inline: 'nearest', behavior: 'smooth' })
  }, [])
  const [scopeOpen, setScopeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [exportError, setExportError] = useState(false)
  const printRef = useRef(null)

  async function handleExport() {
    const el = printRef.current
    if (!el || exporting) return
    setExporting(true)
    el.style.position = 'fixed'
    el.style.left = '0'
    el.style.top = '0'
    el.style.visibility = 'visible'
    el.style.zIndex = '9999'
    try {
      await new Promise((r) => setTimeout(r, 400))

      const { toPng } = await import('html-to-image')
      const isMobile = window.innerWidth < 640
      const exportOpts = { pixelRatio: isMobile ? 3 : 6, backgroundColor: '#f0ece4' }
      await toPng(el, exportOpts)
      const dataUrl = await toPng(el, exportOpts)

      const img = new Image()
      await new Promise((res) => { img.onload = res; img.src = dataUrl })

      // Paginate onto standard A4 sheets (595 × 842 pt). Each of the layout's blocks
      // (header, stat rows, section cards, footer) is placed individually with comfortable
      // spacing, so a chart is never sliced across a page. Blocks are packed onto a page
      // until the next won't fit; content pages after the first center their blocks
      // vertically so a sheet isn't top-heavy with a blank bottom.
      const { jsPDF } = await import('jspdf')
      const pageW = 595, pageH = 842, margin = 40, gap = 26
      const scaleImg = img.naturalWidth / el.offsetWidth  // layout px → raster px (pixelRatio)
      const toPt = pageW / el.offsetWidth                 // layout px → PDF points

      const blocks = [...el.children]
        .filter((c) => c.offsetHeight > 2)                // skip the injected <style> tag
        .map((c) => ({
          srcTop: Math.round(c.offsetTop * scaleImg),
          srcH: Math.max(1, Math.round(c.offsetHeight * scaleImg)),
          hPt: c.offsetHeight * toPt,
        }))

      const pages = []
      let page = [], used = margin
      for (const b of blocks) {
        if (page.length && used + gap + b.hPt > pageH - margin) { pages.push(page); page = []; used = margin }
        used += (page.length ? gap : 0) + b.hPt
        page.push(b)
      }
      if (page.length) pages.push(page)

      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      pages.forEach((pageBlocks, pi) => {
        if (pi > 0) pdf.addPage()
        pdf.setFillColor(240, 236, 228)               // cream page background
        pdf.rect(0, 0, pageW, pageH, 'F')
        const contentH = pageBlocks.reduce((s, b) => s + b.hPt, 0) + (pageBlocks.length - 1) * gap
        let y = pi === 0 ? margin : Math.max(margin, (pageH - contentH) / 2)  // header stays top; rest centered
        for (const b of pageBlocks) {
          const cv = document.createElement('canvas')
          cv.width = img.naturalWidth
          cv.height = b.srcH
          const cx = cv.getContext('2d')
          cx.fillStyle = '#f0ece4'
          cx.fillRect(0, 0, cv.width, cv.height)
          cx.drawImage(img, 0, -b.srcTop)
          pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, y, pageW, b.hPt, undefined, 'FAST')
          y += b.hPt + gap
        }
      })
      pdf.save(`${safeFileStem(projectTitle, 'CamLog-Wrapped')}.pdf`)
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

  const [dateMin, dateMax] = useMemo(() => getDateRange(rows), [rows])
  const availableCameras = useMemo(() => getCamerasInData(rows), [rows])

  // Initialised once per mount; App remounts Dashboard (via key) on each new upload,
  // so the date range always starts at the new data's full span.
  const [filters, setFilters] = useState({
    cameras: ['All'],
    dateRange: [dateMin, dateMax],
  })

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => summaryStats(rows, filters), [rows, filters])

  // Human-readable description of any active filter, for the PDF header — null when
  // showing the full project, so a filtered export is never mistaken for the whole.
  const filterContext = useMemo(() => {
    const parts = []
    const cams = filters.cameras
    if (cams && cams.length && !cams.includes('All')) {
      parts.push((cams.length === 1 ? 'Camera ' : 'Cameras ') + cams.join(', '))
    }
    const [d0, d1] = filters.dateRange || []
    if (d0 && d1 && (d0 !== dateMin || d1 !== dateMax)) {
      const a = fmtDate(d0), b = fmtDate(d1)
      parts.push(a.year === b.year
        ? `${a.label} – ${b.label}, ${a.year}`
        : `${a.label}, ${a.year} – ${b.label}, ${b.year}`)
    }
    return parts.length ? parts.join(' · ') : null
  }, [filters, dateMin, dateMax])

  // Phone-only line above the view chips: says what the charts cover and opens the
  // camera/date sheet. Describes itself rather than saying "Filters", which on a
  // camera show means NDs.
  const scopeLabel = useMemo(() => {
    const cams = filters.cameras || []
    const allCams = !cams.length || cams.includes('All')
    const camPart = allCams ? 'All cameras' : `${cams.length === 1 ? 'Cam' : 'Cams'} ${cams.join(', ')}`
    const [d0, d1] = filters.dateRange || []
    const allDays = !d0 || !d1 || (d0 === dateMin && d1 === dateMax)
    const dayPart = allDays ? 'All days'
      : d0 === d1 ? fmtDate(d0).label
      : `${fmtDate(d0).label} – ${fmtDate(d1).label}`
    return { text: `${camPart} · ${dayPart}`, active: !allCams || !allDays }
  }, [filters, dateMin, dateMax])

  const ViewComponent = {
    lens: LensView,
    support: SupportView,
    camera: CameraView,
    days: DaysView,
    filters: FiltersView,
  }[activeView]

  const sidebarProps = {
    activeView,
    filters,
    onFiltersChange: setFilters,
    dateMin,
    dateMax,
    availableCameras,
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-(--c-bg) no-print">
      {/* Top bar */}
      <header className="relative bg-(--c-surface) border-b border-(--c-border) px-4 sm:px-12 h-14 flex items-center justify-between gap-3 flex-shrink-0">
        <span className="hidden sm:block text-base text-(--c-ink)" style={{fontFamily: '-apple-system,"system-ui","Segoe UI",Helvetica,Arial,sans-serif', fontWeight: 800, letterSpacing: '-0.025em'}}>
          Cam<span className="text-(--c-accent)">Log</span>{' '}
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontWeight: 700,
            letterSpacing: 'normal',
            background: 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Wrapped</span>
        </span>
        <EditableTitle value={projectTitle} onChange={onTitleChange} />
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <ThemeToggleButton />

          {/* One Share button for everything going out: card images and the PDF
              report both live in the share sheet. A word, not an icon: a crew
              member mistook the old icon row and closed the show instead. */}
          <button
            onClick={() => setShareOpen(true)}
            className={ACTION_BTN}
            aria-label="Share images or PDF"
          >
            Share
          </button>

          {/* Close the show, set apart by a divider so it can't be hit as a
              neighbour of Share. An ✕, not a log-out arrow: there's no account. */}
          <span className="w-px h-5 bg-(--c-border)" aria-hidden="true" />
          <button
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center rounded-full text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors"
            aria-label="Close this show and load another file"
            title="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden sm:flex flex-col w-72 bg-(--c-sidebar) border-r border-(--c-border) flex-shrink-0 overflow-y-auto">
          <nav className="px-14 pt-8 pb-8 flex-1">
            <SidebarContents {...sidebarProps} onNavClick={(id) => setActiveView(id)} />
          </nav>
        </aside>

        {/* Phone: cameras & dates in a bottom sheet. Views aren't repeated here,
            the chip strip above the charts already switches them. */}
        {scopeOpen && (
          <div className="sm:hidden fixed inset-0 z-40 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50" onClick={() => setScopeOpen(false)} />
            <div
              role="dialog"
              aria-label="Cameras and dates"
              className="relative z-50 bg-(--c-surface) border-t border-(--c-border) rounded-t-2xl px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[85dvh] overflow-y-auto"
            >
              <div className="mx-auto mb-3 w-9 h-1 rounded-full bg-(--c-border-strong)" aria-hidden="true" />
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setFilters({ cameras: ['All'], dateRange: [dateMin, dateMax] })}
                  disabled={!scopeLabel.active}
                  className="text-xs font-['DM_Mono'] text-(--c-ink2) hover:text-(--c-ink) disabled:opacity-30 transition-colors"
                >
                  Reset
                </button>
                <span className="font-['DM_Mono'] text-sm font-medium text-(--c-ink)">Cameras &amp; Dates</span>
                <button
                  onClick={() => setScopeOpen(false)}
                  className="text-xs font-['DM_Mono'] font-medium text-(--c-accent)"
                >
                  Done
                </button>
              </div>
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                dateMin={dateMin}
                dateMax={dateMax}
                availableCameras={availableCameras}
                showRangeReset={false}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 py-8">
            {/* Phone: what the charts cover; tap for the cameras & dates sheet */}
            <button
              onClick={() => setScopeOpen(true)}
              className={`sm:hidden mb-3 inline-flex max-w-full items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-['DM_Mono'] transition-colors ${
                scopeLabel.active
                  ? 'border-transparent bg-(--c-accent)/10 text-(--c-accent)'
                  : 'border-(--c-border) text-(--c-ink2)'
              }`}
              aria-label={`Showing ${scopeLabel.text}. Change cameras or dates`}
            >
              <span className="truncate">{scopeLabel.text}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Mobile nav tabs */}
            <div className="sm:hidden flex gap-1.5 overflow-x-auto pb-4 mb-2">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  ref={activeView === v.id ? activeTabRef : null}
                  onClick={() => setActiveView(v.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-['DM_Mono'] transition-colors ${
                    activeView === v.id
                      ? 'bg-(--c-accent) text-white'
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
    <PrintLayout ref={printRef} rows={filteredRows} stats={stats} projectTitle={projectTitle} filterContext={filterContext} />
    {shareOpen && (
      <ShareModal
        rows={filteredRows}
        stats={stats}
        projectTitle={projectTitle}
        onClose={() => setShareOpen(false)}
        pdf={{ onExport: handleExport, exporting, exported, exportError }}
      />
    )}
    {exporting && (
      <div className="fixed inset-0 z-[10000] bg-(--c-bg)/80" />
    )}
    </>
  )
}
