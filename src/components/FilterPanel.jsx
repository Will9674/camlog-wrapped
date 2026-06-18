import { useTheme } from '../theme-context'

export default function FilterPanel({ filters, onChange, dateMin, dateMax, availableCameras = [] }) {
  useTheme() // subscribe so filter panel re-renders on theme change
  const { cameras, dateRange } = filters

  const labelClass = `text-xs uppercase tracking-widest font-['DM_Mono'] mb-2 text-(--c-label)`
  const btnBase = `px-2.5 py-1.5 rounded-lg border text-xs font-['DM_Mono'] transition-colors`
  const btnActive = 'bg-(--c-accent) text-white border-transparent'
  const btnInactive = 'bg-transparent text-(--c-nav-fg) border-(--c-border) hover:text-(--c-nav-fg-hover) hover:border-(--c-border-strong)'
  const inputClass = 'w-full border border-(--c-border) rounded-lg px-2 py-1.5 text-xs font-["DM_Mono"] bg-(--c-surface) text-(--c-ink) focus:outline-none focus:border-(--c-border-strong)'

  function toggleCamera(cam) {
    let next
    if (cam === 'All') {
      next = ['All']
    } else {
      const without = cameras.filter((c) => c !== 'All' && c !== cam)
      if (cameras.includes(cam)) {
        next = without.length ? without : ['All']
      } else {
        next = [...cameras.filter((c) => c !== 'All'), cam]
      }
    }
    onChange({ ...filters, cameras: next })
  }

  const isActive = (cam) =>
    cam === 'All' ? cameras.includes('All') || cameras.length === 0 : cameras.includes(cam)

  return (
    <div className="flex flex-col gap-5">
      {/* Camera */}
      {availableCameras.length > 0 && (
        <div>
          <div className={labelClass}>Camera</div>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...availableCameras].map((cam) => (
              <button
                key={cam}
                onClick={() => toggleCamera(cam)}
                className={`${btnBase} ${isActive(cam) ? btnActive : btnInactive}`}
              >
                {cam}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div>
        <div className={labelClass}>Date Range</div>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            min={dateMin}
            max={dateMax}
            value={dateRange[0]}
            onChange={(e) => onChange({ ...filters, dateRange: [e.target.value, dateRange[1]] })}
            className={inputClass}
          />
          <input
            type="date"
            min={dateMin}
            max={dateMax}
            value={dateRange[1]}
            onChange={(e) => onChange({ ...filters, dateRange: [dateRange[0], e.target.value] })}
            className={inputClass}
          />
          <button
            onClick={() => onChange({ ...filters, dateRange: [dateMin, dateMax] })}
            disabled={dateRange[0] === dateMin && dateRange[1] === dateMax}
            className="text-xs font-['DM_Mono'] text-left transition-colors text-(--c-ink3) hover:text-(--c-ink2) disabled:opacity-30 disabled:pointer-events-none"
          >
            Reset range
          </button>
        </div>
      </div>
    </div>
  )
}
