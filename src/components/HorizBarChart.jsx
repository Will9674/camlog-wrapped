import { useRef, useState, useEffect } from 'react'
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

const CustomTooltip = ({ active, payload, label, countLabel }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e2dfd8] px-3 py-2 text-sm font-['DM_Mono']">
      <div className="text-[#1a1916] font-medium">{label}</div>
      <div className="text-[#a09e99]">{payload[0].value}{payload[0].unit} · {payload[0].payload.count} {countLabel}</div>
    </div>
  )
}

export default function HorizBarChart({ data, valueKey = 'pct', showPct = true, labelFormatter, countLabel = 'Shots' }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(600)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth)
    return () => observer.disconnect()
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#a09e99] font-['DM_Mono'] text-sm">
        No data
      </div>
    )
  }

  const isNarrow = containerWidth < 480

  const formatted = data.map((d) => ({
    ...d,
    displayValue: showPct ? parseFloat(d[valueKey].toFixed(1)) : d[valueKey],
    label: labelFormatter ? labelFormatter(d.name) : d.name,
    barLabel: showPct
      ? `${parseFloat(d[valueKey].toFixed(1))}% · ${d.count}`
      : `${d[valueKey]}`,
    barLabelFull: showPct
      ? `${parseFloat(d[valueKey].toFixed(1))}%  ·  ${d.count} ${countLabel}`
      : `${d[valueKey]} ${countLabel}`,
  }))

  const longestLabel = Math.max(...formatted.map((d) => (d.label || '').length))
  const yAxisWidth = isNarrow
    ? Math.min(Math.max(60, longestLabel * 6), 120)
    : Math.min(Math.max(80, longestLabel * 7.5), 200)

  const rightMargin = isNarrow ? 72 : 180

  const barHeight = 28
  const gap = 10
  const height = Math.max(120, formatted.length * (barHeight + gap) + 40)

  // On mobile, scale the axis to the largest bar so small-% bars aren't invisible slivers
  const maxBarValue = showPct ? Math.max(...formatted.map((d) => d.displayValue), 1) : null
  const xDomain = isNarrow && showPct && maxBarValue !== null
    ? [0, Math.min(100, Math.ceil(maxBarValue * 1.2))]
    : [0, showPct ? 100 : 'auto']

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 4, right: rightMargin, bottom: 4, left: 4 }}
          barSize={barHeight}
        >
          <XAxis
            type="number"
            domain={xDomain}
            tickFormatter={showPct ? (v) => `${v}%` : undefined}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#a09e99' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fontFamily: 'DM Mono', fontSize: isNarrow ? 10 : 12, fill: '#1a1916' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip countLabel={countLabel} />} cursor={{ fill: '#f5f3ee' }} />
          <Bar dataKey="displayValue" radius={[0, 2, 2, 0]} unit={showPct ? '%' : ''}>
            {formatted.map((_, i) => (
              <Cell key={i} fill="#1a1916" />
            ))}
            <LabelList
              dataKey={isNarrow ? 'barLabel' : 'barLabelFull'}
              position="right"
              style={{ fontFamily: 'DM Mono', fontSize: isNarrow ? 10 : 11, fill: '#6b6762' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
