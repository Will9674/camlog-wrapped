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

export function filterRows(rows, { cameras, circledOnly, metric, dateRange }) {
  let filtered = rows

  if (cameras && cameras.length > 0 && !cameras.includes('All')) {
    filtered = filtered.filter((r) => cameras.includes(r._camera))
  }

  if (circledOnly) {
    filtered = filtered.filter((r) => r._circled)
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

export function summaryStats(rows, allRows, filters) {
  const filtered = filterRows(allRows, filters)

  const totalTakes = filtered.length

  const daySet = new Set(filtered.filter((r) => r._scene).map((r) => r._date).filter(Boolean))
  const shootingDays = daySet.size

  const avgTakesPerDay =
    shootingDays > 0 ? (totalTakes / shootingDays).toFixed(1) : 0

  const scenesPerDay = {}
  filtered.forEach((r) => {
    if (!r._date || !r._scene) return
    if (!scenesPerDay[r._date]) scenesPerDay[r._date] = new Set()
    scenesPerDay[r._date].add(r._scene)
  })
  const dayCount = Object.keys(scenesPerDay).length
  const totalScenes = Object.values(scenesPerDay).reduce(
    (sum, s) => sum + s.size,
    0
  )
  const avgShotsPerDay = dayCount > 0 ? (totalScenes / dayCount).toFixed(1) : 0

  const totalShots = Object.values(scenesPerDay).reduce((sum, s) => sum + s.size, 0)

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
  // Deduplicate by scene+date+camera so multi-camera shots count once per camera
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
  // Strip redundant ".mm" or extra "mm" appended after a valid focal length
  // "35mm .mm" → "35mm"
  s = s.replace(/(\d+mm)\s*[.,]?\s*mm\b/gi, '$1').trim()
  return s || null
}

export function lensUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    const tokens = (r._lens || '').split(',').map(l => normalizeLens(l)).filter(Boolean)
    if (tokens.length === 0) {
      counts['Unknown'] = (counts['Unknown'] || 0) + 1
    } else {
      tokens.forEach(l => { counts[l] = (counts[l] || 0) + 1 })
    }
  })
  const total = Object.values(counts).reduce((s, c) => s + c, 0)
  return roundTo100(
    Object.entries(counts)
      .map(([lens, count]) => ({ name: lens, count, pct: total ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
  )
}

export function supportUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    if (!r._support) return
    counts[r._support] = (counts[r._support] || 0) + 1
  })
  const total = rows.filter((r) => r._support).length
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

function normalizeFilter(raw) {
  let s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return null

  s = s
    .replace(/([a-z])[.,](\d)/gi, '$1 $2')                    // strip stray dot/comma: ND.3 → ND 3
    .replace(/([a-z])(\d)/gi, '$1 $2')                         // space between abbrev and number: BDFX2 → BDFX 2
    .replace(/\b1\s*[^\d\w\s.]\s*(2|4|8|16)\b/g, '1/$1')     // any separator → slash: 1-4 → 1/4 (period excluded to protect ND decimals)
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return null

  // ND filters: ND3, ND 3, ND0.3, ND 0.3, ND6 SE, ND12 HE, ND3SE → "ND 0.3", "ND 0.6 SE", "ND 1.2 HE"
  // Integers are shorthand for tenths: 3 → 0.3, 6 → 0.6, 12 → 1.2
  // Letter suffixes (SE, HE, INT, EXT, etc.) are preserved — they identify distinct filter products
  const ndMatch = s.match(/^nd\s*(\d*\.?\d+)\s*([a-z]+(?:\/[a-z]+)?)?$/i)
  if (ndMatch) {
    const numStr = ndMatch[1]
    const rawSuffix = ndMatch[2] || ''
    // INT/EXT are form-factor variants (built-in vs mattebox) — strip them, same filter density
    // All other suffixes (SE, HE, etc.) identify distinct products — preserve them
    const suffix = /^(?:int(?:\/ext)?|ext(?:\/int)?)$/i.test(rawSuffix) ? '' : rawSuffix.toUpperCase()
    let val = parseFloat(numStr)
    if (!numStr.includes('.')) val = val / 10
    return suffix ? `ND ${val.toFixed(1)} ${suffix}` : `ND ${val.toFixed(1)}`
  }
  // Bare "ND" with no strength → skip
  if (/^nd$/i.test(s)) return null

  // Split Diopter: supports integer and fraction strengths
  // "Split DIO 2", "Split Diopter 1/2" → "Split Diopter +2", "Split Diopter +1/2"
  const splitDioMatch = s.match(/^split\s+(?:dio(?:pter)?)\s*\+?\s*(\d+(?:\/\d+)?)$/i)
  if (splitDioMatch) return `Split Diopter +${splitDioMatch[1]}`

  // Diopter with slash fraction (after pre-processing converts any dash → slash)
  const dioMatch = s.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+(?:\/\d+)?)$/i)
  if (dioMatch) return `Diopter +${dioMatch[1]}`
  // Diopter with any other separator still remaining (belt-and-suspenders fallback)
  const dioSepMatch = s.match(/^(?:dio(?:pter)?)\s*\+?\s*(\d+)\s*[^\d\w\s.]\s*(\d+)$/i)
  if (dioSepMatch) return `Diopter +${dioSepMatch[1]}/${dioSepMatch[2]}`
  // Bare "DIO"/"Diopter" with no strength → skip
  if (/^(?:dio(?:pter)?)$/i.test(s)) return null

  // Polarizer: Pola, POLA, Polarizer, Polariser → "Pola"
  if (/^pola(?:ri[sz]er)?$/i.test(s)) return 'Pola'

  // Clear (exact) → "Clear"; variants like "Clear (Nose Grease)" fall through to default
  if (/^clear$/i.test(s)) return 'Clear'

  // Bare fraction with no filter name, any separator → skip
  if (/^\d+[^\d\w\s.]\d+$/.test(s)) return null

  // Bare filter name with no number → skip
  // Exception: entries containing "clear" (e.g., "Clear (Nose Grease)") are valid without a number
  if (!/\d/.test(s) && !/\bclear\b/i.test(s)) return null

  // Default: uppercase — filter names are abbreviations (BDFX, BPM, HBM, etc.)
  // Also normalize any remaining fraction separators (e.g. BDFX 1-4 → BDFX 1/4)
  return s.replace(/\b1\s*[^\d\w\s.]\s*(2|4|8|16)\b/g, '1/$1').toUpperCase()
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
