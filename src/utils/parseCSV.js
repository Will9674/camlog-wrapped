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
  {
    label: 'Handheld',
    match: (note) => /^handheld/i.test(note),
  },
  {
    label: 'Sticks / High Hat',
    match: (note) =>
      /^(sticks|high\s*hat|cine\s*saddle|egyptian\s*pancake\s*roller|on\s*ground\s*with\s*wedges)/i.test(note),
  },
  {
    label: 'Slider / Dana Dolly',
    match: (note) => /^(slider|dana\s*dolly)/i.test(note),
  },
]

export function parseSupportType(notes) {
  if (!notes) return null
  const trimmed = notes.trim()
  for (const rule of SUPPORT_RULES) {
    if (rule.match(trimmed)) return rule.label
  }
  return null
}

export function formatDate(dateStr) {
  if (!dateStr) return null
  // CineLog dates may come as M/D/YYYY or YYYY-MM-DD
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
    _support: parseSupportType(row['Notes'] || ''),
    _filter: (row['Filters'] || '').trim() || null,
  }))
}
