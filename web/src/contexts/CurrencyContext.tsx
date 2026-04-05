import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Rates = Record<string, number>

interface CurrencyCtx {
  currency: string
  setCurrency: (c: string) => void
  rates: Rates | null
}

const Ctx = createContext<CurrencyCtx>({ currency: 'TWD', setCurrency: () => {}, rates: null })

let cachedRates: Rates | null = null
let cachedAt = 0
const TTL = 60 * 60 * 1000 // 1 hour

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState('TWD')
  const [rates, setRates] = useState<Rates | null>(cachedRates)

  useEffect(() => {
    if (cachedRates && Date.now() - cachedAt < TTL) return
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success') {
          cachedRates = data.rates as Rates
          cachedAt = Date.now()
          setRates(cachedRates)
        }
      })
      .catch(() => {})
  }, [])

  return <Ctx.Provider value={{ currency, setCurrency, rates }}>{children}</Ctx.Provider>
}

export function useCurrency() {
  return useContext(Ctx)
}
