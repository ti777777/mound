import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { authFetch } from '../api'
import type { Expense, Category } from '../types'
import { apiExpenseToExpense, apiCategoryToCategory, formatAmount, formatDate } from '../utils'

const LOC_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`

const NAV_BTN = `width:22px;height:22px;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#475569;font-size:18px;line-height:1;padding:0;box-shadow:0 1px 2px rgba(0,0,0,0.06)`

function buildContent(items: Expense[], idx: number): string {
  const e = items[idx]
  const isMulti = items.length > 1
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;max-width:230px;padding:2px 0">
      ${isMulti ? `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <button data-nav="-1" style="${NAV_BTN}">‹</button>
          <span style="font-size:11px;color:#94a3b8;font-weight:500">${idx + 1} / ${items.length}</span>
          <button data-nav="1" style="${NAV_BTN}">›</button>
        </div>
      ` : ''}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${e.categoryColor};flex-shrink:0"></span>
        <span style="font-size:11px;color:#64748b;font-weight:500">${e.categoryName}</span>
      </div>
      <p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 4px 0;line-height:1.3">${e.description}</p>
      <p style="font-size:13px;color:#0ea5e9;font-weight:700;margin:0 0 4px 0">${formatAmount(e.amount, e.currency)}</p>
      <p style="font-size:11px;color:#94a3b8;margin:0 0 ${e.location ? '4px' : '0'} 0">${formatDate(e.date)}</p>
      ${e.location ? `<p style="font-size:11px;color:#64748b;margin:0;display:flex;align-items:flex-start;gap:4px">${LOC_ICON_SVG}<span style="word-break:break-word">${e.location}</span></p>` : ''}
    </div>
  `
}

export default function ExpenseMapPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [catsRes, expsRes] = await Promise.all([
          authFetch('/api/categories'),
          authFetch('/api/expenses?size=500'),
        ])
        if (!catsRes.ok || !expsRes.ok) return
        const catsData = await catsRes.json()
        const expsData = await expsRes.json()
        const parsedCats: Category[] = (catsData ?? []).map(apiCategoryToCategory)
        const catsById = new Map(parsedCats.map(c => [c.id, c]))
        setExpenses((expsData ?? []).map((e: unknown) => apiExpenseToExpense(e, catsById)))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || leafletRef.current || loading) return

    const map = L.map(mapContainerRef.current).setView([25.0330, 121.5654], 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const geoExpenses = expenses.filter(e => e.latitude != null && e.longitude != null)

    // Group by rounded lat/lng
    const groups = new Map<string, { lat: number; lng: number; items: Expense[] }>()
    for (const e of geoExpenses) {
      const key = `${e.latitude!.toFixed(5)},${e.longitude!.toFixed(5)}`
      if (!groups.has(key)) groups.set(key, { lat: e.latitude!, lng: e.longitude!, items: [] })
      groups.get(key)!.items.push(e)
    }

    groups.forEach(({ lat, lng, items }) => {
      const color = items[0].categoryColor
      const isMulti = items.length > 1

      const icon = L.divIcon({
        className: '',
        html: isMulti
          ? `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer"><span style="color:white;font-size:9px;font-weight:800;line-height:1">${items.length}</span></div>`
          : `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35);cursor:pointer"></div>`,
        iconSize: isMulti ? [20, 20] : [14, 14],
        iconAnchor: isMulti ? [10, 10] : [7, 7],
        popupAnchor: [0, isMulti ? -12 : -10],
      })

      const idx = { current: 0 }
      const popup = L.popup({ maxWidth: 260 })
      const marker = L.marker([lat, lng], { icon }).bindPopup(popup)

      const attachListeners = () => {
        const el = popup.getElement()
        if (!el) return
        el.querySelectorAll<HTMLElement>('[data-nav]').forEach(btn => {
          btn.addEventListener('click', ev => {
            ev.stopPropagation()
            const dir = parseInt(btn.dataset.nav ?? '0')
            idx.current = (idx.current + dir + items.length) % items.length
            popup.setContent(buildContent(items, idx.current))
            setTimeout(attachListeners, 0)
          })
        })
      }

      marker.on('popupopen', () => {
        idx.current = 0
        popup.setContent(buildContent(items, 0))
        setTimeout(attachListeners, 0)
      })

      marker.addTo(map)
    })

    if (geoExpenses.length > 0) {
      const bounds = L.latLngBounds(geoExpenses.map(e => [e.latitude!, e.longitude!] as [number, number]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }

    leafletRef.current = map
    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, [expenses, loading])

  const geoCount = expenses.filter(e => e.latitude != null && e.longitude != null).length

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white border-b border-[#e2e8f0] h-14 flex items-center px-4 sm:px-6 gap-3 shrink-0 z-10">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors"
          title={t('map.backToList')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497z"/>
          </svg>
        </div>
        <h1 className="font-bold text-[#0f172a] text-sm">{t('map.title')}</h1>
        <div className="flex-1"/>

      </header>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
            <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {t('common.loading')}
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full" style={{ height: 'calc(100vh - 56px)' }} />

        {!loading && geoCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white rounded-2xl shadow-lg px-6 py-5 text-center max-w-xs mx-4">
              <div className="w-12 h-12 bg-[#f0f9ff] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#0ea5e9]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#0f172a]">{t('map.noGeoExpenses')}</p>
              <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">{t('map.noGeoHint')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
