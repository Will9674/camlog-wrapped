import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { isoUsage } from '../utils/stats'

export default function ISOView({ rows, stats }) {
  const data = isoUsage(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e2dfd8] rounded-lg p-5">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-4">
          ISO / EI
        </h2>
        <HorizBarChart
          data={data}
          valueKey="pct"
          showPct
          labelFormatter={(v) => (v ? `ISO ${v}` : 'Unknown')}
        />
      </div>
    </div>
  )
}
