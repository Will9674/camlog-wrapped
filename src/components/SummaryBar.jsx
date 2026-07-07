import StatCard from './StatCard'
import { fmtDate } from '../utils/format'

// `highlight` ({ label, value }) is the winning entry for the current view — e.g. the
// #1 lens on the lens view — shown next to the date range. Busiest Day now lives only
// on the Per Day view; each other view surfaces its own leader here instead.
export default function SummaryBar({ stats, highlight }) {
  const { totalShots, shootingDays, avgShotsPerDay, dateFirst, dateLast } = stats

  let dateRange = null
  if (dateFirst && dateLast) {
    const a = fmtDate(dateFirst)
    const b = fmtDate(dateLast)
    dateRange = a.year === b.year
      ? `${a.label} – ${b.label}, ${a.year}`
      : `${a.label}, ${a.year} – ${b.label}, ${b.year}`
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Shots" value={totalShots} />
        <StatCard label="Shooting Days" value={shootingDays} />
        <StatCard label="Avg Shots / Day" value={avgShotsPerDay} />
      </div>
      {(dateRange || highlight) && (
        <div className="grid grid-cols-2 gap-3">
          {dateRange && <StatCard label="Date Range" value={dateRange} small />}
          {highlight && <StatCard label={highlight.label} value={highlight.value} small />}
        </div>
      )}
    </div>
  )
}
