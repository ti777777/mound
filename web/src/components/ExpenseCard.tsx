import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Expense } from '../types'
import { formatAmount, formatDate, imageUrl } from '../utils'

export default function ExpenseCard({ expense, onEdit, onDelete }: {
  expense: Expense
  onEdit: (e: Expense) => void
  onDelete: (e: Expense) => void
}) {
  const { t } = useTranslation()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const images = expense.images ?? []
  const previewImages = images.slice(0, 3)
  const extraCount = images.length - 3
  const allUrls = images.map(img => imageUrl(img.filename))

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
                {(expense.latitude != null && expense.longitude != null) ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${expense.latitude}&mlon=${expense.longitude}&zoom=16`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[#0ea5e9] transition-colors"
                    title={`${expense.latitude.toFixed(5)}, ${expense.longitude.toFixed(5)}`}
                  >
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                    {expense.location}
                  </a>
                ) : (
                  <>
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
                    </svg>
                    {expense.location}
                  </>
                )}
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

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {previewImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="w-16 h-16 rounded-xl overflow-hidden border border-[#e2e8f0] hover:border-[#0ea5e9] transition-colors shrink-0"
            >
              <img src={imageUrl(img.filename)} alt="" className="w-full h-full object-cover"/>
            </button>
          ))}
          {extraCount > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(3)}
              className="w-16 h-16 rounded-xl border border-[#e2e8f0] hover:border-[#0ea5e9] transition-colors text-[#64748b] text-sm font-bold bg-[#f8fafc] shrink-0 flex items-center justify-center"
            >
              +{extraCount}
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          {allUrls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => ((i ?? 0) - 1 + allUrls.length) % allUrls.length) }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); setLightboxIndex(i => ((i ?? 0) + 1) % allUrls.length) }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </>
          )}
          <img
            src={allUrls[lightboxIndex]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          {allUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allUrls.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIndex ? 'bg-white' : 'bg-white/40'}`}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
