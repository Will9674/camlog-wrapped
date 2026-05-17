import SummaryBar from '../components/SummaryBar'
import VertBarChart from '../components/VertBarChart'
import { takesPerDay } from '../utils/stats'

export default function DaysView({ rows, stats }) {
  const data = takesPerDay(rows)

  return (
    <div>
      <SummaryBar stats={stats} />
      <div className="bg-white border border-[#e8e3da] rounded-xl p-6 shadow-sm">
        <h2 className="text-xs uppercase tracking-widest text-[#a09e99] font-['DM_Mono'] mb-5">
          Takes per Day
        </h2>
        <VertBarChart data={data} />
      </div>
    </div>
  )
}
