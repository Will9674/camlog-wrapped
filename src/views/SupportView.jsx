import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { supportUsage, deduplicateShots } from '../utils/stats'

export default function SupportView({ rows, stats }) {
  const dedupedRows = deduplicateShots(rows)
  const data = supportUsage(dedupedRows)
  const totalShots = dedupedRows.length
  const includedShots = data.reduce((s, d) => s + d.count, 0)
  const excludedShots = totalShots - includedShots
  const highlight = data[0] && { label: 'Most Shot On', value: `${data[0].name} · ${data[0].pct.toFixed(1)}%` }

  return (
    <div>
      <SummaryBar stats={stats} highlight={highlight} />
      <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-5">
          Camera Support
        </h2>
        {data.length === 0 ? (
          <div className="text-(--c-ink2) font-['DM_Mono'] text-sm py-8 text-center">
            No support data recorded
          </div>
        ) : (
          <>
            <HorizBarChart data={data} valueKey="pct" showPct countLabel="Shots" />
            {excludedShots > 0 && (
              <p className="mt-4 text-xs font-['DM_Mono'] text-(--c-ink2)">
                {excludedShots} of {totalShots} {totalShots === 1 ? 'shot' : 'shots'} ({Math.round((excludedShots / totalShots) * 100)}%) had no recognized camera support data and are not shown.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
