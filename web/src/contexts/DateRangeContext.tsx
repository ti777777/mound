import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface DateRange {
  start: string | null
  end: string | null
}

interface DateRangeCtx {
  dateRange: DateRange
  setDateRange: (r: DateRange) => void
  clearDateRange: () => void
}

const Ctx = createContext<DateRangeCtx | null>(null)


export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  return (
    <Ctx.Provider value={{ dateRange, setDateRange, clearDateRange: () => setDateRange({ start: null, end: null }) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useDateRange() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider')
  return ctx
}
