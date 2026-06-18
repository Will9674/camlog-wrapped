export default function StatCard({ label, value, small = false }) {
  return (
    <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-3 sm:p-5">
      <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-widest text-(--c-ink2) font-['DM_Mono'] mb-1.5 sm:mb-2 leading-snug">
        {label}
      </div>
      <div className={`text-(--c-ink) font-['DM_Mono'] font-medium leading-tight ${small ? 'text-base sm:text-lg' : 'text-2xl sm:text-4xl leading-none'}`}>
        {value}
      </div>
    </div>
  )
}
