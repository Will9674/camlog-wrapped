import { useState, useMemo } from 'react'
import StatCard from '../components/StatCard'
import VertBarChart from '../components/VertBarChart'
import { takesPerDay, deduplicateShots } from '../utils/stats'

export default function DaysView({ rows }) {
  const [metric, setMetric] = useState('shots')
  const isShots = metric === 'shots'

  const localRows = useMemo(
    () => (isShots ? deduplicateShots(rows) : rows),
    [rows, isShots]
  )

  const { totalCount, shootingDays, avgPerDay } = useMemo(() => {
    const total = localRows.length
    const days = new Set(localRows.map((r) => r._date).filter(Boolean)).size
    const avg = days > 0 ? (total / days).toFixed(1) : 0
    return { totalCount: total, shootingDays: days, avgPerDay: avg }
  }, [localRows])

  const chartData = useMemo(() => takesPerDay(localRows), [localRows])

  const btnBase = 'px-2.5 py-1.5 rounded-lg border text-xs font-[\'DM_Mono\'] transition-colors'
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
        <VertBarChart data={chartData} countLabel={isShots ? 'Shots' : 'Takes'} />
      </div>
    </div>
  )
}
