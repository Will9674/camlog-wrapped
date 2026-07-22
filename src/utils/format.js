const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function fmtDate(dateStr) {
  if (!dateStr) return { label: '', year: '' }
  const [y, m, d] = dateStr.split('-')
  return { label: `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}`, year: y }
}

// Camera-department shorthand for exports (share cards, PDF highlights):
// INTERNAL/EXTERNAL ND reads as INT/EXT ND, keeping the strength — the part
// that matters — prominent in tight layouts. Display-only; the dashboard
// keeps the full names.
export function shortFilterName(name) {
  return name.replace(/\bINTERNAL\b/gi, 'INT').replace(/\bEXTERNAL\b/gi, 'EXT')
}

// Headline form for single big-stat displays (Summary winner, Filters hero, PDF
// highlight): shorthand PLUS drop a trailing orientation/qualifier parenthetical,
// so "ATT ND 1.2 (H TOP)" reads "ATT ND 1.2" — filter + strength stay prominent.
// Only for the one-line headline; detailed lists keep the full name so distinct
// orientations (H TOP vs H BOT) don't collapse into identical-looking rows.
export function headlineFilterName(name) {
  return shortFilterName(name).replace(/\s*\([^)]*\)\s*$/, '').trim()
}
