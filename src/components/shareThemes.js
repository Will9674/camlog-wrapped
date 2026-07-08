// Share-card theme data, kept in a plain module (no component exports) so ShareCard
// stays Fast-Refresh-friendly. Each theme repaints the canvas (bg / text / accent /
// gradient) but never the brand: the footer wordmark and gradient bar stay consistent
// so cards read as "CamLog Wrapped" in a feed regardless of palette. Camera-breakdown
// colors are semantic (mapped to camera letters) and intentionally stay fixed too.

export const MONO = 'DM Mono, monospace'

export const THEMES = {
  classic: {
    bg: '#111111', surface2: '#2a2a2c', accent: '#e63946',
    ink: '#f2f2f7', ink2: '#8e8e93', ink3: '#3a3a3c',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)',
  },
  cinema: {
    bg: '#0e0b07', surface2: '#2b2318', accent: '#e2a44f',
    ink: '#f6efe2', ink2: '#9a8f7c', ink3: '#3a3226',
    gradient: 'linear-gradient(135deg, #8a4b1e 0%, #e2a44f 50%, #f6d060 100%)',
  },
  documentary: {
    bg: '#f0ece4', surface2: '#ddd6c8', accent: '#c1452f',
    ink: '#1a1916', ink2: '#6b6762', ink3: '#a09e99',
    gradient: 'linear-gradient(135deg, #2f6fb0 0%, #c1452f 50%, #d99a2e 100%)',
  },
  neon: {
    bg: '#080611', surface2: '#1c1830', accent: '#ff2d95',
    ink: '#f2efff', ink2: '#8a83ad', ink3: '#2e2a44',
    gradient: 'linear-gradient(135deg, #00e5ff 0%, #ff2d95 50%, #b026ff 100%)',
  },
  scifi: {
    bg: '#05090a', surface2: '#0f2a20', accent: '#00ff9c',
    ink: '#d6ffe9', ink2: '#5f8a76', ink3: '#173628',
    gradient: 'linear-gradient(135deg, #00e5ff 0%, #00ff9c 50%, #b6ff00 100%)',
  },
}

// Ordered metadata for the picker UI (label + swatch derived from THEMES).
export const SHARE_THEME_META = [
  { id: 'classic',     label: 'Classic' },
  { id: 'cinema',      label: 'Cinema' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'neon',        label: 'Neon' },
  { id: 'scifi',       label: 'Sci-Fi' },
]

// ── Custom theme ──────────────────────────────────────────────────────────────
// The user only chooses the *vibe*: a dark/light background and up to three
// colors. Every readability-critical token (bg + text tones + bar track) is
// derived from the mode using values proven on the built-in canvases, so a
// custom card can never come out as low-contrast text. The colors only drive the
// accent (labels + solid bars) and the gradient (big % number + footer bar).

export const CUSTOM_MODES = {
  dark:  { bg: '#111111', surface2: '#2a2a2c', ink: '#f2f2f7', ink2: '#8e8e93', ink3: '#3a3a3c' },
  light: { bg: '#f0ece4', surface2: '#ddd6c8', ink: '#1a1916', ink2: '#6b6762', ink3: '#a09e99' },
}

export const CUSTOM_DEFAULT = { mode: 'dark', colors: ['#e63946'] }

// HSL → hex (h 0-360, s/l 0-100).
function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const k = (n) => (n + h / 30) % 12
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`
}

// A harmonious random palette: a random base hue spread across a random color-
// harmony scheme, at a vivid-but-consistent saturation/lightness. The derived
// text tokens still come from the (also random) mode, so the result stays legible.
export function randomPalette() {
  const base = Math.floor(Math.random() * 360)
  const schemes = [
    [0, 30, -30],   // analogous
    [0, 120, 240],  // triadic
    [0, 180, 90],   // split-complementary
    [0, 20, 200],   // contrast pair
  ]
  const scheme = schemes[Math.floor(Math.random() * schemes.length)]
  const s = 70 + Math.floor(Math.random() * 15) // 70–85
  const l = 52 + Math.floor(Math.random() * 8)  // 52–60
  const colors = scheme.map((d) => hslToHex(((base + d) % 360 + 360) % 360, s, l))
  return { mode: Math.random() < 0.5 ? 'dark' : 'light', colors }
}

// Linear-interpolate a hex color toward a target hex by amt (0..1).
function mixHex(hex, target, amt) {
  const p = (h) => {
    const s = h.replace('#', '')
    const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16))
  }
  const [a, b] = [p(hex), p(target)]
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amt))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

// Build a 135° gradient from the chosen colors. One color still reads as a
// gradient via an auto second stop shifted toward white (dark) / black (light).
function gradientFrom(colors, mode) {
  const c = (colors || []).filter(Boolean)
  if (c.length >= 3) return `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 50%, ${c[2]} 100%)`
  if (c.length === 2) return `linear-gradient(135deg, ${c[0]} 0%, ${c[1]} 100%)`
  const c0 = c[0] || '#e63946'
  const second = mixHex(c0, mode === 'light' ? '#000000' : '#ffffff', 0.32)
  return `linear-gradient(135deg, ${c0} 0%, ${second} 100%)`
}

// Turns a custom config { mode, colors } into a base theme object with the same
// shape as a THEMES entry, so buildTheme() can consume it identically.
export function buildCustomBase({ mode = 'dark', colors = [] } = {}) {
  const m = CUSTOM_MODES[mode] || CUSTOM_MODES.dark
  return {
    ...m,
    accent: colors[0] || '#e63946',
    gradient: gradientFrom(colors, mode),
  }
}

// A stable string signature of a custom config, for cache keys / filenames.
export function customSignature({ mode = 'dark', colors = [] } = {}) {
  return `custom:${mode}:${(colors || []).filter(Boolean).join('-')}`
}

// Builds the derived style objects a theme needs (gradient text + view label).
// Accepts either a preset id (string) or a pre-built base object (custom themes).
export function buildTheme(idOrBase) {
  const base = typeof idOrBase === 'string' ? (THEMES[idOrBase] || THEMES.classic) : idOrBase
  return {
    ...base,
    // Use the `background-image` longhand (not the `background` shorthand): when the
    // theme changes, React re-assigns only the changed property. Re-assigning the
    // `background` shorthand would reset `background-clip` back to border-box while
    // React skips re-applying the unchanged clip, wiping the text-clip effect and
    // leaving a solid gradient block. The longhand never touches background-clip.
    gradientText: {
      backgroundImage: base.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    viewLabel: {
      fontSize: 13,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: base.accent,
      fontFamily: MONO,
    },
  }
}
