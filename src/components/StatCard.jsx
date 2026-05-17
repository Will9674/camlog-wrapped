export default function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-[#e8e3da] rounded-xl p-5 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-[#6b6762] font-['DM_Mono'] mb-2">
        {label}
      </div>
      <div className="text-[#1a1916] text-3xl font-['DM_Mono'] font-medium leading-none">
        {value}
      </div>
    </div>
  )
}
