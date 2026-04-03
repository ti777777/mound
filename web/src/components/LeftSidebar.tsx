import { useTranslation } from 'react-i18next'
import type { Category, ChartDatum } from '../types'
import { DonutChart, BarChart } from './Charts'
import { useFilter } from '../contexts/FilterContext'

export default function LeftSidebar({ open, onClose, rangeTotal, rangeCount, categoriesCount, activeCategories, categoryTotals }: {
  open: boolean
  onClose: () => void
  rangeTotal: number
  rangeCount: number
  categoriesCount: number
  activeCategories: Category[]
  categoryTotals: ChartDatum[]
}) {
  const { t } = useTranslation()
  const { filterCategories, toggleFilterCategory, clearFilterCategories, selectAllFilterCategories } = useFilter()
  const allSelected = activeCategories.length > 0 && activeCategories.every(c => filterCategories.includes(c.name))
  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={onClose}/>}
      <aside className={open
        ? 'fixed top-0 left-0 h-full w-64 z-50 bg-[#f8fafc] shadow-2xl flex flex-col gap-4 p-4 pt-4 overflow-y-auto [&>*]:shrink-0 lg:relative lg:top-auto lg:h-auto lg:w-52 xl:w-60 lg:shadow-none lg:z-auto lg:shrink-0 lg:sticky lg:top-4 lg:h-fit'
        : 'hidden lg:flex flex-col gap-4 w-52 xl:w-60 shrink-0 sticky top-4 h-fit'
      }>
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 space-y-3">
          <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">{t('leftSidebar.overview')}</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">{t('leftSidebar.totalExpenses')}</span>
            <span className="font-bold text-[#0ea5e9]">NT${rangeTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">{t('leftSidebar.count')}</span>
            <span className="font-bold text-slate-800">{rangeCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">{t('leftSidebar.categoryCount')}</span>
            <span className="font-bold text-slate-800">{categoriesCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">{t('leftSidebar.categoryFilter')}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => allSelected ? clearFilterCategories() : selectAllFilterCategories(activeCategories.map(c => c.name))}
                className={`text-xs transition-colors ${allSelected ? 'text-[#0ea5e9]' : 'text-[#94a3b8] hover:text-[#0ea5e9]'}`}
              >{t('leftSidebar.selectAll')}</button>
              <span className="text-[#e2e8f0]">|</span>
              <button onClick={clearFilterCategories} className="text-xs text-[#94a3b8] hover:text-[#0ea5e9] transition-colors">{t('leftSidebar.clear')}</button>
            </div>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {activeCategories.length === 0
              ? <span className="text-xs text-[#94a3b8]">{t('leftSidebar.noCategories')}</span>
              : activeCategories.map(c => (
                <button key={c.id} onClick={() => toggleFilterCategory(c.name)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    filterCategories.includes(c.name) ? 'text-white border-transparent' : 'bg-[#f8fafc] text-slate-600 border-[#e2e8f0] hover:border-[#0ea5e9] hover:text-[#0ea5e9]'
                  }`}
                  style={filterCategories.includes(c.name) ? { background: c.color, borderColor: c.color } : {}}>
                  {c.name}
                </button>
              ))
            }
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2e8f0]">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">{t('leftSidebar.categoryStats')}</p>
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
    </>
  )
}
