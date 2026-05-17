import { useState } from 'react'

const CAMERAS = ['A', 'B', 'C', 'X']

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${
          checked ? 'bg-[#1a1916]' : 'bg-[#e2dfd8]'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-150 shadow-sm ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-sm text-[#1a1916] font-['DM_Sans']">{label}</span>
    </label>
  )
}

export default function FilterPanel({ filters, onChange, dateMin, dateMax }) {
  const { cameras, circledOnly, metric, dateRange } = filters

  function toggleCamera(cam) {
    let next
    if (cam === 'All') {
      next = cameras.includes('All') ? [] : ['All']
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
      <div>
        <div className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-2">
          Camera
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CAMERAS].map((cam) => (
            <button
              key={cam}
              onClick={() => toggleCamera(cam)}
              className={`px-3 py-1.5 rounded border text-sm font-['DM_Mono'] transition-colors ${
                isActive(cam)
                  ? 'bg-[#1a1916] text-white border-[#1a1916]'
                  : 'bg-white text-[#1a1916] border-[#e2dfd8] hover:border-[#1a1916]'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>

      {/* Circled Only */}
      <div>
        <div className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-2">
          Circled
        </div>
        <Toggle
          label="Circled takes only"
          checked={circledOnly}
          onChange={(v) => onChange({ ...filters, circledOnly: v })}
        />
      </div>

      {/* Metric */}
      <div>
        <div className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-2">
          Metric
        </div>
        <div className="flex gap-1.5">
          {['takes', 'setups'].map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...filters, metric: m })}
              className={`px-3 py-1.5 rounded border text-sm font-['DM_Mono'] capitalize transition-colors ${
                metric === m
                  ? 'bg-[#1a1916] text-white border-[#1a1916]'
                  : 'bg-white text-[#1a1916] border-[#e2dfd8] hover:border-[#1a1916]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <div className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-2">
          Date Range
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="date"
            min={dateMin}
            max={dateMax}
            value={dateRange[0]}
            onChange={(e) =>
              onChange({ ...filters, dateRange: [e.target.value, dateRange[1]] })
            }
            className="w-full border border-[#e2dfd8] rounded px-2 py-1.5 text-sm font-['DM_Mono'] bg-white text-[#1a1916] focus:outline-none focus:border-[#1a1916]"
          />
          <input
            type="date"
            min={dateMin}
            max={dateMax}
            value={dateRange[1]}
            onChange={(e) =>
              onChange({ ...filters, dateRange: [dateRange[0], e.target.value] })
            }
            className="w-full border border-[#e2dfd8] rounded px-2 py-1.5 text-sm font-['DM_Mono'] bg-white text-[#1a1916] focus:outline-none focus:border-[#1a1916]"
          />
          {(dateRange[0] || dateRange[1]) && (
            <button
              onClick={() => onChange({ ...filters, dateRange: [dateMin, dateMax] })}
              className="text-xs text-[#a09e99] hover:text-[#1a1916] font-['DM_Mono'] text-left transition-colors"
            >
              Reset range
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
