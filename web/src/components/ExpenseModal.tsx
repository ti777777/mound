import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExpenseForm, Category } from '../types'
import { CURRENCIES, getCurrencySymbol } from '../utils'

export default function ExpenseModal({ open, title, isEdit, form, categories, keywords, descriptionSuggestions, locationSuggestions, onFormChange, onSubmit, onClose, submitting, apiError }: {
  open: boolean; title: string; isEdit?: boolean; form: ExpenseForm
  categories: Category[]
  keywords?: string[]
  descriptionSuggestions?: string[]
  locationSuggestions?: string[]
  onFormChange: (f: ExpenseForm) => void; onSubmit: () => void; onClose: () => void
  submitting?: boolean; apiError?: string | null
}) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [descOpen, setDescOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    const amt = parseFloat(form.amount)
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = t('expense.errorAmount')
    if (!form.description.trim()) e.description = t('expense.errorDescription')
    if (!form.date) e.date = t('expense.errorDate')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = () => { if (validate()) onSubmit() }
  useEffect(() => { setErrors({}) }, [form])

  // Close dropdowns on outside click
  useEffect(() => {
    if (!descOpen && !locationOpen) return
    const handler = (e: MouseEvent) => {
      if (descRef.current && !descRef.current.contains(e.target as Node)) setDescOpen(false)
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [descOpen, locationOpen])

  const filteredDescriptions = (descriptionSuggestions ?? []).filter(d =>
    d.toLowerCase().includes(form.description.toLowerCase())
  )
  const filteredLocations = (locationSuggestions ?? []).filter(loc =>
    loc.toLowerCase().includes(form.location.toLowerCase())
  )

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
          {/* Amount + Currency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.amountLabel')} <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <select
                value={form.currency}
                onChange={e => onFormChange({...form, currency: e.target.value})}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-3 text-sm font-semibold text-[#475569] focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none shrink-0"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#94a3b8] font-semibold select-none">
                  {getCurrencySymbol(form.currency)}
                </span>
                <input type="number" min="0" step="1" value={form.amount}
                  onChange={e => onFormChange({...form, amount: e.target.value})}
                  placeholder="0"
                  className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 pl-12 pr-4 text-sm focus:bg-white transition-colors outline-none ${errors.amount ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
              </div>
            </div>
            {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount}</p>}
          </div>
          {/* Description */}
          <div ref={descRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.descriptionLabel')} <span className="text-red-400">*</span></label>
            <input type="text" value={form.description}
              onChange={e => { onFormChange({...form, description: e.target.value}); setDescOpen(true) }}
              onFocus={() => setDescOpen(true)}
              placeholder={t('expense.descriptionPlaceholder')}
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.description ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            {descOpen && filteredDescriptions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                {filteredDescriptions.map(d => (
                  <li key={d}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { onFormChange({...form, description: d}); setDescOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0f9ff] transition-colors ${form.description === d ? 'bg-[#f0f9ff] text-[#0ea5e9] font-semibold' : 'text-slate-700'}`}
                    >
                      {d}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.categoryLabel')}</label>
            <select value={form.categoryId ?? ''}
              onChange={e => onFormChange({...form, categoryId: e.target.value ? Number(e.target.value) : null})}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none">
              <option value="">{t('common.uncategorized')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.dateLabel')} <span className="text-red-400">*</span></label>
            <input type="date" value={form.date}
              onChange={e => onFormChange({...form, date: e.target.value})}
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.date ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
          </div>
          {/* Location */}
          <div ref={locationRef} className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.locationLabel')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                </svg>
              </span>
              <input
                type="text"
                value={form.location}
                onChange={e => { onFormChange({...form, location: e.target.value}); setLocationOpen(true) }}
                onFocus={() => setLocationOpen(true)}
                placeholder={t('expense.locationPlaceholder')}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
            </div>
            {locationOpen && filteredLocations.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                {filteredLocations.map(loc => (
                  <li key={loc}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { onFormChange({...form, location: loc}); setLocationOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0f9ff] transition-colors flex items-center gap-2 ${form.location === loc ? 'bg-[#f0f9ff] text-[#0ea5e9] font-semibold' : 'text-slate-700'}`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0 text-[#94a3b8]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                      </svg>
                      {loc}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('expense.noteLabel')}</label>
            <textarea value={form.note} onChange={e => onFormChange({...form, note: e.target.value})}
              placeholder={t('expense.notePlaceholder')}
              rows={2}
              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none resize-none"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] transition-colors disabled:opacity-60">
            {submitting ? t('common.processing') : isEdit ? t('common.saveChanges') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  )
}
