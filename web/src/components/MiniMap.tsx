import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Expense } from '../types'

export default function MiniMap({ expenses }: { expenses: Expense[] }) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // Initialize map once (lazy: wait until container has size)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const init = () => {
      if (mapRef.current || !container) return

      const map = L.map(container, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([25.0330, 121.5654], 10)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)

      const layer = L.layerGroup().addTo(map)
      layerRef.current = layer
      mapRef.current = map
      setMapReady(true)
    }

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        if (!mapRef.current) init()
        else mapRef.current.invalidateSize()
      }
    })

    observer.observe(container)
    if (container.offsetWidth > 0 && container.offsetHeight > 0) init()

    return () => {
      observer.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Update markers whenever expenses or mapReady changes
  useEffect(() => {
    const layer = layerRef.current
    const map = mapRef.current
    if (!layer || !map) return

    layer.clearLayers()

    const geoExps = expenses.filter(e => e.latitude != null && e.longitude != null)
    geoExps.forEach(e => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:8px;height:8px;border-radius:50%;background:${e.categoryColor};border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      })
      L.marker([e.latitude!, e.longitude!], { icon }).addTo(layer)
    })

    if (geoExps.length > 0) {
      const bounds = L.latLngBounds(geoExps.map(e => [e.latitude!, e.longitude!] as [number, number]))
      map.fitBounds(bounds, { padding: [12, 12], maxZoom: 12 })
    }
  }, [expenses, mapReady])

  const geoCount = expenses.filter(e => e.latitude != null && e.longitude != null).length

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317.159-.69.159-1.006 0l4.994 2.497z"/>
        </svg>
        <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest">{t('map.title')}</p>
      </div>

      {/* Map preview */}
      <div className="relative" style={{ height: '140px' }}>
        <div ref={containerRef} className="absolute inset-0" />

        {/* Overlay link to full map */}
        <Link
          to="/map"
          className="absolute inset-0 flex items-end justify-end p-2 group"
          style={{ zIndex: 1000 }}
        >
          <span className="flex items-center gap-1.5 bg-white/95 text-[#0ea5e9] text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-sm border border-[#e2e8f0] group-hover:border-[#bae6fd] group-hover:bg-white transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
            </svg>
            {t('map.viewFull')}
          </span>
        </Link>

        {/* No data state */}
        {geoCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 999 }}>
            <p className="text-xs text-[#94a3b8] bg-white/80 px-3 py-1.5 rounded-lg">{t('map.noGeoExpenses')}</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-[#f1f5f9]">
        <p className="text-xs text-[#94a3b8]">
          {t('map.geoCount', { count: geoCount, total: expenses.length })}
        </p>
      </div>
    </div>
  )
}
