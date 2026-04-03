import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface DateRange {
  start: string | null
  end: string | null
}

interface FilterCtx {
  dateRange: DateRange
  setDateRange: (r: DateRange) => void
  clearDateRange: () => void
  filterCategories: string[]
  toggleFilterCategory: (cat: string) => void
  clearFilterCategories: () => void
  selectAllFilterCategories: (cats: string[]) => void
  keyword: string
  setKeyword: (kw: string) => void
  clearAllFilters: () => void
}

const Ctx = createContext<FilterCtx | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')

  const clearDateRange = () => setDateRange({ start: null, end: null })
  const toggleFilterCategory = (cat: string) =>
    setFilterCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  const clearFilterCategories = () => setFilterCategories([])
  const selectAllFilterCategories = (cats: string[]) => setFilterCategories(cats)
  const clearAllFilters = () => {
    setDateRange({ start: null, end: null })
    setFilterCategories([])
    setKeyword('')
  }

  return (
    <Ctx.Provider value={{ dateRange, setDateRange, clearDateRange, filterCategories, toggleFilterCategory, clearFilterCategories, selectAllFilterCategories, keyword, setKeyword, clearAllFilters }}>
      {children}
    </Ctx.Provider>
  )
}

export function useFilter() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFilter must be used within FilterProvider')
  return ctx
}
