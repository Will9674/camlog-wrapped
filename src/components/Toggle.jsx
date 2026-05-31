export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${checked ? 'bg-(--c-accent)' : 'bg-(--c-bar-track)'}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-150 shadow-sm bg-white ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
      <span className="text-sm font-['DM_Sans'] text-(--c-ink2)">{label}</span>
    </label>
  )
}
