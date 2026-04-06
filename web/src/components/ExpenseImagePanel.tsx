import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ExpenseImage } from '../types'
import { imageUrl } from '../utils'

interface Props {
  // Existing images (edit mode)
  existingImages: ExpenseImage[]
  onDeleteExisting: (id: number) => Promise<void>
  // Staged files (add mode, also shown alongside existing in edit)
  stagedFiles: File[]
  onStagedFilesChange: (files: File[]) => void
  // Called when a file is selected in edit mode (for immediate upload)
  onUploadImmediate?: (file: File) => Promise<void>
  isEditMode: boolean
  uploading?: boolean
}

export default function ExpenseImagePanel({
  existingImages,
  onDeleteExisting,
  stagedFiles,
  onStagedFilesChange,
  onUploadImmediate,
  isEditMode,
  uploading,
}: Props) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [objectUrls, setObjectUrls] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Create and revoke object URLs for staged files
  useEffect(() => {
    const urls = stagedFiles.map(f => URL.createObjectURL(f))
    setObjectUrls(urls)
    return () => urls.forEach(u => URL.revokeObjectURL(u))
  }, [stagedFiles])

  const allUrls = [
    ...existingImages.map(img => imageUrl(img.filename)),
    ...objectUrls,
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    if (isEditMode && onUploadImmediate) {
      for (const file of files) {
        await onUploadImmediate(file)
      }
    } else {
      onStagedFilesChange([...stagedFiles, ...files])
    }
  }

  const handleDeleteExisting = async (id: number) => {
    setDeletingId(id)
    await onDeleteExisting(id)
    setDeletingId(null)
  }

  const handleRemoveStaged = (index: number) => {
    onStagedFilesChange(stagedFiles.filter((_, i) => i !== index))
  }

  const openLightbox = (index: number) => {
    setLightbox({ urls: allUrls, index })
  }

  const totalCount = existingImages.length + stagedFiles.length

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {t('expense.imagesLabel')}
        {totalCount > 0 && (
          <span className="ml-1.5 text-xs font-normal text-[#94a3b8]">({totalCount})</span>
        )}
      </label>

      <div className="flex flex-wrap gap-2">
        {/* Existing images */}
        {existingImages.map((img, i) => (
          <div key={img.id} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <img
              src={imageUrl(img.filename)}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openLightbox(i)}
            />
            <button
              type="button"
              onClick={() => handleDeleteExisting(img.id)}
              disabled={deletingId === img.id}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
            >
              {deletingId === img.id ? (
                <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              )}
            </button>
          </div>
        ))}

        {/* Staged files */}
        {objectUrls.map((url, i) => (
          <div key={url} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#bae6fd] bg-[#f0f9ff] shrink-0">
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openLightbox(existingImages.length + i)}
            />
            <div className="absolute inset-0 flex items-end justify-center pb-1 pointer-events-none">
              <span className="text-[9px] text-white bg-black/40 px-1 rounded font-medium">
                {t('expense.imagesPending')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveStaged(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}

        {/* Add button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-[#cbd5e1] text-[#94a3b8] hover:border-[#0ea5e9] hover:text-[#0ea5e9] hover:bg-[#f0f9ff] transition-colors flex flex-col items-center justify-center gap-1 shrink-0 disabled:opacity-50"
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M12 16V8m-4 4h8M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M16 8l-4-4-4 4"/>
              </svg>
              <span className="text-[10px] font-medium leading-tight text-center">{t('expense.imagesAdd')}</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {!isEditMode && stagedFiles.length > 0 && (
        <p className="text-xs text-[#94a3b8] mt-1.5">{t('expense.imagesStagedHint')}</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {lightbox.urls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); setLightbox(l => l && { ...l, index: (l.index - 1 + l.urls.length) % l.urls.length }) }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                onClick={e => { e.stopPropagation(); setLightbox(l => l && { ...l, index: (l.index + 1) % l.urls.length }) }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </>
          )}

          <img
            src={lightbox.urls[lightbox.index]}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: '90vh', maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          />

          {lightbox.urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {lightbox.urls.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightbox.index ? 'bg-white' : 'bg-white/40'}`}
                  onClick={e => { e.stopPropagation(); setLightbox(l => l && { ...l, index: i }) }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
