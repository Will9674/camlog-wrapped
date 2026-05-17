import SummaryBar from '../components/SummaryBar'
import HorizBarChart from '../components/HorizBarChart'
import { fpsUsage } from '../utils/stats'

export default function FPSView({ rows, stats }) {
  const data = fpsUsage(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e2dfd8] rounded-lg p-5">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-4">
          Frame Rates
        </h2>
        <HorizBarChart
          data={data}
          valueKey="pct"
          showPct
          labelFormatter={(v) => (v ? `${v} fps` : 'Unknown')}
        />
      </div>
    </div>
  )
}
