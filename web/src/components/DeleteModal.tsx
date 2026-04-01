import { useTranslation } from 'react-i18next'

export default function DeleteModal({ message, onConfirm, onClose, submitting }: {
  message: string | null; onConfirm: () => void; onClose: () => void; submitting?: boolean
}) {
  const { t } = useTranslation()
  if (!message) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </div>
        <h3 className="font-bold text-slate-800 mb-1">{t('deleteModal.title')}</h3>
        <p className="text-sm text-[#94a3b8] mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors disabled:opacity-50">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60">
            {submitting ? t('common.deleting') : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
