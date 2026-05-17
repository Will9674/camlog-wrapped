import StatCard from './StatCard'

export default function SummaryBar({ stats }) {
  const isShots = stats.metric === 'shots'

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-widest font-['DM_Mono'] text-[#a09e99]">
          Viewing
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-['DM_Mono'] font-medium transition-colors ${
            isShots
              ? 'bg-[#1a1916] text-white'
              : 'bg-[#e8e3da] text-[#1a1916]'
          }`}
        >
          {isShots ? 'Shots' : 'Takes'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={isShots ? 'Total Shots' : 'Total Takes'} value={stats.totalTakes} />
        <StatCard label="Shooting Days" value={stats.shootingDays} />
        {isShots ? (
          <StatCard label="Avg Shots / Day" value={stats.avgShotsPerDay} />
        ) : (
          <StatCard label="Avg Takes / Day" value={stats.avgTakesPerDay} />
        )}
        {isShots ? (
          <StatCard label="Avg Takes / Day" value={stats.avgTakesPerDay} />
        ) : (
          <div className="rounded-xl p-5" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
