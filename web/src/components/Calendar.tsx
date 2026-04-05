import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Expense } from '../types'
import { toDateStr, getCurrencySymbol, convertAmount } from '../utils'
import { useFilter } from '../contexts/FilterContext'
import { useCurrency } from '../contexts/CurrencyContext'

export default function Calendar({ expenses }: { expenses: Expense[] }) {
  const { t } = useTranslation()
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const weekdays = t('calendar.weekdays', { returnObjects: true }) as string[]

  const { dateRange, setDateRange, clearDateRange } = useFilter()
  const { currency, rates } = useCurrency()
  const symbol = getCurrencySymbol(currency)
  const [{ year, month }, setCal] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prev = () => setCal(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCal(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })
  const goToday = () => { setCal({ year: today.getFullYear(), month: today.getMonth() }); clearDateRange() }

  const daysWithExpenses = new Set(
    expenses
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month })
      .map(e => new Date(e.date).getDate())
  )

  const rangeTotal = (() => {
    if (!dateRange.start) return null
    const end = dateRange.end ?? dateRange.start
    return expenses
      .filter(e => { const d = toDateStr(e.date); return d >= dateRange.start! && d <= end })
      .reduce((s, e) => s + convertAmount(e.amount, e.currency, currency, rates), 0)
  })()

  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const handleDayClick = (d: number) => {
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const { start, end } = dateRange
    if (start && end) {
      setDateRange({ start: str, end: null })
    } else if (start && !end) {
      if (str === start) {
        clearDateRange()
      } else if (str >= start) {
        setDateRange({ start, end: str })
      } else {
        setDateRange({ start: str, end: start })
      }
    } else {
      setDateRange({ start: str, end: null })
    }
  }

  const fmtD = (s: string) => s.replace(/^(\d+)-(\d+)-(\d+)$/, '$1/$2/$3')

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors text-[#94a3b8] hover:text-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-sm font-bold text-slate-800 w-28 text-center">
            {t('calendar.yearMonth', { year, month: months[month] })}
          </h2>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors text-[#94a3b8] hover:text-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button onClick={goToday} className="text-xs font-semibold text-[#0ea5e9] border border-[#0ea5e9]/30 px-2.5 py-1 rounded-lg hover:bg-[#e0f2fe] transition-colors">
          {t('calendar.today')}
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-[#e2e8f0]">
        {weekdays.map((d, i) => (
          <div key={d} className={`py-1.5 text-center text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[#94a3b8]'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const col = i % 7
          const isToday = d !== null && today.getFullYear() === year && today.getMonth() === month && d === today.getDate()
          const isLastRow = i >= days.length - 7
          const hasExpenses = d !== null && daysWithExpenses.has(d)
          const dateStr = d !== null ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : ''
          const rangeComplete = !!dateRange.start && !!dateRange.end
          const isStart = d !== null && dateStr === dateRange.start
          const isEnd = d !== null && !!dateRange.end && dateStr === dateRange.end
          const isInRange = d !== null && rangeComplete && dateStr > dateRange.start! && dateStr < dateRange.end!
          const isSelected = isStart || isEnd
          return (
            <div key={i} className={`cal-day relative h-9 border-[#e2e8f0] ${col !== 6 ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}`}>
              {d !== null && (
                <button onClick={() => handleDayClick(d)}
                  className={`absolute inset-0 flex flex-col items-center pt-1 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0ea5e9]'
                      : isInRange
                        ? 'bg-[#bae6fd]/40 hover:bg-[#bae6fd]/70'
                        : hasExpenses
                          ? 'hover:bg-[#e0f2fe]'
                          : 'hover:bg-[#f8fafc]'
                  }`}>
                  <span className={`text-xs font-semibold leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-[#0ea5e9]' : col === 0 ? 'text-red-400' : col === 6 ? 'text-[#0ea5e9]' : 'text-slate-600'
                  }`}>{d}</span>
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${
                    hasExpenses ? (isSelected ? 'bg-white/80' : isToday ? 'bg-[#0ea5e9]' : 'bg-[#0ea5e9]/60') : 'invisible'
                  }`}/>
                </button>
              )}
            </div>
          )
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-[#e2e8f0] flex items-center justify-between min-h-[36px]">
        {dateRange.start ? (
          <>
            <span className="text-xs text-slate-600 font-semibold">
              {fmtD(dateRange.start)}
              {dateRange.end && dateRange.end !== dateRange.start && <> – {fmtD(dateRange.end)}</>}
              {rangeTotal !== null && <> · {symbol}{rangeTotal.toLocaleString()}</>}
            </span>
            {dateRange.end ? (
              <button onClick={clearDateRange} className="text-xs text-[#94a3b8] hover:text-[#0ea5e9] transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                {t('calendar.clear')}
              </button>
            ) : (
              <span className="text-xs text-[#94a3b8]">{t('calendar.selectEndDate')}</span>
            )}
          </>
        ) : (
          <span className="text-xs text-[#94a3b8]">{t('calendar.clickToSelect')}</span>
        )}
      </div>
    </div>
  )
}
