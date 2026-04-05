import { t } from 'i18next'
import type { Category, Expense, ExpenseForm, CategoryForm } from './types'

export const MONTHS = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
export const PRESET_COLORS = [
  '#0ea5e9','#3b82f6','#6366f1','#06b6d4',
  '#10b981','#22c55e','#84cc16','#14b8a6',
  '#f59e0b','#f97316','#ef4444','#e11d48',
  '#8b5cf6','#a855f7','#ec4899','#db2777',
  '#64748b','#475569','#78716c','#0f172a',
]

export function toDateStr(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export const CURRENCIES = [
  { code: 'TWD', symbol: 'NT$' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
  { code: 'GBP', symbol: '£' },
  { code: 'CNY', symbol: 'CN¥' },
  { code: 'KRW', symbol: '₩' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'SGD', symbol: 'S$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'THB', symbol: '฿' },
]

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find(c => c.code === currency)?.symbol ?? 'NT$'
}

export function convertAmount(amount: number, from: string, to: string, rates: Record<string, number> | null): number {
  if (!rates || !from || from === to) return amount
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) return amount
  return (amount / fromRate) * toRate
}

export function formatAmount(amount: number, currency = 'TWD'): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}\u00a0${amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiCategoryToCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    color: c.color || '#0ea5e9',
    active: c.active,
    createdAt: new Date(c.created_at).getTime(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiExpenseToExpense(e: any, catsById: Map<number, Category>): Expense {
  const cat = catsById.get(e.category_id) ?? e.category
  return {
    id: e.id,
    categoryId: e.category_id ?? null,
    categoryName: cat?.name ?? t('common.uncategorized'),
    categoryColor: cat?.color ?? '#94a3b8',
    amount: e.amount,
    currency: e.currency || 'TWD',
    description: e.description ?? '',
    note: e.note ?? '',
    date: new Date(e.date).getTime(),
  }
}

export const emptyExpenseForm = (defaultCurrency = 'TWD'): ExpenseForm => ({
  amount: '',
  description: '',
  categoryId: null,
  currency: defaultCurrency,
  date: new Date().toISOString().slice(0, 10),
  note: '',
})

export const emptyCategoryForm = (): CategoryForm => ({ name: '', color: '#0ea5e9', active: true })
