import Papa from 'papaparse'

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (value) => value.trim(),
      complete: (results) => resolve(results.data),
      error: reject,
    })
  })
}

const SUPPORT_RULES = [
  // Most specific first to avoid being shadowed by shorter terms
  { label: 'Dana Dolly',   pattern: /\bdana[\s-]?dolly\b/i },
  { label: 'Mini Libra',   pattern: /\bmini[\s-]?libra\b/i },
  { label: 'Mini Scope',   pattern: /\bmini[\s-]?scope\b/i },
  { label: 'Remote Head',  pattern: /\bremote[\s-]?head\b/i },
  // Techno / Techno Crane / Technocrane / Techno-Crane
  { label: 'Technocrane',  pattern: /\btechno[\s-]?(crane)?\b/i },
  // Steadicam / Steadi / Stedicam / Stedi / Steadycam / Steady Cam
  { label: 'Steadicam',    pattern: /\bste[ae]?di(cam)?\b|\bsteady[\s-]?cam\b/i },
  // Handheld / Hand Held / Hand-Held / HH
  { label: 'Handheld',     pattern: /\bhand[\s-]?held\b|\bHH\b/i },
  { label: 'High Hat',     pattern: /\b(?:high|hi)[\s-]?hat\b/i },
  { label: 'Low Hat',      pattern: /\blow[\s-]?hat\b/i },
  // Sticks / Stick / Baby Sticks / Standard Sticks / Standards / Babies
  // Excludes slate clapper notations: No Sticks, 2nd Sticks, Mid Sticks, Tail Sticks, Head Sticks
  { label: 'Sticks',       pattern: /(?:(?<!(?:no|2nd|mid|tail|head)\s)\bsticks?\b|\bbaby[\s-]+sticks?\b|\bstandard[\s-]+sticks?\b|\bstandards\b|\bbabies\b)/i },
  { label: 'Slider',       pattern: /\bslider\b/i },
  { label: 'Dolly',        pattern: /\bdolly\b/i },
  { label: 'Jib',          pattern: /\bjib\b/i },
  // Ronin / Ronin-S / Ronin-M etc.
  { label: 'Ronin',        pattern: /\bronin/i },
  // Gimbal / Gimble
  { label: 'Gimbal',       pattern: /\bgimb[ae]l\b/i },
]

export function parseSupportType(notes, description = '') {
  const text = [notes, description].filter(Boolean).join(' ').trim()
  if (!text) return null
  for (const rule of SUPPORT_RULES) {
    if (rule.pattern.test(text)) return rule.label
  }
  return null
}

export function formatDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim()
  // Already ISO (YYYY-MM-DD…) — take the date portion
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // M/D/YYYY or M/D/YY
  const parts = s.split('/')
  if (parts.length === 3) {
    let [m, d, y] = parts
    if (y.length === 2) y = '20' + y
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Textual formats like "Jun 7" or "Jun 7, 2026" (older CamLog exports).
  // Date.parse infers the year for bare "Mon D" — not perfect for multi-year
  // shoots, but yields a sortable YYYY-MM-DD instead of a lexical string.
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime())) {
    const y  = parsed.getFullYear()
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const dd = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }
  return s
}

export function processData(rawRows) {
  return rawRows.map((row) => ({
    ...row,
    _date: formatDate(row['Date'] || row['date'] || ''),
    _circled: (row['Circled'] || '').toLowerCase() === 'true',
    _camera: (row['Camera'] || '').toUpperCase().trim(),
    _lens: (row['Lens'] || '').trim(),
    _scene: (row['Scene'] || '').trim(),
    _support: parseSupportType(row['Notes'] || '', row['Description'] || ''),
    _filter: (row['Filters'] || '').trim() || null,
  }))
}
