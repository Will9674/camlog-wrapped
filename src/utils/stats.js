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
  rows.forEach((r) => {
    if (!r._scene) return
    const key = `${r._camera}||${r._scene}||${r._date}`
    if (seen.has(key)) return
    seen.add(key)
    const cam = r._camera || 'Unknown'
    counts[cam] = (counts[cam] || 0) + 1
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return roundTo100(
    Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }))
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

// Formats a parsed ND filter into a canonical label.
// INT/EXT suffixes are stripped (form-factor variants, same density).
// All other suffixes (SE, HE, etc.) are joined directly to ND: "NDSE 0.6".
function formatND(numStr, rawSuffix) {
  let val = parseFloat(numStr)
  if (!numStr.includes('.')) val = val / 10
  const suffix = /^(?:int(?:\/ext)?|ext(?:\/int)?)$/i.test(rawSuffix) ? '' : rawSuffix.toUpperCase()
  return suffix ? `ND${suffix} ${val.toFixed(1)}` : `ND ${val.toFixed(1)}`
}

function normalizeFilter(raw) {
  let s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return null

  s = normalizeFractions(
    s
      .replace(/([a-z])[.,](\d)/gi, '$1 $2')  // strip stray dot/comma: ND.3 → ND 3
      .replace(/([a-z])(\d)/gi, '$1 $2')       // space between abbrev and number: BDFX2 → BDFX 2
  ).replace(/\s+/g, ' ').trim()
  if (!s) return null

  // ND filters — integers are shorthand for tenths: ND3 → ND 0.3, ND12 → ND 1.2
  // Suffixes SE/HE etc. identify distinct filter products and are joined to ND: "NDSE 0.6"
  // INT/EXT are form-factor variants only — stripped, same optical density
  // Handles two input orderings:
  //   suffix before number: "NDSE 3", "NDSE3"  → "NDSE 0.3"
  //   suffix after number:  "ND 6 SE", "ND3SE" → "NDSE 0.6"
  const ndFusedMatch = s.match(/^nd([a-z]{2,})\s*(\d*\.?\d+)$/i)
  if (ndFusedMatch) return formatND(ndFusedMatch[2], ndFusedMatch[1])

  const ndMatch = s.match(/^nd\s*(\d*\.?\d+)\s*([a-z]+(?:\/[a-z]+)?)?$/i)
  if (ndMatch) return formatND(ndMatch[1], ndMatch[2] || '')

  if (/^nd$/i.test(s)) return 'ND'

  // Split Diopter: "Split DIO 2", "Split Diopter 1/2" → "Split Diopter +2", "Split Diopter +1/2"
  const splitDioMatch = s.match(/^split\s+(?:dio(?:pter)?)\s*\+?\s*(\d+(?:\/\d+)?)$/i)
  if (splitDioMatch) return `Split Diopter +${splitDioMatch[1]}`

  // Diopter: "DIO1", "DIO +1", "Diopter 1/2", "DIO 1-2" → "Diopter +1", "Diopter +1/2"
  const dioMatch = s.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+(?:\/\d+)?)$/i)
  if (dioMatch) return `Diopter +${dioMatch[1]}`
  // Fallback for any separator that survived pre-processing (e.g. unusual dash variants)
  const dioSepMatch = s.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+)\s*[^\d\w\s.]\s*(\d+)$/i)
  if (dioSepMatch) return `Diopter +${dioSepMatch[1]}/${dioSepMatch[2]}`
  if (/^(?:dio(?:pter)?)$/i.test(s)) return 'Diopter'

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

export function getDateRange(rows) {
  const dates = rows.map((r) => r._date).filter(Boolean).sort()
  return [dates[0] || '', dates[dates.length - 1] || '']
}

export function getCamerasInData(rows) {
  const cams = [...new Set(rows.map((r) => r._camera).filter(Boolean))].sort()
  return cams
}
