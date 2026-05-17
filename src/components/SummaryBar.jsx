import StatCard from './StatCard'

export default function SummaryBar({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <StatCard label="Total Shots" value={stats.totalShots} />
      <StatCard label="Shooting Days" value={stats.shootingDays} />
      <StatCard label="Avg Shots / Day" value={stats.avgShotsPerDay} />
    </div>
  )
}
