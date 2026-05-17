export default function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-[#e2dfd8] rounded-lg p-4 flex flex-col gap-1">
      <span className="text-[#a09e99] text-xs uppercase tracking-widest font-['DM_Mono']">
        {label}
      </span>
      <span className="text-[#1a1916] text-2xl font-['DM_Mono'] font-medium leading-none">
        {value}
      </span>
    </div>
  )
}
