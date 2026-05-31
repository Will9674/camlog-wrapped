import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { lensUsage, deduplicateShots } from '../utils/stats'

export default function LensView({ rows, stats }) {
  const dedupedRows = deduplicateShots(rows)
  const { data, unknownCount } = lensUsage(dedupedRows)
  const totalShots = dedupedRows.length

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-5">
          Lens Usage
        </h2>
        <HorizBarChart data={data} valueKey="pct" showPct countLabel="Shots" />
        {unknownCount > 0 && (
          <p className="mt-4 text-xs font-['DM_Mono'] text-(--c-ink2)">
            {unknownCount} of {totalShots} {totalShots === 1 ? 'shot' : 'shots'} ({Math.round((unknownCount / totalShots) * 100)}%) had no lens data recorded and are not shown.
          </p>
        )}
      </div>
    </div>
  )
}
