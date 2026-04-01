import type { Expense, Category } from '../types'
import Calendar from './Calendar'

export default function RightSidebar({ open, onClose, expenses, filterDate, onFilterDate, loading, categories, onAddCategory, onEditCategory, onDeleteCategory, keywords, newKeyword, onNewKeywordChange, onAddKeyword, onDeleteKeyword }: {
  open: boolean
  onClose: () => void
  expenses: Expense[]
  filterDate: string | null
  onFilterDate: (d: string | null) => void
  loading: boolean
  categories: Category[]
  onAddCategory: () => void
  onEditCategory: (c: Category) => void
  onDeleteCategory: (c: Category) => void
  keywords: string[]
  newKeyword: string
  onNewKeywordChange: (v: string) => void
  onAddKeyword: () => void
  onDeleteKeyword: (kw: string) => void
}) {
  return (
    <>
      {open && <div className="xl:hidden fixed inset-0 z-40 bg-black/40" onClick={onClose}/>}
      <aside className={open
        ? 'fixed top-0 right-0 h-full w-72 z-50 bg-[#f8fafc] shadow-2xl flex flex-col gap-4 p-4 pt-4 overflow-y-auto [&>*]:shrink-0 xl:relative xl:top-auto xl:h-auto xl:w-64 xl:shadow-none xl:z-auto xl:shrink-0 xl:sticky xl:top-4 xl:h-fit'
        : 'hidden xl:flex flex-col gap-4 w-64 shrink-0 sticky top-4 h-fit'
      }>
        <Calendar expenses={expenses} filterDate={filterDate} onFilterDate={onFilterDate}/>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">類別管理</p>
            <button onClick={onAddCategory}
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
                  <button onClick={() => onEditCategory(cat)} title="編輯"
                    className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => onDeleteCategory(cat)} title="刪除"
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

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e2e8f0]">
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">常用關鍵字</p>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex gap-1.5">
              <input
                type="text" value={newKeyword}
                onChange={e => onNewKeywordChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddKeyword() } }}
                placeholder="新增關鍵字…"
                className="flex-1 min-w-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg py-1.5 px-2.5 text-xs focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"/>
              <button onClick={onAddKeyword}
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
                    <button onClick={() => onDeleteKeyword(kw)} title="刪除"
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
    </>
  )
}
