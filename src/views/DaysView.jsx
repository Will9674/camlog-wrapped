import { useState, useMemo } from 'react'
import StatCard from '../components/StatCard'
import VertBarChart from '../components/VertBarChart'
import { takesPerDay, deduplicateShots } from '../utils/stats'

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${checked ? 'bg-[#1a1916]' : 'bg-[#e2dfd8]'}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-150 shadow-sm bg-white ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      <span className="text-sm font-['DM_Sans'] text-[#1a1916]">{label}</span>
    </label>
  )
}

export default function DaysView({ rows }) {
  const [metric, setMetric] = useState('shots')
  const [circledOnly, setCircledOnly] = useState(false)
  const isShots = metric === 'shots'

  const localRows = useMemo(() => {
    let r = rows.filter((row) => row._scene)
    if (circledOnly) r = r.filter((row) => row._circled)
    return isShots ? deduplicateShots(r) : r
  }, [rows, isShots, circledOnly])

  const { totalCount, shootingDays, avgPerDay } = useMemo(() => {
    const total = localRows.length
    const days = new Set(localRows.map((r) => r._date).filter(Boolean)).size
    const avg = days > 0 ? (total / days).toFixed(1) : 0
    return { totalCount: total, shootingDays: days, avgPerDay: avg }
  }, [localRows])

  const chartData = useMemo(() => takesPerDay(localRows), [localRows])

  const btnBase = "px-2.5 py-1.5 rounded-lg border text-xs font-['DM_Mono'] transition-colors"
  const btnActive = 'bg-[#1a1916] text-white border-[#1a1916]'
  const btnInactive = 'bg-white text-[#1a1916] border-[#e2dfd8] hover:border-[#1a1916]'

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label={isShots ? 'Total Shots' : 'Total Takes'} value={totalCount} />
        <StatCard label="Shooting Days" value={shootingDays} />
        <StatCard label={isShots ? 'Avg Shots / Day' : 'Avg Takes / Day'} value={avgPerDay} />
      </div>

      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono']">
            Per Day Data
          </h2>
          <div className="flex items-center gap-4">
            <Toggle
              label="Circled only"
              checked={circledOnly}
              onChange={setCircledOnly}
            />
            <div className="flex gap-1.5">
              {['shots', 'takes'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`${btnBase} capitalize ${metric === m ? btnActive : btnInactive}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <VertBarChart data={chartData} countLabel={isShots ? 'Shots' : 'Takes'} />
      </div>
    </div>
  )
}
