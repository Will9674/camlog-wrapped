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
      <div className="text-[#a09e99]">{label}</div>
      <div className="text-[#1a1916] font-medium">{payload[0].value} {countLabel}</div>
    </div>
  )
}

export default function VertBarChart({ data, countLabel = 'Shots' }) {
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

  const formatDate = (d) => {
    if (!d) return ''
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  // Left margin accounts for Y-axis (~32px). Each bar slot includes gap.
  const usableWidth = Math.max(containerWidth - 48, 100)
  const barSize = Math.min(40, Math.max(6, Math.floor(usableWidth / data.length) - 4))
  const showLabels = barSize >= 14
  const angleLabels = data.length > 10
  const tickInterval = barSize < 10 ? Math.ceil(data.length / 8) - 1 : 0

  return (
    <div ref={containerRef} style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: showLabels ? 20 : 8, right: 16, bottom: angleLabels ? 32 : 16, left: 0 }}
          barSize={barSize}
        >
          <XAxis
            dataKey="name"
            tickFormatter={formatDate}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#a09e99' }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            angle={angleLabels ? -45 : 0}
            textAnchor={angleLabels ? 'end' : 'middle'}
          />
          <YAxis
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#a09e99' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip countLabel={countLabel} />} cursor={{ fill: '#f5f3ee' }} />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#1a1916" />
            ))}
            {showLabels && (
              <LabelList
                dataKey="count"
                position="top"
                style={{ fontFamily: 'DM Mono', fontSize: 10, fill: '#6b6762' }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
