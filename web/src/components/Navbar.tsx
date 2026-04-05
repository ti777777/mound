import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalHistory } from '../hooks/useModalHistory'
import { CURRENCIES } from '../utils'
import { authFetch } from '../api'

export default function Navbar({ auth, onAddExpense, onLogout, onExportCSV, currency, onCurrencyChange }: {
  auth: { name?: string; email?: string }
  onAddExpense: () => void
  onLogout: () => void
  onExportCSV: () => void
  currency: string
  onCurrencyChange: (c: string) => void
}) {
  const { t, i18n } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  useModalHistory(settingsOpen, () => setSettingsOpen(false))
  const [aboutOpen, setAboutOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleLang = () => {
    const next = i18n.language === 'zh-TW' ? 'en' : 'zh-TW'
    i18n.changeLanguage(next)
    localStorage.setItem('mound_lang', next)
  }

  const handleCurrencyChange = async (code: string) => {
    onCurrencyChange(code)
    await authFetch('/api/auth/settings', { method: 'PUT', body: JSON.stringify({ currency: code }) })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="bg-white border-b border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">
        <a href="#" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#0ea5e9] rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
            </svg>
          </div>
          <span className="font-black text-lg tracking-tight">Mound</span>
        </a>
        <div className="flex-1"/>
        <button onClick={onAddExpense}
          className="flex items-center gap-2 text-sm font-bold bg-[#0ea5e9] text-white px-1.5 sm:px-4 py-1.5 rounded-xl hover:bg-[#0284c7] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          <span className='hidden sm:inline'>{t('nav.addExpense')}</span>
        </button>

        {/* User area with dropdown */}
        <div ref={dropdownRef} className="relative flex items-center gap-2 pl-3 border-l border-[#e2e8f0]">
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-[#f1f5f9] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9] font-bold text-sm">
              {(auth.name ?? auth.email ?? '?')[0].toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm text-[#475569] max-w-[120px] truncate">
              {auth.name ?? auth.email}
            </span>
          </button>
          <button onClick={onLogout} title={t('nav.logout')}
            className="ml-1 p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-lg border border-[#e2e8f0] z-50 py-1">
              <button
                onClick={() => { setSettingsOpen(true); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {t('nav.settings')}
              </button>
              <button
                onClick={() => { setAboutOpen(true); setDropdownOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                </svg>
                {t('nav.about')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e2e8f0]">
              <h2 className="text-base font-bold text-[#0f172a]">{t('nav.settings')}</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{t('settings.language')}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{i18n.language === 'zh-TW' ? '繁體中文' : 'English'}</p>
                </div>
                <button
                  onClick={toggleLang}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
                >
                  {i18n.language === 'zh-TW' ? 'EN' : '中'}
                </button>
              </div>
              <div className="border-t border-[#e2e8f0]"/>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{t('settings.currency')}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{t('settings.currencyDesc')}</p>
                </div>
                <select
                  value={currency}
                  onChange={e => handleCurrencyChange(e.target.value)}
                  className="text-xs font-bold px-2 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569] bg-white hover:border-[#bae6fd] focus:outline-none focus:border-[#0ea5e9] transition-colors"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div className="border-t border-[#e2e8f0]"/>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{t('settings.exportCsv')}</p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">{t('settings.exportCsvDesc')}</p>
                </div>
                <button
                  onClick={() => { onExportCSV(); setSettingsOpen(false) }}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
                  </svg>
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setAboutOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e2e8f0]">
              <h2 className="text-base font-bold text-[#0f172a]">{t('nav.about')}</h2>
              <button
                onClick={() => setAboutOpen(false)}
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-[#0ea5e9] rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-black tracking-tight text-[#0f172a]">Mound</p>
                <p className="text-xs text-[#94a3b8] mt-1">{t('about.description')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
