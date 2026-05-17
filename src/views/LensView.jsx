import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { lensUsage } from '../utils/stats'

export default function LensView({ rows, stats }) {
  const data = lensUsage(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e2dfd8] rounded-lg p-5">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-4">
          Lens Usage
        </h2>
        <HorizBarChart data={data} valueKey="pct" showPct />
      </div>
    </div>
  )
}
