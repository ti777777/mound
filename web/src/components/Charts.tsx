import { useTranslation } from 'react-i18next'
import type { ChartDatum } from '../types'
import { useCurrency } from '../contexts/CurrencyContext'
import { getCurrencySymbol } from '../utils'

export function DonutChart({ data }: { data: ChartDatum[] }) {
  const { t } = useTranslation()
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0) return <p className="text-xs text-[#94a3b8] text-center py-3">{t('charts.noData')}</p>

  const cx = 60, cy = 60, R = 50, r = 30
  let angle = -Math.PI / 2

  const slices = data.map(d => {
    const sa = angle
    const sweep = (d.total / total) * 2 * Math.PI
    angle += sweep
    return { ...d, sa, ea: angle, sweep }
  })

  const arc = (sa: number, ea: number) => {
    const cos = Math.cos, sin = Math.sin
    const x1 = cx + R * cos(sa), y1 = cy + R * sin(sa)
    const x2 = cx + R * cos(ea), y2 = cy + R * sin(ea)
    const x3 = cx + r * cos(ea), y3 = cy + r * sin(ea)
    const x4 = cx + r * cos(sa), y4 = cy + r * sin(sa)
    const lg = ea - sa > Math.PI ? 1 : 0
    return `M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${lg} 0 ${x4} ${y4}Z`
  }

  const fmt = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString()

  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[160px] mx-auto block">
      {slices.map(s => (
        <path key={s.name} d={arc(s.sa, s.ea)} fill={s.color}
          stroke="white" strokeWidth={s.sweep < 0.15 ? 0 : 1}/>
      ))}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">{t('charts.total')}</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">
        {fmt(total)}
      </text>
    </svg>
  )
}

export function BarChart({ data }: { data: ChartDatum[] }) {
  const { currency } = useCurrency()
  const symbol = getCurrencySymbol(currency)
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.name}>
          <div className="flex items-center justify-between mb-1 gap-1">
            <span className="text-xs text-slate-600 truncate flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-slate-700 shrink-0">
              {symbol}{d.total.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.total / max) * 100}%`, background: d.color }}/>
          </div>
        </div>
      ))}
    </div>
  )
}
