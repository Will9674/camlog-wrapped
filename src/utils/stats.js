// Largest-remainder rounding: floors all percentages to 1dp, then distributes
// remaining 0.1 increments to the items with the largest fractional remainders,
// guaranteeing the displayed values always sum to exactly 100.0%.
function roundTo100(items) {
  const floored = items.map(item => ({
    ...item,
    pct: Math.floor(item.pct * 10) / 10,
  }))
  let remainder = Math.round((100 - floored.reduce((s, i) => s + i.pct, 0)) * 10)
  floored
    .map((item, idx) => ({ idx, frac: (items[idx].pct * 10) % 1 }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, remainder)
    .forEach(({ idx }) => {
      floored[idx].pct = Math.round((floored[idx].pct + 0.1) * 10) / 10
    })
  return floored
}

export function filterRows(rows, { cameras, dateRange }) {
  let filtered = rows

  if (cameras && cameras.length > 0 && !cameras.includes('All')) {
    filtered = filtered.filter((r) => cameras.includes(r._camera))
  }

  if (dateRange && dateRange[0] && dateRange[1]) {
    filtered = filtered.filter(
      (r) => r._date >= dateRange[0] && r._date <= dateRange[1]
    )
  }

  return filtered
}

export function deduplicateShots(rows) {
  const seen = new Set()
  return rows.filter((r) => {
    if (!r._scene) return false
    const key = `${r._scene}||${r._date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Computes summary stats for the current filter state.
// Returns: { totalTakes, totalShots, shootingDays, avgTakesPerDay, avgShotsPerDay,
//            dateFirst, dateLast, busiestDay }
export function summaryStats(rows, filters) {
  const filtered = filterRows(rows, filters)

  const totalTakes = filtered.length

  // Build a map of date → unique scenes to derive shot/day counts
  const scenesPerDay = {}
  filtered.forEach((r) => {
    if (!r._date || !r._scene) return
    if (!scenesPerDay[r._date]) scenesPerDay[r._date] = new Set()
    scenesPerDay[r._date].add(r._scene)
  })

  const shootingDays = Object.keys(scenesPerDay).length
  const totalShots = Object.values(scenesPerDay).reduce((sum, s) => sum + s.size, 0)
  const avgTakesPerDay = shootingDays > 0 ? (totalTakes / shootingDays).toFixed(1) : 0
  const avgShotsPerDay = shootingDays > 0 ? (totalShots / shootingDays).toFixed(1) : 0

  const sortedDates = Object.keys(scenesPerDay).sort()
  const dateFirst = sortedDates[0] || null
  const dateLast = sortedDates[sortedDates.length - 1] || null

  const busiestEntry = Object.entries(scenesPerDay).sort((a, b) => b[1].size - a[1].size)[0]
  const busiestDay = busiestEntry ? { date: busiestEntry[0], count: busiestEntry[1].size } : null

  return { totalTakes, totalShots, shootingDays, avgTakesPerDay, avgShotsPerDay, dateFirst, dateLast, busiestDay }
}

const CAMERA_COLOR_MAP = {
  A: '#e53935',
  B: '#1e88e5',
  C: '#f9c00e',
  D: '#43a047',
  E: '#fb8c00',
  F: '#8e24aa',
  G: '#e91e8c',
  H: '#d4ff00',
  J: '#39ff14',
  K: '#ff6b00',
  L: '#ff10f0',
  X: '#78909c',
}

const CAMERA_FALLBACK_COLORS = [
  '#00bcd4', '#ff1744', '#00e5ff', '#76ff03', '#ff9100', '#d500f9', '#00e676', '#40c4ff',
]

export function getCameraColor(cameraName) {
  const letter = (cameraName || '').charAt(0).toUpperCase()
  return CAMERA_COLOR_MAP[letter] || null
}

export function getCameraColorByIndex(cameraName, index) {
  return getCameraColor(cameraName) || CAMERA_FALLBACK_COLORS[index % CAMERA_FALLBACK_COLORS.length]
}

export function cameraUsage(rows) {
  const seen = new Set()
  const counts = {}
  const models = {}
  rows.forEach((r) => {
    if (!r._scene) return
    const key = `${r._camera}||${r._scene}||${r._date}`
    if (seen.has(key)) return
    seen.add(key)
    const cam = r._camera || 'Unknown'
    counts[cam] = (counts[cam] || 0) + 1
    if (!models[cam] && r._cameraModel) models[cam] = r._cameraModel
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return roundTo100(
    Object.entries(counts)
      .map(([name, count]) => ({ name, model: models[name] || '', count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  )
}

function normalizeLens(raw) {
  let s = raw.trim()
  if (!s) return null
  if (/^zooms?$/i.test(s)) return null
  // Strip redundant ".mm" or extra "mm" appended after a valid focal length: "35mm .mm" → "35mm"
  s = s.replace(/(\d+mm)\s*[.,]?\s*mm\b/gi, '$1').trim()
  return s || null
}

export function lensUsage(rows) {
  let unknownCount = 0
  const counts = {}
  rows.forEach((r) => {
    const tokens = (r._lens || '').split(',').map(l => normalizeLens(l)).filter(Boolean)
    if (tokens.length === 0) {
      unknownCount++
    } else {
      tokens.forEach(l => { counts[l] = (counts[l] || 0) + 1 })
    }
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  const data = roundTo100(
    Object.entries(counts)
      .map(([lens, count]) => ({ name: lens, count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  )
  return { data, unknownCount }
}

export function supportUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    if (!r._support) return
    counts[r._support] = (counts[r._support] || 0) + 1
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return roundTo100(
    Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  )
}

export function takesPerDay(rows) {
  const counts = {}
  rows.forEach((r) => {
    if (!r._date) return
    counts[r._date] = (counts[r._date] || 0) + 1
  })
  return Object.entries(counts)
    .map(([date, count]) => ({ name: date, count }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Converts fraction notation with any separator to slash: "1-4" → "1/4".
// Period is excluded from the separator class to protect ND decimal values like "ND 1.4".
function normalizeFractions(s) {
  return s.replace(/\b1\s*[^\d\w\s.]\s*(2|4|8|16)\b/g, '1/$1')
}

// Normalizes an ND/IRND filter to a canonical label, or returns null if `s` isn't one.
//
// CamLog stores these densities as .3/.6/.9/1.2/1.5/1.8/2.1/2.4, but logs in the wild
// use the compact tenths shorthand too (3→0.3, 15→1.5, 24→2.4). Both spellings mean the
// same filter, so we fold them to one canonical density. Int/Ext is a real modifier in
// CamLog's schema (not a spelling variant), so it's PRESERVED as a distinct category —
// "INTERNAL ND 1.5" stays separate from a plain "ND 1.5". Other product suffixes
// (SE, HE, ATN…) stay fused to the type as before ("NDSE 0.6").
//
// Handles leading words ("Internal ND15"), abbreviations ("EXT ND .6"), parenthesized
// modifiers ("ND1.2 (Int)"), IRND, and either strength/suffix order ("ND 6 SE" / "NDSE 6").
// Bails (→ null) on anything that isn't a clean single token, e.g. comma-less compounds
// like "ND 1.2 POLA CLEAR", which then fall through to default handling.
function parseNd(s) {
  if (!/nd/i.test(s)) return null

  let qual = ''
  const setQual = (q) => { if (!qual && q) qual = /^int/i.test(q) ? 'Internal' : 'External' }

  // Pull an Int/Ext qualifier from parentheses or a leading word.
  const par = s.match(/\((int(?:ernal)?|ext(?:ernal)?)\)/i)
  if (par) { setQual(par[1]); s = s.replace(par[0], ' ') }
  const lead = s.match(/^(int(?:ernal)?|ext(?:ernal)?)\b\s*/i)
  if (lead) { setQual(lead[1]); s = s.slice(lead[0].length) }
  s = s.replace(/\s+/g, ' ').trim()

  // Must be ND or IRND now (the anchor protects names that merely contain "nd", e.g. "BLACK DIAMOND").
  const typeM = s.match(/^(ir)?nd(?:\b|(?=[.\d]))/i)
  if (!typeM) return null
  const type = typeM[1] ? 'IRND' : 'ND'
  const body = s.slice(typeM[0].length).trim()

  // body := optional-suffix + optional-number + optional-suffix, nothing else.
  const m = body.match(/^([a-z]{2,})?\s*(\d*\.?\d+)?\s*([a-z]{2,}(?:\/[a-z]{2,})?)?$/i)
  if (!m) return null
  let suffix = m[1] || m[3] || ''
  const numStr = m[2] || ''
  if (/^(int(?:ernal)?|ext(?:ernal)?)$/i.test(suffix)) { setQual(suffix); suffix = '' }

  // Integers are tenths shorthand (15 → 1.5); decimals pass through.
  let density = ''
  if (numStr) {
    let val = parseFloat(numStr)
    if (!numStr.includes('.')) val = val / 10
    density = val.toFixed(1)
  }

  const prefix = qual ? `${qual} ` : ''
  const nd = suffix ? `${type}${suffix.toUpperCase()}` : type
  return `${prefix}${nd}${density ? ` ${density}` : ''}`.toUpperCase()
}

function normalizeFilter(raw) {
  let s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return null

  // ND/IRND filters (incl. Internal/External variants) — handled before the generic
  // preprocessing below, which would otherwise mangle decimals like "ND.3" → "ND 3".
  const nd = parseNd(s)
  if (nd) return nd

  s = normalizeFractions(
    s
      // Sub-1.0 decimal strengths (GRAD.6, ATT.3) → "0.x" so they read as densities,
      // not whole stops. (ND/IRND already handled above.)
      .replace(/([a-z])\s*\.(\d)/gi, '$1 0.$2')
      .replace(/([a-z])(\d)/gi, '$1 $2')       // space between abbrev and number: BDFX2 → BDFX 2
  ).replace(/\s+/g, ' ').trim()
  if (!s) return null

  // Diopter / Split Diopter → "Diopter +N" / "Split Diopter +N" (N whole or fractional).
  // "Split" may lead ("Split DIO 2") or trail as CamLog's modifier ("DIO2 (Split)").
  {
    let d = s
    let split = false
    if (/^split\b/i.test(d))            { split = true; d = d.replace(/^split\s*/i, '') }
    if (/\(?\bsplit\b\)?\s*$/i.test(d)) { split = true; d = d.replace(/\s*\(?\bsplit\b\)?\s*$/i, '') }
    d = d.trim()
    const pre = split ? 'Split ' : ''
    const dioMatch = d.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+(?:\/\d+)?)$/i)
    if (dioMatch) return `${pre}Diopter +${dioMatch[1]}`
    // Fallback for any separator that survived pre-processing (e.g. unusual dash variants)
    const dioSepMatch = d.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+)\s*[^\d\w\s.]\s*(\d+)$/i)
    if (dioSepMatch) return `${pre}Diopter +${dioSepMatch[1]}/${dioSepMatch[2]}`
    if (/^(?:dio(?:pter)?)$/i.test(d)) return `${pre}Diopter`
  }

  // Polarizer
  if (/^pola(?:ri[sz]er)?$/i.test(s)) return 'Pola'

  // Clear (exact) → "Clear"; variants like "Clear (Nose Grease)" fall through to default
  if (/^clear$/i.test(s)) return 'Clear'

  // Bare fraction with no filter name → skip
  if (/^\d+[^\d\w\s.]\d+$/.test(s)) return null

  // Clear variants with extra info → title case (not uppercase) for readability
  // Normalize missing space before parenthesis: "CLEAR(NOSE GREASE)" → "Clear (Nose Grease)"
  if (/\bclear\b/i.test(s)) {
    const spaced = s.replace(/([a-zA-Z\d])\(/, '$1 (').replace(/\)([a-zA-Z\d])/, ') $1')
    return spaced.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  // Default: uppercase abbreviation, with any remaining fractions normalized
  return normalizeFractions(s).toUpperCase()
}

export function filterUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    if (!r._filter) return
    r._filter.split(',').map(f => normalizeFilter(f)).filter(Boolean).forEach(f => {
      counts[f] = (counts[f] || 0) + 1
    })
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return roundTo100(
    Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  )
}

// Splits a percentage-sorted list into a head worth showing and a low-value tail.
// Rule: hide items below `threshold`%, but always keep at least `minVisible`, and
// only collapse at all when the tail has at least `minHidden` items (a 1–2 item tail
// isn't worth a toggle). Input must be sorted descending by pct — which every
// *Usage() helper returns, since pct is proportional to count.
// Returns { visible, hidden, hiddenPct, hiddenCount }.
export function splitLowValue(data, { threshold = 2, minVisible = 8, minHidden = 3 } = {}) {
  const aboveCount = data.filter((d) => d.pct >= threshold).length
  const cutoff = Math.max(minVisible, aboveCount)
  const hidden = data.slice(cutoff)
  if (hidden.length < minHidden) {
    return { visible: data, hidden: [], hiddenPct: 0, hiddenCount: 0 }
  }
  return {
    visible: data.slice(0, cutoff),
    hidden,
    hiddenPct: hidden.reduce((s, d) => s + d.pct, 0),
    hiddenCount: hidden.reduce((s, d) => s + d.count, 0),
  }
}

export function getDateRange(rows) {
  const dates = rows.map((r) => r._date).filter(Boolean).sort()
  return [dates[0] || '', dates[dates.length - 1] || '']
}

export function getCamerasInData(rows) {
  const cams = [...new Set(rows.map((r) => r._camera).filter(Boolean))].sort()
  return cams
}
