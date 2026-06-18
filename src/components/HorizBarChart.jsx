import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { useTheme } from '../theme-context'
import { useContainerWidth } from '../hooks/useContainerWidth'

const pl = (n, plural) => `${n} ${n === 1 ? plural.replace(/s$/, '') : plural}`

const CustomTooltip = ({ active, payload, label, countLabel }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-(--c-surface2) border border-(--c-border) px-3 py-2 text-sm font-['DM_Mono'] rounded">
      <div className="text-(--c-ink) font-medium">{label}</div>
      <div className="text-(--c-ink2)">{payload[0].value}{payload[0].unit} · {pl(payload[0].payload.count, countLabel)}</div>
    </div>
  )
}

export default function HorizBarChart({ data, valueKey = 'pct', showPct = true, labelFormatter, countLabel = 'Shots' }) {
  const [containerRef, containerWidth] = useContainerWidth()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const tickColor = isLight ? '#6c6c70' : '#8e8e93'
  const labelColor = isLight ? '#1c1c1e' : '#f2f2f7'
  const cursorFill = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
  const barTrack = isLight ? '#e0e0e5' : '#2a2a2c'

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-(--c-ink2) font-['DM_Mono'] text-sm">
        No data
      </div>
    )
  }

  const isNarrow = containerWidth < 480

  const formatted = data.map((d) => ({
    ...d,
    displayValue: showPct ? parseFloat(d[valueKey].toFixed(1)) : d[valueKey],
    label: labelFormatter ? labelFormatter(d.name) : d.name,
    barLabelFull: showPct
      ? `${parseFloat(d[valueKey].toFixed(1))}%  ·  ${pl(d.count, countLabel)}`
      : pl(d.count, countLabel),
  }))

  // Mobile: full-width CSS bars
  if (isNarrow) {
    const maxVal = Math.max(...formatted.map((d) => d.displayValue), 1)
    const scaledMax = maxVal * 1.1

    return (
      <div ref={containerRef} className="w-full">
        {formatted.map((d) => {
          const widthPct = Math.max(0.5, (d.displayValue / scaledMax) * 100)
          return (
            <div key={d.name} className="mb-4">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-['DM_Mono'] text-[11px] text-(--c-ink) leading-tight">{d.label}</span>
                <span className="font-['DM_Mono'] text-[10px] text-(--c-ink2) ml-3 flex-shrink-0">{d.barLabelFull}</span>
              </div>
              <div className="h-5 rounded-sm overflow-hidden" style={{ background: barTrack }}>
                <div className="h-full rounded-sm" style={{ width: `${widthPct}%`, minWidth: 3, background: 'var(--c-accent)' }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Desktop: Recharts horizontal bar chart
  const longestLabel = Math.max(...formatted.map((d) => (d.label || '').length))
  const yAxisWidth = Math.min(Math.max(80, longestLabel * 9), 260)

  const barHeight = 28
  const gap = 10
  const height = Math.max(120, formatted.length * (barHeight + gap) + 40)

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 4, right: 180, bottom: 4, left: 4 }}
          barSize={barHeight}
        >
          <XAxis
            type="number"
            domain={[0, showPct ? 100 : 'auto']}
            tickFormatter={showPct ? (v) => `${v}%` : undefined}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fontFamily: 'DM Mono', fontSize: 12, fill: labelColor }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip countLabel={countLabel} />} cursor={{ fill: cursorFill }} />
          <Bar dataKey="displayValue" radius={[0, 2, 2, 0]} unit={showPct ? '%' : ''}>
            {formatted.map((_, i) => (
              <Cell key={i} style={{ fill: 'var(--c-accent)' }} />
            ))}
            <LabelList
              dataKey="barLabelFull"
              position="right"
              style={{ fontFamily: 'DM Mono', fontSize: 11, fill: tickColor }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
