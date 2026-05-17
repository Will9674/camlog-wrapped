import StatCard from './StatCard'

export default function SummaryBar({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard label="Total Takes" value={stats.totalTakes} />
      <StatCard label="Shooting Days" value={stats.shootingDays} />
      <StatCard label="Avg Takes / Day" value={stats.avgTakesPerDay} />
      <StatCard label="Avg Shots / Day" value={stats.avgShotsPerDay} />
    </div>
  )
}
