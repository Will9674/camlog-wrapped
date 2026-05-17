import { useState, useMemo } from 'react'
import FilterPanel from './FilterPanel'
import LensView from '../views/LensView'
import SupportView from '../views/SupportView'
import DaysView from '../views/DaysView'
import FiltersView from '../views/FiltersView'
import { filterRows, summaryStats, getDateRange, getCamerasInData } from '../utils/stats'

const VIEWS = [
  { id: 'lens', label: 'Lens Usage' },
  { id: 'support', label: 'Camera Support' },
  { id: 'days', label: 'Takes per Day' },
  { id: 'filters', label: 'Optical Filters' },
]

export default function Dashboard({ rows, projectTitle, onReset }) {
  const [activeView, setActiveView] = useState('lens')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [dateMin, dateMax] = useMemo(() => getDateRange(rows), [rows])
  const availableCameras = useMemo(() => getCamerasInData(rows), [rows])

  const [filters, setFilters] = useState({
    cameras: ['All'],
    circledOnly: false,
    metric: 'shots',
    dateRange: [dateMin, dateMax],
  })

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => summaryStats(rows, rows, filters), [rows, filters])

  const ViewComponent = {
    lens: LensView,
    support: SupportView,
    days: DaysView,
    filters: FiltersView,
  }[activeView]

  const NavButton = ({ view, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-['DM_Sans'] transition-colors ${
        activeView === view.id
          ? 'bg-white/15 text-white'
          : 'text-white/50 hover:text-white/80 hover:bg-white/8'
      }`}
    >
      {view.label}
    </button>
  )

  const SidebarContents = ({ onNavClick }) => (
    <>
      <div className="text-xs uppercase tracking-widest text-white font-['DM_Mono'] mb-2">
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
          dark
        />
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f0ece4]">
      {/* Top bar */}
      <header className="relative bg-[#1a1916] px-10 sm:px-12 h-14 flex items-center justify-between flex-shrink-0">
        <span className="font-['DM_Mono'] text-base font-medium text-white tracking-tight">
          CineLog Wrapped
        </span>
        {projectTitle && (
          <span className="absolute left-1/2 -translate-x-1/2 font-['DM_Mono'] text-lg font-medium text-white tracking-tight">
            {projectTitle}
          </span>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="sm:hidden text-white/50 hover:text-white transition-colors"
            aria-label="Toggle filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="20" y2="12"/>
              <line x1="12" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
          <button
            onClick={onReset}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors font-['DM_Mono'] text-xl leading-none"
            aria-label="New file"
          >
            +
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden sm:flex flex-col w-72 bg-[#1a1916] flex-shrink-0 overflow-y-auto">
          <nav className="px-14 pt-8 pb-8 flex-1">
            <SidebarContents onNavClick={(id) => setActiveView(id)} />
          </nav>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-50 w-72 bg-[#1a1916] flex flex-col overflow-y-auto">
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
                      ? 'bg-[#1a1916] text-white'
                      : 'bg-white text-[#1a1916] border border-[#e8e3da]'
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
  )
}
