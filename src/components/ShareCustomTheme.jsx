import { buildTheme, buildCustomBase, randomPalette } from './shareThemes'

const MAX_COLORS = 3
// Seed colors used when the user adds a new slot (never blank).
const SEED = ['#e63946', '#3b82f6', '#fbbf24']

// A single native color slot: an OS color wheel styled as a rounded swatch,
// its hex readout, and a remove control (hidden for the first, required slot).
function ColorSlot({ value, index, canRemove, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative w-10 h-10 rounded-lg overflow-hidden cursor-pointer flex-shrink-0" style={{ boxShadow: '0 0 0 1px var(--c-border-strong)' }}>
        <span className="absolute inset-0" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Color ${index + 1}`}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <span className="font-['DM_Mono'] text-xs text-(--c-ink2) uppercase flex-1">{value}</span>
      {canRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove color ${index + 1}`}
          className="w-6 h-6 flex items-center justify-center rounded-full text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Compact, self-contained live preview of the derived palette so the user can
// judge readability (bg + accent label + gradient number + bars) without the
// weight of a full card render.
function MiniPreview({ config }) {
  const t = buildTheme(buildCustomBase(config))
  return (
    <div className="rounded-xl p-4 overflow-hidden" style={{ background: t.bg }}>
      <div style={t.viewLabel}>Top Filter</div>
      <div className="font-['DM_Sans'] font-bold leading-none mt-1" style={{ fontSize: 40, ...t.gradientText }}>54.3%</div>
      <div className="mt-3 space-y-2">
        {[100, 48].map((w, i) => (
          <div key={i} className="h-2.5 rounded-full overflow-hidden" style={{ background: t.surface2 }}>
            <div className="h-full rounded-full" style={{ width: `${w}%`, background: t.accent }} />
          </div>
        ))}
      </div>
      {/* Signature gradient bar — mirrors the card footer. Unlike the wide % text
          (which only reveals the first stop or two of a 135° sweep), this shows the
          full multi-color gradient, so users see exactly what their colors produce. */}
      <div className="flex items-center justify-between mt-4 mb-1.5">
        <span className="font-['DM_Sans'] text-[11px] font-bold" style={{ color: t.ink }}>
          Cam<span style={{ color: t.accent }}>Log</span> Wrapped
        </span>
      </div>
      <div className="h-1.5 rounded-full w-full" style={{ background: t.gradient }} />
    </div>
  )
}

export default function CustomThemeModal({ config, onChange, onClose }) {
  const mode = config.mode
  const colors = config.colors.length ? config.colors : ['#e63946']

  const setMode = (m) => onChange({ ...config, mode: m })
  const setColor = (i, hex) => onChange({ ...config, colors: colors.map((c, j) => (j === i ? hex : c)) })
  const addColor = () => onChange({ ...config, colors: [...colors, SEED[colors.length] || '#ffffff'] })
  const removeColor = (i) => onChange({ ...config, colors: colors.filter((_, j) => j !== i) })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-(--c-surface) border border-(--c-border) rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-(--c-border) flex-shrink-0">
          <span className="font-['DM_Mono'] text-sm font-medium text-(--c-ink)">Custom Theme</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-(--c-ink2) hover:text-(--c-ink) hover:bg-(--c-nav-hover-bg) transition-colors"
            aria-label="Close"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          {/* Background mode + a shuffle that randomizes the whole palette */}
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-['DM_Mono'] text-xs uppercase tracking-widest text-(--c-label) mb-2">Background</div>
              <div className="inline-flex p-0.5 rounded-lg border border-(--c-border) bg-(--c-nav-hover-bg)">
                {['dark', 'light'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-1.5 rounded-md text-xs font-['DM_Mono'] capitalize transition-colors ${
                      mode === m ? 'bg-(--c-accent) text-white' : 'text-(--c-nav-fg) hover:text-(--c-nav-fg-hover)'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => onChange(randomPalette())}
              title="Generate a random palette"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-(--c-border-strong) text-(--c-ink2) hover:text-(--c-ink) transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect width="18" height="18" x="3" y="3" rx="3" />
                <path d="M8 8h.01" /><path d="M16 8h.01" /><path d="M12 12h.01" /><path d="M8 16h.01" /><path d="M16 16h.01" />
              </svg>
              <span className="font-['DM_Mono'] text-xs whitespace-nowrap">Surprise me</span>
            </button>
          </div>

          {/* Colors */}
          <div>
            <div className="font-['DM_Mono'] text-xs uppercase tracking-widest text-(--c-label) mb-2">
              Colors <span className="text-(--c-ink3)">· up to {MAX_COLORS}</span>
            </div>
            <div className="flex flex-col gap-2">
              {colors.map((c, i) => (
                <ColorSlot
                  key={i}
                  value={c}
                  index={i}
                  canRemove={colors.length > 1}
                  onChange={(hex) => setColor(i, hex)}
                  onRemove={() => removeColor(i)}
                />
              ))}
            </div>
            {colors.length < MAX_COLORS && (
              <button
                onClick={addColor}
                className="mt-2 px-2.5 py-1.5 rounded-lg border border-dashed border-(--c-border-strong) text-xs font-['DM_Mono'] text-(--c-ink2) hover:text-(--c-ink) transition-colors"
              >
                + Add color
              </button>
            )}
          </div>

          {/* Live preview */}
          <div>
            <div className="font-['DM_Mono'] text-xs uppercase tracking-widest text-(--c-label) mb-2">Preview</div>
            <MiniPreview config={{ mode, colors }} />
          </div>
        </div>

        {/* Done */}
        <div className="px-5 pb-3 pt-2 border-t border-(--c-border) flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl text-sm font-['DM_Mono'] font-medium bg-(--c-accent) text-white hover:opacity-90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
