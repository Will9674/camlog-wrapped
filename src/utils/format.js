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
