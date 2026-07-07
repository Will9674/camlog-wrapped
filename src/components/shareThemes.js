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

// Builds the derived style objects a theme needs (gradient text + view label).
export function buildTheme(id) {
  const base = THEMES[id] || THEMES.classic
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
