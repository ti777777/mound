import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { authFetch, clearAuth } from './api'

// ── Types ──────────────────────────────────────────────
interface Category {
  id: number
  name: string
  color: string
  active: boolean
  createdAt: number
}

interface Expense {
  id: number
  categoryId: number | null
  categoryName: string
  categoryColor: string
  amount: number
  description: string
  note: string
  date: number
}

const MONTHS = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
const PRESET_COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16']

// ── Helpers ────────────────────────────────────────────
function toDateStr(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatAmount(amount: number): string {
  return `NT$\u00a0${amount.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ── API converters ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiCategoryToCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    color: c.color || '#0ea5e9',
    active: c.active,
    createdAt: new Date(c.created_at).getTime(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiExpenseToExpense(e: any, catsById: Map<number, Category>): Expense {
  const cat = catsById.get(e.category_id) ?? e.category
  return {
    id: e.id,
    categoryId: e.category_id ?? null,
    categoryName: cat?.name ?? '未分類',
    categoryColor: cat?.color ?? '#94a3b8',
    amount: e.amount,
    description: e.description ?? '',
    note: e.note ?? '',
    date: new Date(e.date).getTime(),
  }
}

// ── Toggle ─────────────────────────────────────────────
function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`relative w-12 h-6 rounded-full transition-colors ${active ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`}/>
    </button>
  )
}

// ── ExpenseModal ───────────────────────────────────────
interface ExpenseForm {
  amount: string
  description: string
  categoryId: number | null
  date: string
  note: string
}

const emptyExpenseForm = (): ExpenseForm => ({
  amount: '',
  description: '',
  categoryId: null,
  date: new Date().toISOString().slice(0, 10),
  note: '',
})

function ExpenseModal({ open, title, form, categories, keywords, onFormChange, onSubmit, onClose, submitting, apiError }: {
  open: boolean; title: string; form: ExpenseForm
  categories: Category[]
  keywords?: string[]
  onFormChange: (f: ExpenseForm) => void; onSubmit: () => void; onClose: () => void
  submitting?: boolean; apiError?: string | null
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = '請輸入有效的金額'
    if (!form.description.trim()) e.description = '請輸入描述'
    if (!form.date) e.date = '請選擇日期'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => { if (validate()) onSubmit() }
  useEffect(() => { setErrors({}) }, [form])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f8fafc] text-[#94a3b8] hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">{apiError}</div>
          )}
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">金額 <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8] font-semibold select-none">NT$</span>
              <input type="number" min="0" step="1" value={form.amount}
                onChange={e => onFormChange({...form, amount: e.target.value})}
                placeholder="0"
                className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 pl-12 pr-4 text-sm focus:bg-white transition-colors outline-none ${errors.amount ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            </div>
            {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount}</p>}
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">描述 <span className="text-red-400">*</span></label>
            <input type="text" value={form.description}
              onChange={e => onFormChange({...form, description: e.target.value})}
              placeholder="例：午餐、計程車、購物…"
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.description ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            {keywords && keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map(kw => (
                  <button key={kw} type="button" onClick={() => onFormChange({...form, description: kw})}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${form.description === kw ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : 'bg-[#f0f9ff] text-[#0ea5e9] border-[#bae6fd] hover:bg-[#e0f2fe]'}`}>
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">類別</label>
            <select value={form.categoryId ?? ''}
              onChange={e => onFormChange({...form, categoryId: e.target.value ? Number(e.target.value) : null})}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none">
              <option value="">未分類</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">日期 <span className="text-red-400">*</span></label>
            <input type="date" value={form.date}
              onChange={e => onFormChange({...form, date: e.target.value})}
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.date ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
          </div>
          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">備註</label>
            <textarea value={form.note} onChange={e => onFormChange({...form, note: e.target.value})}
              placeholder="選填"
              rows={2}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            取消
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] transition-colors disabled:opacity-60">
            {submitting ? '處理中…' : title === '新增花費' ? '新增' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CategoryModal ──────────────────────────────────────
interface CategoryForm { name: string; color: string; active: boolean }
const emptyCategoryForm = (): CategoryForm => ({ name: '', color: '#0ea5e9', active: true })

function CategoryModal({ open, title, form, onFormChange, onSubmit, onClose, submitting, apiError }: {
  open: boolean; title: string; form: CategoryForm
  onFormChange: (f: CategoryForm) => void; onSubmit: () => void; onClose: () => void
  submitting?: boolean; apiError?: string | null
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '請輸入類別名稱'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => { if (validate()) onSubmit() }
  useEffect(() => { setErrors({}) }, [form])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f8fafc] text-[#94a3b8] hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-600">{apiError}</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">名稱 <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => onFormChange({...form, name: e.target.value})}
              placeholder="例：餐飲、交通、娛樂…"
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">顏色</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => onFormChange({...form, color: c})}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'}`}
                  style={{ background: c }}/>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-semibold text-slate-700">啟用類別</p>
              <p className="text-xs text-[#94a3b8]">停用後不顯示在篩選中</p>
            </div>
            <Toggle active={form.active} onChange={active => onFormChange({...form, active})}/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            取消
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] transition-colors disabled:opacity-60">
            {submitting ? '處理中…' : title === '新增類別' ? '新增' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DeleteModal ────────────────────────────────────────
function DeleteModal({ message, onConfirm, onClose, submitting }: {
  message: string | null; onConfirm: () => void; onClose: () => void; submitting?: boolean
}) {
  if (!message) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </div>
        <h3 className="font-bold text-slate-800 mb-1">確定要刪除？</h3>
        <p className="text-sm text-[#94a3b8] mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            取消
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60">
            {submitting ? '刪除中…' : '刪除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar ───────────────────────────────────────────
function Calendar({ expenses, filterDate, onFilterDate }: {
  expenses: Expense[]
  filterDate: string | null
  onFilterDate: (d: string | null) => void
}) {
  const [{ year, month }, setCal] = useState(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prev = () => setCal(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  const next = () => setCal(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })
  const goToday = () => { setCal({ year: today.getFullYear(), month: today.getMonth() }); onFilterDate(null) }

  const daysWithExpenses = new Set(
    expenses
      .filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === month })
      .map(e => new Date(e.date).getDate())
  )

  const selectedTotal = filterDate
    ? expenses.filter(e => toDateStr(e.date) === filterDate).reduce((s, e) => s + e.amount, 0)
    : null

  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const handleDayClick = (d: number) => {
    const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    onFilterDate(filterDate === str ? null : str)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors text-[#94a3b8] hover:text-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h2 className="text-sm font-bold text-slate-800 w-28 text-center">{year} 年 {MONTHS[month]}</h2>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors text-[#94a3b8] hover:text-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
        <button onClick={goToday} className="text-xs font-semibold text-[#0ea5e9] border border-[#0ea5e9]/30 px-2.5 py-1 rounded-lg hover:bg-[#e0f2fe] transition-colors">今天</button>
      </div>
      <div className="grid grid-cols-7 border-b border-[#e2e8f0]">
        {['日','一','二','三','四','五','六'].map((d, i) => (
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
          const isSelected = d !== null && filterDate === dateStr
          return (
            <div key={i} className={`cal-day border-[#e2e8f0] p-0.5 ${col !== 6 ? 'border-r' : ''} ${!isLastRow ? 'border-b' : ''}`}>
              {d !== null && (
                <button onClick={() => handleDayClick(d)}
                  className={`w-full flex flex-col items-center py-0.5 rounded-lg transition-colors ${
                    isSelected ? 'bg-[#0ea5e9]' : hasExpenses ? 'hover:bg-[#e0f2fe] cursor-pointer' : 'hover:bg-[#f8fafc] cursor-pointer'
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
        {filterDate ? (
          <>
            <span className="text-xs text-slate-600 font-semibold">
              {filterDate.replace(/^(\d+)-(\d+)-(\d+)$/, '$1/$2/$3')}
              {selectedTotal !== null && <> · NT${selectedTotal.toLocaleString()}</>}
            </span>
            <button onClick={() => onFilterDate(null)} className="text-xs text-[#94a3b8] hover:text-[#0ea5e9] transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              清除
            </button>
          </>
        ) : (
          <span className="text-xs text-[#94a3b8]">點擊日期可篩選花費</span>
        )}
      </div>
    </div>
  )
}

// ── ExpenseCard ────────────────────────────────────────
function ExpenseCard({ expense, onEdit, onDelete }: {
  expense: Expense
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}) {
  return (
    <div className="expense-card card-enter bg-white rounded-2xl border border-[#e2e8f0] p-5 hover:border-[#bae6fd] group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xl font-black text-[#0f172a]">{formatAmount(expense.amount)}</span>
            {expense.categoryId && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: expense.categoryColor + '22', color: expense.categoryColor }}>
                {expense.categoryName}
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-700 leading-snug">{expense.description}</p>
          {expense.note && <p className="text-sm text-[#94a3b8] mt-1 leading-relaxed">{expense.note}</p>}
          <p className="text-xs text-[#94a3b8] mt-2">{formatDate(expense.date)}</p>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(expense)} title="編輯"
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(expense)} title="刪除"
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

// ── CategoryCharts ────────────────────────────────────
interface ChartDatum { name: string; color: string; total: number }

function DonutChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0) return <p className="text-xs text-[#94a3b8] text-center py-3">尚無資料</p>

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
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">總計</text>
      <text x={cx} y={cy + 7} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">
        {fmt(total)}
      </text>
    </svg>
  )
}

function BarChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.name}>
          <div className="flex items-center justify-between mb-1 gap-1">
            <span className="text-xs text-slate-600 truncate flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-slate-700 shrink-0">
              NT${d.total.toLocaleString()}
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

// ── Main App ───────────────────────────────────────────
export default function App() {
  const navigate = useNavigate()
  const auth = JSON.parse(localStorage.getItem('mound_auth') ?? '{}') as { email?: string; name?: string; token?: string }

  async function handleLogout() {
    try { await authFetch('/api/auth/logout', { method: 'POST' }) } catch { /* noop */ }
    clearAuth()
    navigate('/login')
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'date' | 'amount'>('date')

  // Expense modals
  const [addExpOpen, setAddExpOpen] = useState(false)
  const [addExpForm, setAddExpForm] = useState<ExpenseForm>(emptyExpenseForm())
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [editExpForm, setEditExpForm] = useState<ExpenseForm>(emptyExpenseForm())
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)

  // Category modals
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [addCatForm, setAddCatForm] = useState<CategoryForm>(emptyCategoryForm())
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editCatForm, setEditCatForm] = useState<CategoryForm>(emptyCategoryForm())
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  // Keywords
  const [keywords, setKeywords] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mound_keywords') ?? '[]') } catch { return [] }
  })
  const [newKeyword, setNewKeyword] = useState('')

  const saveKeywords = (kws: string[]) => {
    setKeywords(kws)
    localStorage.setItem('mound_keywords', JSON.stringify(kws))
  }
  const handleAddKeyword = () => {
    const kw = newKeyword.trim()
    if (!kw || keywords.includes(kw)) { setNewKeyword(''); return }
    saveKeywords([...keywords, kw])
    setNewKeyword('')
  }
  const handleDeleteKeyword = (kw: string) => saveKeywords(keywords.filter(k => k !== kw))

  useEffect(() => {
    async function loadData() {
      setLoading(true); setApiError(null)
      try {
        const [catsRes, expsRes] = await Promise.all([
          authFetch('/api/categories'),
          authFetch('/api/expenses?size=500'),
        ])
        if (catsRes.status === 401 || expsRes.status === 401) { clearAuth(); navigate('/login'); return }
        if (!catsRes.ok || !expsRes.ok) throw new Error('載入失敗，請重新整理')
        const catsData = await catsRes.json()
        const expsData = await expsRes.json()
        const parsedCats: Category[] = (catsData ?? []).map(apiCategoryToCategory)
        const catsById = new Map(parsedCats.map(c => [c.id, c]))
        setCategories(parsedCats)
        setExpenses((expsData ?? []).map((e: unknown) => apiExpenseToExpense(e, catsById)))
      } catch (e) {
        setApiError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stats
  const now = new Date()
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const activeCategories = categories.filter(c => c.active)

  const categoryTotals = useMemo<ChartDatum[]>(() => {
    const map = new Map<string, { color: string; total: number }>()
    expenses.forEach(e => {
      const key = e.categoryName
      const cur = map.get(key)
      if (cur) cur.total += e.amount
      else map.set(key, { color: e.categoryColor, total: e.amount })
    })
    return Array.from(map.entries())
      .map(([name, { color, total }]) => ({ name, color, total }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  // Filtered list
  const visibleExpenses = expenses
    .filter(e => {
      if (filterCategory && e.categoryName !== filterCategory) return false
      if (filterDate && toDateStr(e.date) !== filterDate) return false
      if (search) {
        const q = search.toLowerCase()
        if (!e.description.toLowerCase().includes(q) && !e.categoryName.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => sort === 'amount' ? b.amount - a.amount : b.date - a.date)

  // ── Add Expense ──────────────────────────────────────
  const handleAddExpOpen = () => { setAddExpForm(emptyExpenseForm()); setFormError(null); setAddExpOpen(true) }
  const handleAddExpSubmit = async () => {
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(addExpForm.amount),
          description: addExpForm.description,
          category_id: addExpForm.categoryId || undefined,
          date: addExpForm.date,
          note: addExpForm.note,
        }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? '新增失敗') }
      const catsById = new Map(categories.map(c => [c.id, c]))
      const newExp = apiExpenseToExpense(await res.json(), catsById)
      setExpenses(prev => [newExp, ...prev])
      setAddExpOpen(false)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Edit Expense ─────────────────────────────────────
  const handleEditExpOpen = (exp: Expense) => {
    setEditExpense(exp)
    setEditExpForm({ amount: String(exp.amount), description: exp.description, categoryId: exp.categoryId, date: toDateStr(exp.date), note: exp.note })
    setFormError(null)
  }
  const handleEditExpSubmit = async () => {
    if (!editExpense) return
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch(`/api/expenses/${editExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: parseFloat(editExpForm.amount),
          description: editExpForm.description,
          category_id: editExpForm.categoryId || undefined,
          date: editExpForm.date,
          note: editExpForm.note,
        }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? '儲存失敗') }
      const catsById = new Map(categories.map(c => [c.id, c]))
      const updated = apiExpenseToExpense(await res.json(), catsById)
      setExpenses(prev => prev.map(e => e.id === editExpense.id ? updated : e))
      setEditExpense(null)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Delete Expense ───────────────────────────────────
  const handleDeleteExpConfirm = async () => {
    if (!deleteExpense) return
    setSubmitting(true)
    try {
      await authFetch(`/api/expenses/${deleteExpense.id}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== deleteExpense.id))
    } catch { /* ignore */ }
    finally { setSubmitting(false); setDeleteExpense(null) }
  }

  // ── Add Category ─────────────────────────────────────
  const handleAddCatOpen = () => { setAddCatForm(emptyCategoryForm()); setFormError(null); setAddCatOpen(true) }
  const handleAddCatSubmit = async () => {
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: addCatForm.name, color: addCatForm.color, active: addCatForm.active }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? '新增失敗') }
      const newCat = await res.json()
      setCategories(prev => [...prev, apiCategoryToCategory(newCat)])
      setAddCatOpen(false)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Edit Category ────────────────────────────────────
  const handleEditCatOpen = (cat: Category) => {
    setEditCategory(cat)
    setEditCatForm({ name: cat.name, color: cat.color, active: cat.active })
    setFormError(null)
  }
  const handleEditCatSubmit = async () => {
    if (!editCategory) return
    setSubmitting(true); setFormError(null)
    try {
      const res = await authFetch(`/api/categories/${editCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editCatForm.name, color: editCatForm.color, active: editCatForm.active }),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as {error?: string}).error ?? '儲存失敗') }
      const updated = apiCategoryToCategory(await res.json())
      setCategories(prev => prev.map(c => c.id === editCategory.id ? updated : c))
      setExpenses(prev => prev.map(e => e.categoryId === updated.id
        ? { ...e, categoryName: updated.name, categoryColor: updated.color } : e))
      setEditCategory(null)
    } catch (e) { setFormError((e as Error).message) }
    finally { setSubmitting(false) }
  }

  // ── Delete Category ──────────────────────────────────
  const handleDeleteCatConfirm = async () => {
    if (!deleteCategory) return
    setSubmitting(true)
    try {
      await authFetch(`/api/categories/${deleteCategory.id}`, { method: 'DELETE' })
      setCategories(prev => prev.filter(c => c.id !== deleteCategory.id))
      setExpenses(prev => prev.map(e => e.categoryId === deleteCategory.id
        ? { ...e, categoryId: null, categoryName: '未分類', categoryColor: '#94a3b8' } : e))
    } catch { /* ignore */ }
    finally { setSubmitting(false); setDeleteCategory(null) }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight">Mound</span>
          </a>
          <div className="flex-1"/>
          <button onClick={handleAddExpOpen}
            className="flex items-center gap-2 text-sm font-bold bg-[#0ea5e9] text-white px-4 py-1.5 rounded-xl hover:bg-[#0284c7] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            新增花費
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-[#e2e8f0]">
            <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9] font-bold text-sm">
              {(auth.name ?? auth.email ?? '?')[0].toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm text-[#475569] max-w-[120px] truncate">
              {auth.name ?? auth.email}
            </span>
            <button onClick={handleLogout} title="登出"
              className="ml-1 p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── API error ── */}
      {apiError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-600 text-center">
          {apiError}
          <button className="ml-3 underline" onClick={() => window.location.reload()}>重新載入</button>
        </div>
      )}

      {/* ── 3-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6 xl:gap-8">

          {/* ── Left Sidebar ── */}
          {leftOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setLeftOpen(false)}/>}
          <aside className={leftOpen
            ? 'fixed top-0 left-0 h-full w-64 z-50 bg-[#f8fafc] shadow-2xl flex flex-col gap-4 p-4 pt-4 overflow-y-auto lg:relative lg:top-auto lg:h-auto lg:w-52 xl:w-60 lg:shadow-none lg:z-auto lg:shrink-0 lg:sticky lg:top-20 lg:h-fit'
            : 'hidden lg:flex flex-col gap-4 w-52 xl:w-60 shrink-0 sticky top-20 h-fit'
          }>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 space-y-3">
              <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">本月總覽</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">總支出</span>
                <span className="font-bold text-[#0ea5e9]">NT${thisMonthTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">筆數</span>
                <span className="font-bold text-slate-800">{thisMonthExpenses.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">類別數</span>
                <span className="font-bold text-slate-800">{categories.length}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">類別篩選</p>
                <button onClick={() => setFilterCategory(null)} className="text-xs text-[#94a3b8] hover:text-[#0ea5e9] transition-colors">清除</button>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {activeCategories.length === 0
                  ? <span className="text-xs text-[#94a3b8]">尚無類別</span>
                  : activeCategories.map(c => (
                    <button key={c.id} onClick={() => setFilterCategory(filterCategory === c.name ? null : c.name)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                        filterCategory === c.name ? 'text-white border-transparent' : 'bg-[#f8fafc] text-slate-600 border-[#e2e8f0] hover:border-[#0ea5e9] hover:text-[#0ea5e9]'
                      }`}
                      style={filterCategory === c.name ? { background: c.color, borderColor: c.color } : {}}>
                      {c.name}
                    </button>
                  ))
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2e8f0]">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">分類統計</p>
              </div>
              <div className="p-4 space-y-4">
                <DonutChart data={categoryTotals}/>
                {categoryTotals.length > 0 && (
                  <>
                    <div className="border-t border-[#f1f5f9]"/>
                    <BarChart data={categoryTotals}/>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* ── Middle: Expense list ── */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-slate-800">
                  {filterDate
                    ? filterDate.replace(/^(\d+)-(\d+)-(\d+)$/, '$1/$2/$3') + ' 的花費'
                    : filterCategory ? `${filterCategory} 的花費` : '全部花費'}
                </h3>
                <p className="text-sm text-[#94a3b8] mt-0.5">
                  共 {visibleExpenses.length} 筆
                  {filterDate && <> · <button onClick={() => setFilterDate(null)} className="underline hover:text-[#0ea5e9]">清除日期篩選</button></>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="搜尋描述或類別…"
                    className="bg-white border border-[#e2e8f0] rounded-xl py-2 pl-9 pr-4 text-sm focus:border-[#0ea5e9] transition-colors outline-none w-44"/>
                </div>
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                  className="bg-white border border-[#e2e8f0] rounded-xl py-2 px-3 text-sm focus:border-[#0ea5e9] transition-colors text-slate-600 outline-none">
                  <option value="date">最新優先</option>
                  <option value="amount">金額排序</option>
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
                    {expenses.length === 0 ? '尚未記錄任何花費' : '沒有符合條件的花費'}
                  </p>
                  <p className="text-sm text-[#94a3b8] mb-4">
                    {expenses.length === 0 ? '點擊右上角「新增花費」開始記帳' : '試試清除篩選條件'}
                  </p>
                  {expenses.length === 0 && (
                    <button onClick={handleAddExpOpen}
                      className="inline-flex items-center gap-2 text-sm font-bold bg-[#0ea5e9] text-white px-5 py-2 rounded-xl hover:bg-[#0284c7] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                      新增第一筆花費
                    </button>
                  )}
                </div>
              ) : visibleExpenses.map((exp, i) => (
                <div key={exp.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <ExpenseCard expense={exp} onEdit={handleEditExpOpen} onDelete={setDeleteExpense}/>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Sidebar: Calendar + Categories ── */}
          {rightOpen && <div className="xl:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setRightOpen(false)}/>}
          <aside className={rightOpen
            ? 'fixed top-0 right-0 h-full w-72 z-50 bg-[#f8fafc] shadow-2xl flex flex-col gap-4 p-4 pt-4 overflow-y-auto xl:relative xl:top-auto xl:h-auto xl:w-64 xl:shadow-none xl:z-auto xl:shrink-0 xl:sticky xl:top-20 xl:h-fit'
            : 'hidden xl:flex flex-col gap-4 w-64 shrink-0 sticky top-20 h-fit'
          }>
            <Calendar expenses={expenses} filterDate={filterDate} onFilterDate={setFilterDate}/>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">類別管理</p>
                <button onClick={handleAddCatOpen}
                  className="flex items-center gap-1 text-xs font-semibold text-[#0ea5e9] hover:text-[#0284c7] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  新增
                </button>
              </div>
              <div className="divide-y divide-[#f1f5f9] max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="text-xs text-[#94a3b8] p-4 text-center animate-pulse">載入中…</p>
                ) : categories.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] p-4">尚無類別</p>
                ) : categories.map(cat => (
                  <div key={cat.id} className="group flex items-center gap-2 px-3 py-2.5 hover:bg-[#f8fafc] transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{cat.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditCatOpen(cat)} title="編輯"
                        className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => setDeleteCategory(cat)} title="刪除"
                        className="p-1 rounded-lg text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 常用關鍵字 ── */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e2e8f0]">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">常用關鍵字</p>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text" value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword() } }}
                    placeholder="新增關鍵字…"
                    className="flex-1 min-w-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg py-1.5 px-2.5 text-xs focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"/>
                  <button onClick={handleAddKeyword}
                    className="shrink-0 px-2.5 py-1.5 text-xs font-bold bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] transition-colors">
                    新增
                  </button>
                </div>
                {keywords.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-1">尚無關鍵字</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(kw => (
                      <span key={kw} className="group flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg text-xs text-[#0ea5e9] font-medium">
                        {kw}
                        <button onClick={() => handleDeleteKeyword(kw)} title="刪除"
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#0ea5e9] hover:text-white transition-colors text-[#94a3b8]">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* ── Sidebar toggle buttons (visible only when sidebar is hidden) ── */}
      <button
        onClick={() => setLeftOpen(true)}
        className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-[#e2e8f0] border-l-0 rounded-r-xl px-1.5 py-3 shadow-md text-[#94a3b8] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
        title="顯示左側欄"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
      </button>
      <button
        onClick={() => setRightOpen(true)}
        className="xl:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-[#e2e8f0] border-r-0 rounded-l-xl px-1.5 py-3 shadow-md text-[#94a3b8] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
        title="顯示右側欄"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      {/* ── Modals ── */}
      <ExpenseModal open={addExpOpen} title="新增花費"
        form={addExpForm} categories={categories} keywords={keywords}
        onFormChange={setAddExpForm} onSubmit={handleAddExpSubmit}
        onClose={() => setAddExpOpen(false)} submitting={submitting} apiError={formError}/>

      <ExpenseModal open={editExpense !== null} title="編輯花費"
        form={editExpForm} categories={categories} keywords={keywords}
        onFormChange={setEditExpForm} onSubmit={handleEditExpSubmit}
        onClose={() => setEditExpense(null)} submitting={submitting} apiError={formError}/>

      <CategoryModal open={addCatOpen} title="新增類別"
        form={addCatForm} onFormChange={setAddCatForm}
        onSubmit={handleAddCatSubmit} onClose={() => setAddCatOpen(false)}
        submitting={submitting} apiError={formError}/>

      <CategoryModal open={editCategory !== null} title="編輯類別"
        form={editCatForm} onFormChange={setEditCatForm}
        onSubmit={handleEditCatSubmit} onClose={() => setEditCategory(null)}
        submitting={submitting} apiError={formError}/>

      <DeleteModal
        message={deleteExpense ? `「${deleteExpense.description}」（${formatAmount(deleteExpense.amount)}）將被永久刪除` : null}
        onConfirm={handleDeleteExpConfirm} onClose={() => setDeleteExpense(null)} submitting={submitting}/>

      <DeleteModal
        message={deleteCategory ? `類別「${deleteCategory.name}」將被刪除，相關花費改為未分類` : null}
        onConfirm={handleDeleteCatConfirm} onClose={() => setDeleteCategory(null)} submitting={submitting}/>
    </div>
  )
}
