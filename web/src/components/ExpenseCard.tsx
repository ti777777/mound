import { useTranslation } from 'react-i18next'
import type { Expense } from '../types'
import { formatAmount, formatDate } from '../utils'

export default function ExpenseCard({ expense, onEdit, onDelete }: {
  expense: Expense
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="expense-card card-enter bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:border-[#bae6fd] group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xl font-black text-[#0f172a]">{formatAmount(expense.amount, expense.currency)}</span>
            {expense.categoryId && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: expense.categoryColor + '22', color: expense.categoryColor }}>
                {expense.categoryName}
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-700 leading-snug">{expense.description}</p>
          {expense.note && <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">{expense.note}</p>}
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-[#94a3b8]">{formatDate(expense.date)}</p>
            {expense.location && (
              <p className="text-xs text-[#64748b] flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                </svg>
                {expense.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(expense)} title={t('common.edit')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(expense)} title={t('common.delete')}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
