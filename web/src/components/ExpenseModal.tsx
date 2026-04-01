import { useState, useEffect } from 'react'
import type { ExpenseForm, Category } from '../types'

export default function ExpenseModal({ open, title, form, categories, keywords, onFormChange, onSubmit, onClose, submitting, apiError }: {
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
