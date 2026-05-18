import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { supportUsage, deduplicateShots } from '../utils/stats'

export default function SupportView({ rows, stats }) {
  const data = supportUsage(deduplicateShots(rows))

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-5">
          Camera Support
        </h2>
        {data.length === 0 ? (
          <div className="text-[#a09e99] font-['DM_Mono'] text-sm py-8 text-center">
            No support data found in Notes field
          </div>
        ) : (
          <HorizBarChart data={data} valueKey="pct" showPct countLabel="Shots" />
        )}
      </div>
    </div>
  )
}
