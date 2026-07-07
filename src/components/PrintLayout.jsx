import { useMemo, forwardRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, LabelList, Cell } from 'recharts'
import { lensUsage, supportUsage, filterUsage, cameraUsage, takesPerDay, deduplicateShots, getCameraColorByIndex, splitLowValue } from '../utils/stats'
import { fmtDate } from '../utils/format'

const CHART_WIDTH = 652

function CameraPrintChart({ data }) {
  if (!data || data.length === 0) return null
  return (
    <div>
      <div style={{ display: 'flex', height: 32, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        {data.map((cam, i) => (
          <div key={cam.name} style={{ width: `${cam.pct}%`, background: getCameraColorByIndex(cam.name, i), minWidth: cam.pct > 0 ? 2 : 0 }} />
        ))}
      </div>
      {data.map((cam, i) => (
        <div key={cam.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: getCameraColorByIndex(cam.name, i), flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#1a1916' }}>{cam.name}</span>
            {cam.model ? (
              <>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#a09e99' }}> · </span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6b6762' }}>{cam.model}</span>
              </>
            ) : (
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6b6762' }}> CAMERA</span>
            )}
          </div>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#6b6762', flexShrink: 0 }}>{cam.pct.toFixed(1)}%</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#a09e99', width: 80, textAlign: 'right', flexShrink: 0 }}>{cam.count} {cam.count === 1 ? 'Shot' : 'Shots'}</span>
        </div>
      ))}
    </div>
  )
}

const s = {
  mono: { fontFamily: 'DM Mono, monospace' },
  label: { fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b6762', marginBottom: 5, fontFamily: 'DM Mono, monospace' },
  sectionHeading: { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b6762', marginBottom: 14, fontFamily: 'DM Mono, monospace' },
}

function StatCard({ label, value, small = false }) {
  return (
    <div style={{ flex: 1, background: 'white', border: '1px solid #e8e3da', borderRadius: 10, padding: '12px 16px' }}>
      <div style={s.label}>{label}</div>
      <div style={{ fontSize: small ? 16 : 30, fontWeight: 600, color: '#1a1916', lineHeight: 1.2, ...s.mono }}>{value}</div>
    </div>
  )
}

function StatRow({ children }) {
  return <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>{children}</div>
}

// A "winner" highlight card: label, top item name (truncated), and its share.
function Highlight({ label, name, pct }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'white', border: '1px solid #e8e3da', borderRadius: 10, padding: '12px 16px' }}>
      <div style={s.label}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1916', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...s.mono }}>{name}</div>
      <div style={{ fontSize: 12, color: '#6b6762', marginTop: 3, ...s.mono }}>{pct.toFixed(1)}%</div>
    </div>
  )
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

  // Collapse the low-value tail into a single "Other" row so the PDF stays readable
  // (same 2% guard-railed rule as the dashboard, but static since a PDF can't expand).
  const { visible, hidden, hiddenPct, hiddenCount } = splitLowValue(data)
  const rows = hidden.length > 0
    ? [...visible, { name: `Other (${hidden.length})`, pct: hiddenPct, count: hiddenCount, _other: true }]
    : data

  const formatted = rows.map((d) => ({
    ...d,
    displayValue: parseFloat(d.pct.toFixed(1)),
    barLabel: `${d.pct.toFixed(1)}%  ·  ${d.count} ${d.count === 1 ? 'Shot' : 'Shots'}`,
  }))

  const longestLabel = Math.max(...formatted.map((d) => (d.name || '').length))
  const yAxisWidth = Math.min(Math.max(80, longestLabel * 9), 260)
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
        {formatted.map((d, i) => <Cell key={i} fill={d._other ? '#a09e99' : '#1a1916'} />)}
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

const PrintLayout = forwardRef(function PrintLayout({ rows, stats, projectTitle, filterContext }, ref) {
  const shotsRows      = useMemo(() => deduplicateShots(rows), [rows])
  const { data: lensData, unknownCount: lensUnknown } = useMemo(() => lensUsage(shotsRows), [shotsRows])
  const suppData       = useMemo(() => supportUsage(shotsRows), [shotsRows])
  const suppExcluded   = useMemo(() => shotsRows.length - suppData.reduce((s, d) => s + d.count, 0), [shotsRows, suppData])
  const filtrData  = useMemo(() => filterUsage(shotsRows), [shotsRows])
  const camData    = useMemo(() => cameraUsage(rows), [rows])
  const perDayData = useMemo(() => takesPerDay(shotsRows), [shotsRows])
  const generatedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })


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
      <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: '1px solid #d8d2c8' }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', fontFamily: '-apple-system,"system-ui","Segoe UI",Helvetica,Arial,sans-serif', marginBottom: 8 }}>
          <span style={{ color: '#1a1916' }}>Cam</span>
          <span style={{ color: '#e63946' }}>Log</span>
          <span style={{
            fontFamily: 'DM Mono, monospace',
            fontWeight: 700,
            letterSpacing: 'normal',
            background: 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}> Wrapped</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, color: '#1a1916', letterSpacing: '0.06em', textTransform: 'uppercase', ...s.mono }}>
          {projectTitle}
        </div>
        {filterContext && (
          <div style={{ fontSize: 12, color: '#6b6762', letterSpacing: '0.04em', marginTop: 8, ...s.mono }}>
            Filtered · {filterContext}
          </div>
        )}
      </div>

      {/* Global summary */}
      <StatRow>
        <StatCard label="Total Shots" value={stats.totalShots} />
        <StatCard label="Shooting Days" value={stats.shootingDays} />
        <StatCard label="Avg Shots / Day" value={stats.avgShotsPerDay} />
      </StatRow>

      {/* Highlights — the winners of each breakdown, up top before the detail charts */}
      {(lensData[0] || suppData[0] || filtrData[0]) && (
        <StatRow>
          {lensData[0]  && <Highlight label="Top Lens"     name={lensData[0].name}  pct={lensData[0].pct} />}
          {suppData[0]  && <Highlight label="Most Shot On"  name={suppData[0].name}  pct={suppData[0].pct} />}
          {filtrData[0] && <Highlight label="Top Filter"    name={filtrData[0].name} pct={filtrData[0].pct} />}
        </StatRow>
      )}
      {(stats.dateFirst || stats.busiestDay) && (() => {
        const a = stats.dateFirst ? fmtDate(stats.dateFirst) : null
        const b = stats.dateLast ? fmtDate(stats.dateLast) : null
        const dateRange = (a && b)
          ? (a.year === b.year ? `${a.label} – ${b.label}, ${a.year}` : `${a.label}, ${a.year} – ${b.label}, ${b.year}`)
          : null
        const bd = stats.busiestDay
        const busiestStr = bd ? `${fmtDate(bd.date).label} · ${bd.count} ${bd.count === 1 ? 'Shot' : 'Shots'}` : null
        return (
          <StatRow>
            {dateRange && <StatCard label="Date Range" value={dateRange} small />}
            {busiestStr && <StatCard label="Busiest Day" value={busiestStr} small />}
          </StatRow>
        )
      })()}

      {/* Lens Usage */}
      <SectionCard title="Lens Usage">
        <HorizPrintChart data={lensData} />
        {lensUnknown > 0 && (
          <div style={{ marginTop: 12, fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#a09e99' }}>
            {lensUnknown} of {shotsRows.length} shots ({Math.round((lensUnknown / shotsRows.length) * 100)}%) had no lens data recorded and are not shown.
          </div>
        )}
      </SectionCard>

      {/* Camera Support */}
      {suppData.length > 0 && (
        <SectionCard title="Camera Support">
          <HorizPrintChart data={suppData} />
          {suppExcluded > 0 && (
            <div style={{ marginTop: 12, fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#a09e99' }}>
              {suppExcluded} of {shotsRows.length} shots ({Math.round((suppExcluded / shotsRows.length) * 100)}%) had no recognized camera support data and are not shown.
            </div>
          )}
        </SectionCard>
      )}

      {/* Camera Breakdown */}
      {camData.length > 0 && (
        <SectionCard title="Camera Breakdown">
          <CameraPrintChart data={camData} />
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
        <VertPrintChart data={perDayData} />
      </SectionCard>

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid #d8d2c8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, color: '#a09e99', fontFamily: 'DM Mono, monospace' }}>
          Generated {generatedOn}
        </span>
        <span style={{ fontSize: 10, color: '#6b6762', letterSpacing: '0.06em', fontFamily: 'DM Mono, monospace' }}>
          camlog.app
        </span>
      </div>
    </div>
  )
})

export default PrintLayout
