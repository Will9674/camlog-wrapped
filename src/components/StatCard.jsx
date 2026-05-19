export default function StatCard({ label, value, small = false }) {
  return (
    <div className="bg-white border border-[#e8e3da] rounded-xl p-5 shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-[#6b6762] font-['DM_Mono'] mb-2">
        {label}
      </div>
      <div className={`text-[#1a1916] font-['DM_Mono'] font-medium leading-tight ${small ? 'text-lg' : 'text-3xl leading-none'}`}>
        {value}
      </div>
    </div>
  )
}
