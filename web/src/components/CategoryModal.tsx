import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { CategoryForm } from '../types'
import { PRESET_COLORS } from '../utils'
import Toggle from './Toggle'

export default function CategoryModal({ open, title, isEdit, form, onFormChange, onSubmit, onClose, submitting, apiError }: {
  open: boolean; title: string; isEdit?: boolean; form: CategoryForm
  onFormChange: (f: CategoryForm) => void; onSubmit: () => void; onClose: () => void
  submitting?: boolean; apiError?: string | null
}) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = t('category.errorName')
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('category.nameLabel')} <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={e => onFormChange({...form, name: e.target.value})}
              placeholder={t('category.namePlaceholder')}
              className={`w-full bg-[#f8fafc] border rounded-xl py-2.5 px-4 text-sm focus:bg-white transition-colors outline-none ${errors.name ? 'border-red-300 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#0ea5e9]'}`}/>
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('category.colorLabel')}</label>
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
              <p className="text-sm font-semibold text-slate-700">{t('category.activeLabel')}</p>
              <p className="text-xs text-[#94a3b8]">{t('category.activeHint')}</p>
            </div>
            <Toggle active={form.active} onChange={active => onFormChange({...form, active})}/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] transition-colors disabled:opacity-60">
            {submitting ? t('common.processing') : isEdit ? t('common.save') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  )
}
