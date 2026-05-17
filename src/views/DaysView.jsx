import SummaryBar from '../components/SummaryBar'
import VertBarChart from '../components/VertBarChart'
import { takesPerDay } from '../utils/stats'

export default function DaysView({ rows, stats }) {
  const data = takesPerDay(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e2dfd8] rounded-lg p-5">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-4">
          Takes per Day
        </h2>
        <VertBarChart data={data} />
      </div>
    </div>
  )
}
