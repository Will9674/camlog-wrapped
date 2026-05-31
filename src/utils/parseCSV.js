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
  // Dates may come as M/D/YYYY or YYYY-MM-DD
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [m, d, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return dateStr
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
