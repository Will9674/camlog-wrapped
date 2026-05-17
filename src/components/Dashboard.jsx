import { useState, useMemo } from 'react'
import FilterPanel from './FilterPanel'
import LensView from '../views/LensView'
import SupportView from '../views/SupportView'
import DaysView from '../views/DaysView'
import FPSView from '../views/FPSView'
import ISOView from '../views/ISOView'
import { filterRows, summaryStats, getDateRange } from '../utils/stats'

const VIEWS = [
  { id: 'lens', label: 'Lens Usage' },
  { id: 'support', label: 'Camera Support' },
  { id: 'days', label: 'Takes per Day' },
  { id: 'fps', label: 'Frame Rates' },
  { id: 'iso', label: 'ISO' },
]

export default function Dashboard({ rows, onReset }) {
  const [activeView, setActiveView] = useState('lens')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [dateMin, dateMax] = useMemo(() => getDateRange(rows), [rows])

  const [filters, setFilters] = useState({
    cameras: ['All'],
    circledOnly: false,
    metric: 'takes',
    dateRange: [dateMin, dateMax],
  })

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => summaryStats(rows, rows, filters), [rows, filters])

  const ViewComponent = {
    lens: LensView,
    support: SupportView,
    days: DaysView,
    fps: FPSView,
    iso: ISOView,
  }[activeView]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#e2dfd8] px-4 sm:px-6 h-12 flex items-center justify-between flex-shrink-0">
        <span className="font-['DM_Mono'] text-sm font-medium text-[#1a1916] tracking-tight">
          CineLog Wrapped
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="sm:hidden text-[#a09e99] hover:text-[#1a1916] transition-colors"
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
            className="text-xs text-[#a09e99] hover:text-[#1a1916] font-['DM_Mono'] transition-colors"
          >
            New file
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden sm:flex flex-col w-52 border-r border-[#e2dfd8] bg-white flex-shrink-0 overflow-y-auto">
          {/* Nav */}
          <nav className="p-3 border-b border-[#e2dfd8]">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm font-['DM_Sans'] transition-colors ${
                  activeView === v.id
                    ? 'bg-[#1a1916] text-white'
                    : 'text-[#1a1916] hover:bg-[#f5f3ee]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
          {/* Filters */}
          <div className="p-4 flex-1">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              dateMin={dateMin}
              dateMax={dateMax}
            />
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="sm:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-50 w-64 bg-white border-r border-[#e2dfd8] flex flex-col overflow-y-auto">
              <div className="p-3 border-b border-[#e2dfd8]">
                <div className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-2">
                  Views
                </div>
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setActiveView(v.id); setSidebarOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded text-sm font-['DM_Sans'] transition-colors ${
                      activeView === v.id
                        ? 'bg-[#1a1916] text-white'
                        : 'text-[#1a1916] hover:bg-[#f5f3ee]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="p-4 flex-1">
                <FilterPanel
                  filters={filters}
                  onChange={setFilters}
                  dateMin={dateMin}
                  dateMax={dateMax}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Mobile nav tabs */}
          <div className="sm:hidden flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-['DM_Mono'] transition-colors ${
                  activeView === v.id
                    ? 'bg-[#1a1916] text-white'
                    : 'bg-white text-[#1a1916] border border-[#e2dfd8]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <ViewComponent rows={filteredRows} stats={stats} />
        </main>
      </div>
    </div>
  )
}
