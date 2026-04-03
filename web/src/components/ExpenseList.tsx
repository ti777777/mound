import { useTranslation } from 'react-i18next'
import type { Expense } from '../types'
import ExpenseCard from './ExpenseCard'
import { useFilter } from '../contexts/FilterContext'

export default function ExpenseList({ loading, expenses, visibleExpenses, sort, onSort, onAddExpense, onEdit, onDelete }: {
  loading: boolean
  expenses: Expense[]
  visibleExpenses: Expense[]
  sort: 'date' | 'amount'
  onSort: (v: 'date' | 'amount') => void
  onAddExpense: () => void
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}) {
  const { t } = useTranslation()
  const { dateRange, clearDateRange, filterCategories, clearFilterCategories, keyword, setKeyword } = useFilter()
  const fmtD = (s: string) => s.replace(/^(\d+)-(\d+)-(\d+)$/, '$1/$2/$3')

  const dateLabel = (() => {
    if (!dateRange.start) return null
    if (dateRange.end && dateRange.end !== dateRange.start) return `${fmtD(dateRange.start)} – ${fmtD(dateRange.end)}`
    return fmtD(dateRange.start)
  })()

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-slate-800">
            {dateLabel
              ? t('expenseList.expensesForDate', { date: dateLabel })
              : filterCategories.length > 0
                ? t('expenseList.expensesForCategory', { category: filterCategories.join(', ') })
                : t('expenseList.allExpenses')}
          </h3>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            {t('expenseList.totalCount', { count: visibleExpenses.length })}
            {dateLabel && <> · <button onClick={clearDateRange} className="underline hover:text-[#0ea5e9]">{t('expenseList.clearDateFilter')}</button></>}
            {filterCategories.length > 0 && <> · <button onClick={clearFilterCategories} className="underline hover:text-[#0ea5e9]">{t('leftSidebar.clear')}</button></>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder={t('expenseList.searchPlaceholder')}
              className="bg-white border border-[#e2e8f0] rounded-xl py-2 pl-9 pr-4 text-sm focus:border-[#0ea5e9] transition-colors outline-none w-44"/>
          </div>
          <select value={sort} onChange={e => onSort(e.target.value as 'date' | 'amount')}
            className="bg-white border border-[#e2e8f0] rounded-xl py-2 px-3 text-sm focus:border-[#0ea5e9] transition-colors text-slate-600 outline-none">
            <option value="date">{t('expenseList.sortNewest')}</option>
            <option value="amount">{t('expenseList.sortAmount')}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center animate-pulse">
            <div className="w-14 h-14 bg-[#e0f2fe] rounded-2xl mx-auto mb-4"/>
            <div className="h-4 bg-[#e0f2fe] rounded w-40 mx-auto mb-2"/>
            <div className="h-3 bg-[#f1f5f9] rounded w-56 mx-auto"/>
          </div>
        ) : visibleExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#e2e8f0] p-12 text-center">
            <div className="w-14 h-14 bg-[#e0f2fe] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#0ea5e9]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
              </svg>
            </div>
            <p className="font-bold text-slate-700 mb-1">
              {expenses.length === 0 ? t('expenseList.noExpenses') : t('expenseList.noMatchingExpenses')}
            </p>
            <p className="text-sm text-[#94a3b8] mb-4">
              {expenses.length === 0 ? t('expenseList.startHint') : t('expenseList.clearFilterHint')}
            </p>
            {expenses.length === 0 && (
              <button onClick={onAddExpense}
                className="inline-flex items-center gap-2 text-sm font-bold bg-[#0ea5e9] text-white px-5 py-2 rounded-xl hover:bg-[#0284c7] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                {t('expenseList.addFirstExpense')}
              </button>
            )}
          </div>
        ) : visibleExpenses.map((exp, i) => (
          <div key={exp.id} style={{ animationDelay: `${i * 40}ms` }}>
            <ExpenseCard expense={exp} onEdit={onEdit} onDelete={onDelete}/>
          </div>
        ))}
      </div>
    </div>
  )
}
