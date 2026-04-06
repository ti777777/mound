import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons in Vite/webpack builds
const DefaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface PickedLocation {
  name: string
  lat: number
  lng: number
}

export default function LocationPicker({ onSelect, onClose, initialLat, initialLng }: {
  onSelect: (loc: PickedLocation) => void
  onClose: () => void
  initialLat?: number | null
  initialLng?: number | null
}) {
  const { t } = useTranslation()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [selectedLoc, setSelectedLoc] = useState<PickedLocation | null>(null)
  const [searching, setSearching] = useState(false)
  const [reverseLoading, setReverseLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current || leafletRef.current) return

    const defaultLat = (initialLat != null && !isNaN(initialLat)) ? initialLat : 25.0330
    const defaultLng = (initialLng != null && !isNaN(initialLng)) ? initialLng : 121.5654
    const zoom = (initialLat != null) ? 15 : 11

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    if (initialLat != null && initialLng != null) {
      markerRef.current = L.marker([initialLat, initialLng], { icon: DefaultIcon }).addTo(map)
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: DefaultIcon }).addTo(map)
      }
      setReverseLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'Accept-Language': navigator.language, 'User-Agent': 'Mound/1.0' } }
        )
        const data = await res.json()
        setSelectedLoc({ name: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
      } catch {
        setSelectedLoc({ name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
      } finally {
        setReverseLoading(false)
      }
    })

    leafletRef.current = map
    return () => {
      map.remove()
      leafletRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close search results on outside click
  useEffect(() => {
    if (!searchResults.length) return
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchResults.length])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        { headers: { 'Accept-Language': navigator.language, 'User-Agent': 'Mound/1.0' } }
      )
      const data: NominatimResult[] = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const loc: PickedLocation = { name: result.display_name, lat, lng }
    setSelectedLoc(loc)
    setSearchResults([])
    setSearchQuery(result.display_name)
    if (leafletRef.current) {
      leafletRef.current.setView([lat, lng], 15)
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { icon: DefaultIcon }).addTo(leafletRef.current)
      }
    }
  }

  const handleConfirm = () => {
    if (selectedLoc) onSelect(selectedLoc)
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">{t('location.pickTitle')}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f8fafc] text-[#94a3b8] hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-[#e2e8f0] shrink-0">
          <div ref={searchRef} className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t('location.searchPlaceholder')}
                className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2 px-3 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-3 py-2 bg-[#0ea5e9] text-white rounded-xl text-sm font-semibold hover:bg-[#0284c7] transition-colors disabled:opacity-50 shrink-0"
              >
                {searching ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="absolute z-[2000] mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden max-h-44 overflow-y-auto">
                {searchResults.map(r => (
                  <li key={r.place_id}>
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelectResult(r)}
                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-[#f0f9ff] transition-colors text-slate-700 border-b border-[#f1f5f9] last:border-0"
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-1.5">{t('location.clickMapHint')}</p>
        </div>

        {/* Map */}
        <div ref={mapContainerRef} style={{ height: '300px', minHeight: '300px' }} className="shrink-0" />

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e2e8f0] flex items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {reverseLoading ? (
              <p className="text-xs text-[#94a3b8]">{t('location.loading')}</p>
            ) : selectedLoc ? (
              <p className="text-xs text-slate-600 truncate" title={selectedLoc.name}>
                <span className="font-semibold text-[#0ea5e9]">{selectedLoc.lat.toFixed(5)}, {selectedLoc.lng.toFixed(5)}</span>
                <span className="text-[#94a3b8] ml-1.5 hidden sm:inline">{selectedLoc.name}</span>
              </p>
            ) : (
              <p className="text-xs text-[#94a3b8]">{t('location.noSelection')}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-semibold text-slate-600 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:bg-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLoc}
              className="px-4 py-1.5 text-sm font-bold bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] transition-colors disabled:opacity-40"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
