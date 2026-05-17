import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label, showPct, countLabel }) => {
  if (!active || !payload?.length) return null
  const count = payload[0].payload?.count
  return (
    <div className="bg-white border border-[#e2dfd8] px-3 py-2 text-sm font-['DM_Mono']">
      <div className="text-[#1a1916] font-medium">{label}</div>
      <div className="text-[#a09e99]">
        {showPct
          ? `${payload[0].value}%${count != null ? `, ${count} ${countLabel}` : ''}`
          : `${payload[0].value} ${countLabel}`}
      </div>
    </div>
  )
}

export default function HorizBarChart({ data, valueKey = 'pct', showPct = true, labelFormatter, countLabel = 'shots' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#a09e99] font-['DM_Mono'] text-sm">
        No data
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    displayValue: showPct ? parseFloat(d[valueKey].toFixed(1)) : d[valueKey],
    label: labelFormatter ? labelFormatter(d.name) : d.name,
  }))

  // Size label column to fit the longest label
  const longestLabel = Math.max(...formatted.map((d) => (d.label || '').length))
  const yAxisWidth = Math.min(Math.max(80, longestLabel * 7.5), 200)

  const barHeight = 28
  const gap = 10
  const height = Math.max(120, formatted.length * (barHeight + gap) + 40)

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
          barSize={barHeight}
        >
          <XAxis
            type="number"
            domain={[0, showPct ? 100 : 'auto']}
            tickFormatter={showPct ? (v) => `${v}%` : undefined}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#a09e99' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yAxisWidth}
            tick={{ fontFamily: 'DM Mono', fontSize: 12, fill: '#1a1916' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip showPct={showPct} countLabel={countLabel} />}
            cursor={{ fill: '#f5f3ee' }}
          />
          <Bar dataKey="displayValue" radius={[0, 2, 2, 0]}>
            {formatted.map((_, i) => (
              <Cell key={i} fill="#1a1916" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
