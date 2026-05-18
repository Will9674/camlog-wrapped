import { useMemo, forwardRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, LabelList, Cell } from 'recharts'
import { lensUsage, supportUsage, filterUsage, takesPerDay, deduplicateShots } from '../utils/stats'

const CHART_WIDTH = 652

const s = {
  mono: { fontFamily: 'DM Mono, monospace' },
  label: { fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b6762', marginBottom: 4, fontFamily: 'DM Mono, monospace' },
  sectionHeading: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a09e99', marginBottom: 14, fontFamily: 'DM Mono, monospace' },
}

function StatCard({ label, value }) {
  return (
    <div style={{ flex: 1, background: 'white', border: '1px solid #e8e3da', borderRadius: 10, padding: '12px 16px' }}>
      <div style={s.label}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1916', ...s.mono }}>{value}</div>
    </div>
  )
}

function StatRow({ children }) {
  return <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>{children}</div>
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e8e3da', borderRadius: 12, padding: '20px 24px', marginBottom: 24, pageBreakInside: 'avoid' }}>
      <div style={s.sectionHeading}>{title}</div>
      {children}
    </div>
  )
}

function HorizPrintChart({ data }) {
  if (!data || data.length === 0) return null

  const formatted = data.map((d) => ({
    ...d,
    displayValue: parseFloat(d.pct.toFixed(1)),
    barLabel: `${d.pct.toFixed(1)}%  ·  ${d.count} Shots`,
  }))

  const longestLabel = Math.max(...formatted.map((d) => (d.name || '').length))
  const yAxisWidth = Math.min(Math.max(80, longestLabel * 7), 180)
  const barHeight = 24
  const gap = 8
  const height = Math.max(80, formatted.length * (barHeight + gap) + 40)

  return (
    <BarChart
      width={CHART_WIDTH}
      height={height}
      data={formatted}
      layout="vertical"
      margin={{ top: 4, right: 185, bottom: 4, left: 4 }}
      barSize={barHeight}
    >
      <XAxis
        type="number"
        domain={[0, 100]}
        tickFormatter={(v) => `${v}%`}
        tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#a09e99' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        type="category"
        dataKey="name"
        width={yAxisWidth}
        tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#1a1916' }}
        axisLine={false}
        tickLine={false}
      />
      <Bar dataKey="displayValue" radius={[0, 2, 2, 0]}>
        {formatted.map((_, i) => <Cell key={i} fill="#1a1916" />)}
        <LabelList
          dataKey="barLabel"
          position="right"
          style={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b6762' }}
        />
      </Bar>
    </BarChart>
  )
}

function VertPrintChart({ data }) {
  if (!data || data.length === 0) return null

  const formatDate = (d) => {
    if (!d) return ''
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  // Fixed width — jsPDF scales the whole layout to 595pt regardless
  const barSize = Math.min(40, Math.max(4, Math.floor(652 / data.length) - 2))
  const showLabels = barSize >= 20
  const tickInterval = data.length > 20 ? Math.ceil(data.length / 8) - 1 : 0

  return (
    <BarChart
      width={CHART_WIDTH}
      height={220}
      data={data}
      margin={{ top: showLabels ? 18 : 8, right: 16, bottom: 24, left: 0 }}
      barSize={barSize}
    >
      <XAxis
        dataKey="name"
        tickFormatter={formatDate}
        tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#a09e99' }}
        axisLine={false}
        tickLine={false}
        interval={tickInterval}
        angle={data.length > 10 ? -45 : 0}
        textAnchor={data.length > 10 ? 'end' : 'middle'}
      />
      <YAxis
        width={28}
        tick={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#a09e99' }}
        axisLine={false}
        tickLine={false}
        allowDecimals={false}
      />
      <Bar dataKey="count" radius={[2, 2, 0, 0]}>
        {data.map((_, i) => <Cell key={i} fill="#1a1916" />)}
        {showLabels && (
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontFamily: 'DM Mono', fontSize: 9, fill: '#6b6762' }}
          />
        )}
      </Bar>
    </BarChart>
  )
}

const PrintLayout = forwardRef(function PrintLayout({ rows, stats, projectTitle }, ref) {
  const lensData   = useMemo(() => lensUsage(rows), [rows])
  const suppData   = useMemo(() => supportUsage(rows), [rows])
  const filtrData  = useMemo(() => filterUsage(rows), [rows])
  const shotsRows  = useMemo(() => deduplicateShots(rows), [rows])
  const perDayData = useMemo(() => takesPerDay(shotsRows), [shotsRows])


  const shotsDays = new Set(shotsRows.map((r) => r._date).filter(Boolean)).size
  const shotsAvg  = shotsDays > 0 ? (shotsRows.length / shotsDays).toFixed(1) : 0

  return (
    <div
      ref={ref}
      className="print-layout"
      style={{
        position: 'fixed',
        left: -9999,
        top: 0,
        width: 780,
        background: '#f0ece4',
        padding: '40px 40px 60px',
        visibility: 'hidden',
        zIndex: -1,
      }}
    >
      {/* Force recharts SVG to not clip label text outside plot area */}
      <style>{`.print-layout svg { overflow: visible !important; }`}</style>
      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: '1px solid #d8d2c8' }}>
        <div style={{ fontSize: 11, color: '#a09e99', ...s.mono, marginBottom: 4 }}>CineLog Wrapped</div>
        <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1916', letterSpacing: '0.06em', textTransform: 'uppercase', ...s.mono }}>
          {projectTitle}
        </div>
      </div>

      {/* Global summary */}
      <StatRow>
        <StatCard label="Total Shots" value={stats.totalShots} />
        <StatCard label="Shooting Days" value={stats.shootingDays} />
        <StatCard label="Avg Shots / Day" value={stats.avgShotsPerDay} />
      </StatRow>

      {/* Lens Usage */}
      <SectionCard title="Lens Usage">
        <HorizPrintChart data={lensData} />
      </SectionCard>

      {/* Camera Support */}
      {suppData.length > 0 && (
        <SectionCard title="Camera Support">
          <HorizPrintChart data={suppData} />
        </SectionCard>
      )}

      {/* Optical Filters */}
      {filtrData.length > 0 && (
        <SectionCard title="Optical Filters">
          <HorizPrintChart data={filtrData} />
        </SectionCard>
      )}

      {/* Per Day Data */}
      <SectionCard title="Shots Per Day">
        <StatRow>
          <StatCard label="Total Shots" value={shotsRows.length} />
          <StatCard label="Shooting Days" value={shotsDays} />
          <StatCard label="Avg Shots / Day" value={shotsAvg} />
        </StatRow>
        <VertPrintChart data={perDayData} />
      </SectionCard>
    </div>
  )
})

export default PrintLayout
