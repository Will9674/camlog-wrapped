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

  if (metric === 'setups') {
    const seen = new Set()
    filtered = filtered.filter((r) => {
      const key = `${r._scene}||${r._date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  return filtered
}

export function summaryStats(rows, allRows, filters) {
  const filtered = filterRows(allRows, filters)

  const totalTakes = filtered.length

  const daySet = new Set(filtered.map((r) => r._date).filter(Boolean))
  const shootingDays = daySet.size

  const avgTakesPerDay =
    shootingDays > 0 ? (totalTakes / shootingDays).toFixed(1) : 0

  const scenesPerDay = {}
  filtered.forEach((r) => {
    if (!r._date) return
    if (!scenesPerDay[r._date]) scenesPerDay[r._date] = new Set()
    scenesPerDay[r._date].add(r._scene)
  })
  const dayCount = Object.keys(scenesPerDay).length
  const totalScenes = Object.values(scenesPerDay).reduce(
    (sum, s) => sum + s.size,
    0
  )
  const avgShotsPerDay = dayCount > 0 ? (totalScenes / dayCount).toFixed(1) : 0

  return { totalTakes, shootingDays, avgTakesPerDay, avgShotsPerDay }
}

export function lensUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    const lens = r._lens || 'Unknown'
    counts[lens] = (counts[lens] || 0) + 1
  })
  const total = rows.length
  return Object.entries(counts)
    .map(([lens, count]) => ({ name: lens, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function supportUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    if (!r._support) return
    counts[r._support] = (counts[r._support] || 0) + 1
  })
  const total = rows.filter((r) => r._support).length
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
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

export function filterUsage(rows) {
  const counts = {}
  rows.forEach((r) => {
    const f = r._filter
    if (!f) return
    counts[f] = (counts[f] || 0) + 1
  })
  const total = rows.filter((r) => r._filter).length
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, pct: total ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function getDateRange(rows) {
  const dates = rows.map((r) => r._date).filter(Boolean).sort()
  return [dates[0] || '', dates[dates.length - 1] || '']
}

export function getCamerasInData(rows) {
  const cams = [...new Set(rows.map((r) => r._camera).filter(Boolean))].sort()
  return cams
}
