import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

export default function VertBarChart({ data, countLabel = 'shots' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#a09e99] font-['DM_Mono'] text-sm">
        No data
      </div>
    )
  }

  const formatDate = (d) => {
    if (!d) return ''
    const [y, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 16, bottom: 16, left: 0 }}
          barSize={data.length > 20 ? 8 : 20}
        >
          <XAxis
            dataKey="name"
            tickFormatter={formatDate}
            tick={{ fontFamily: 'DM Mono', fontSize: 11, fill: '#a09e99' }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 15 ? Math.floor(data.length / 10) : 0}
            angle={data.length > 10 ? -45 : 0}
            textAnchor={data.length > 10 ? 'end' : 'middle'}
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
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
