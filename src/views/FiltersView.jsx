import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { filterUsage } from '../utils/stats'

export default function FiltersView({ rows, stats }) {
  const data = filterUsage(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-5">
          Optical Filters
        </h2>
        {data.length === 0 ? (
          <div className="text-[#a09e99] font-['DM_Mono'] text-sm py-8 text-center">
            No filter data found in this export
          </div>
        ) : (
          <HorizBarChart data={data} valueKey="pct" showPct />
        )}
      </div>
    </div>
  )
}
