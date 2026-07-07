import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { filterUsage, deduplicateShots } from '../utils/stats'

export default function FiltersView({ rows, stats }) {
  const data = filterUsage(deduplicateShots(rows))
  const highlight = data[0] && { label: 'Top Filter', value: `${data[0].name} · ${data[0].pct.toFixed(1)}%` }

  return (
    <div>
      <SummaryBar stats={stats} highlight={highlight} />
      <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-5">
          Optical Filters
        </h2>
        {data.length === 0 ? (
          <div className="text-(--c-ink2) font-['DM_Mono'] text-sm py-8 text-center">
            No filter data recorded
          </div>
        ) : (
          <HorizBarChart data={data} valueKey="pct" showPct countLabel="Shots" />
        )}
      </div>
    </div>
  )
}
