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
import { useTheme } from '../ThemeContext.jsx'
import { useContainerWidth } from '../hooks/useContainerWidth'

const CustomTooltip = ({ active, payload, label, countLabel }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-(--c-surface2) border border-(--c-border) px-3 py-2 text-sm font-['DM_Mono'] rounded">
      <div className="text-(--c-ink2)">{label}</div>
      <div className="text-(--c-ink) font-medium">{payload[0].value} {countLabel}</div>
    </div>
  )
}

export default function VertBarChart({ data, countLabel = 'Shots' }) {
  const [containerRef, containerWidth] = useContainerWidth()
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const tickColor = isLight ? '#6c6c70' : '#8e8e93'
  const cursorFill = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-(--c-ink2) font-['DM_Mono'] text-sm">
        No data
      </div>
    )
  }

  const formatDate = (d) => {
    if (!d) return ''
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  const MIN_BAR_SLOT = 18
  const idealWidth = data.length * MIN_BAR_SLOT + 48
  const chartWidth = Math.max(containerWidth, idealWidth)
  const barSize = Math.min(40, Math.floor((chartWidth - 48) / data.length) - 4)
  const showLabels = barSize >= 14
  const angleLabels = data.length > 10
  const tickInterval = barSize < 10 ? Math.ceil(data.length / 8) - 1 : 0
  const scrollable = idealWidth > containerWidth

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: scrollable ? 'auto' : 'visible' }}>
      <div style={{ width: chartWidth, height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: showLabels ? 20 : 8, right: 16, bottom: angleLabels ? 32 : 16, left: 0 }}
          barSize={barSize}
        >
          <XAxis
            dataKey="name"
            tickFormatter={formatDate}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            angle={angleLabels ? -45 : 0}
            textAnchor={angleLabels ? 'end' : 'middle'}
          />
          <YAxis
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: tickColor }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip countLabel={countLabel} />} cursor={{ fill: cursorFill }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} style={{ fill: 'var(--c-accent)' }} />
            ))}
            {showLabels && (
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontFamily: 'DM Mono', fontSize: 10, fill: tickColor }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
