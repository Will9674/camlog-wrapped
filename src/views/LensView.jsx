import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { lensUsage } from '../utils/stats'

export default function LensView({ rows, stats }) {
  const data = lensUsage(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-5">
          Lens Usage
        </h2>
        <HorizBarChart data={data} valueKey="pct" showPct countLabel="Shots" />
      </div>
    </div>
  )
}
