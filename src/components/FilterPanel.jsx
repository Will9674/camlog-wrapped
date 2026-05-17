function Toggle({ label, checked, onChange, dark }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          checked
            ? dark ? 'bg-white/80' : 'bg-[#1a1916]'
            : dark ? 'bg-white/15' : 'bg-[#e2dfd8]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-150 shadow-sm ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          } ${dark ? (checked ? 'bg-[#1a1916]' : 'bg-white/60') : 'bg-white'}`}
        />
      </div>
      <span className={`text-sm font-['DM_Sans'] ${dark ? 'text-white/60' : 'text-[#1a1916]'}`}>
        {label}
      </span>
    </label>
  )
}

export default function FilterPanel({ filters, onChange, dateMin, dateMax, availableCameras = [], dark = false }) {
  const { cameras, dateRange } = filters

  const labelClass = `text-xs uppercase tracking-widest font-['DM_Mono'] mb-2 ${dark ? 'text-white' : 'text-[#a09e99]'}`
  const btnBase = `px-2.5 py-1.5 rounded-lg border text-xs font-['DM_Mono'] transition-colors`
  const btnActive = dark
    ? 'bg-white/90 text-[#1a1916] border-transparent'
    : 'bg-[#1a1916] text-white border-[#1a1916]'
  const btnInactive = dark
    ? 'bg-transparent text-white/50 border-white/15 hover:text-white/80 hover:border-white/30'
    : 'bg-white text-[#1a1916] border-[#e2dfd8] hover:border-[#1a1916]'
  const inputClass = dark
    ? 'w-full border border-white/15 rounded-lg px-2 py-1.5 text-xs font-["DM_Mono"] bg-white/8 text-white/70 focus:outline-none focus:border-white/40'
    : 'w-full border border-[#e2dfd8] rounded-lg px-2 py-1.5 text-xs font-["DM_Mono"] bg-white text-[#1a1916] focus:outline-none focus:border-[#1a1916]'

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
          {(dateRange[0] !== dateMin || dateRange[1] !== dateMax) && (
            <button
              onClick={() => onChange({ ...filters, dateRange: [dateMin, dateMax] })}
              className={`text-xs font-['DM_Mono'] text-left transition-colors ${dark ? 'text-white/30 hover:text-white/60' : 'text-[#a09e99] hover:text-[#1a1916]'}`}
            >
              Reset range
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
