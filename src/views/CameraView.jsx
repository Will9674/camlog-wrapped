import { useMemo } from 'react'
import SummaryBar from '../components/SummaryBar'
import { cameraUsage, deduplicateShots } from '../utils/stats'

const COLORS = [
  '#1a1916',
  '#7c5c3e',
  '#a08c5e',
  '#4a6741',
  '#3d5c7a',
  '#7a3d4a',
  '#5a4a7a',
  '#6b6560',
]

export default function CameraView({ rows, stats }) {
  const data = useMemo(() => cameraUsage(deduplicateShots(rows)), [rows])

  if (data.length === 0) {
    return (
      <div>
        <SummaryBar stats={stats} />
        <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
          <div className="text-[#a09e99] font-['DM_Mono'] text-sm py-8 text-center">
            No camera data found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-5">
          Camera Breakdown
        </h2>

        {/* Stacked bar */}
        <div className="flex rounded overflow-hidden mb-6" style={{ height: 40 }}>
          {data.map((cam, i) => (
            <div
              key={cam.name}
              style={{
                width: `${cam.pct}%`,
                background: COLORS[i % COLORS.length],
                minWidth: cam.pct > 0 ? 2 : 0,
              }}
              title={`${cam.name}: ${cam.pct.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend rows */}
        <div className="flex flex-col gap-3">
          {data.map((cam, i) => (
            <div key={cam.name} className="flex items-center gap-3">
              <div
                className="flex-shrink-0 rounded-sm"
                style={{ width: 14, height: 14, background: COLORS[i % COLORS.length] }}
              />
              <span className="font-['DM_Mono'] text-sm text-[#1a1916] flex-1">{cam.name}</span>
              <span className="font-['DM_Mono'] text-sm text-[#6b6762]">
                {cam.pct.toFixed(1)}%
              </span>
              <span className="font-['DM_Mono'] text-sm text-[#a09e99] w-24 text-right">
                {cam.count} Shots
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
