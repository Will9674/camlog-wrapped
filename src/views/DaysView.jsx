import { useState, useMemo } from 'react'
import StatCard from '../components/StatCard'
import Toggle from '../components/Toggle'
import VertBarChart from '../components/VertBarChart'
import { takesPerDay, deduplicateShots } from '../utils/stats'
import { fmtDate } from '../utils/format'

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

  // Busiest day = the day with the most shots/takes (respects the toggles above).
  const busiest = useMemo(() => (
    chartData.length ? chartData.reduce((max, d) => (d.count > max.count ? d : max), chartData[0]) : null
  ), [chartData])

  const btnBase = "px-2.5 py-1.5 rounded-lg border text-xs font-['DM_Mono'] transition-colors"
  const btnActive = 'bg-(--c-accent) text-white border-(--c-accent)'
  const btnInactive = 'bg-transparent text-(--c-nav-fg) border-(--c-border) hover:text-(--c-nav-fg-hover) hover:border-(--c-border-strong)'

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatCard label={isShots ? 'Total Shots' : 'Total Takes'} value={totalCount} />
        <StatCard label="Shooting Days" value={shootingDays} />
        <StatCard label={isShots ? 'Avg Shots / Day' : 'Avg Takes / Day'} value={avgPerDay} />
      </div>
      {busiest && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            label="Busiest Day"
            value={`${fmtDate(busiest.name).label} · ${busiest.count} ${busiest.count === 1 ? (isShots ? 'Shot' : 'Take') : (isShots ? 'Shots' : 'Takes')}`}
            small
          />
        </div>
      )}

      <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono']">
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
