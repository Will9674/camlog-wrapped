import StatCard from './StatCard'
import { fmtDate } from '../utils/format'

export default function SummaryBar({ stats }) {
  const { totalShots, shootingDays, avgShotsPerDay, dateFirst, dateLast, busiestDay } = stats

  let dateRange = null
  if (dateFirst && dateLast) {
    const a = fmtDate(dateFirst)
    const b = fmtDate(dateLast)
    dateRange = a.year === b.year
      ? `${a.label} – ${b.label}, ${a.year}`
      : `${a.label}, ${a.year} – ${b.label}, ${b.year}`
  }

  const busiestStr = busiestDay
    ? `${fmtDate(busiestDay.date).label} · ${busiestDay.count} ${busiestDay.count === 1 ? 'Shot' : 'Shots'}`
    : null

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Shots" value={totalShots} />
        <StatCard label="Shooting Days" value={shootingDays} />
        <StatCard label="Avg Shots / Day" value={avgShotsPerDay} />
      </div>
      {(dateRange || busiestStr) && (
        <div className="grid grid-cols-2 gap-3">
          {dateRange && <StatCard label="Date Range" value={dateRange} small />}
          {busiestStr && <StatCard label="Busiest Day" value={busiestStr} small />}
        </div>
      )}
    </div>
  )
}
