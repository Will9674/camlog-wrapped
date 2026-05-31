export default function StatCard({ label, value, small = false }) {
  return (
    <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-5">
      <div className="text-[10px] uppercase tracking-widest text-(--c-ink2) font-['DM_Mono'] mb-2">
        {label}
      </div>
      <div className={`text-(--c-ink) font-['DM_Mono'] font-medium leading-tight ${small ? 'text-lg' : 'text-3xl leading-none'}`}>
        {value}
      </div>
    </div>
  )
}
