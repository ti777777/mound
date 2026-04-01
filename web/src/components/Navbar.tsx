import { useTranslation } from 'react-i18next'

export default function Navbar({ auth, onAddExpense, onLogout }: {
  auth: { name?: string; email?: string }
  onAddExpense: () => void
  onLogout: () => void
}) {
  const { t, i18n } = useTranslation()

  const toggleLang = () => {
    const next = i18n.language === 'zh-TW' ? 'en' : 'zh-TW'
    i18n.changeLanguage(next)
    localStorage.setItem('mound_lang', next)
  }

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
        <button onClick={toggleLang}
          className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569] hover:text-[#0ea5e9] hover:border-[#bae6fd] transition-colors">
          {i18n.language === 'zh-TW' ? 'EN' : '中'}
        </button>
        <button onClick={onAddExpense}
          className="flex items-center gap-2 text-sm font-bold bg-[#0ea5e9] text-white px-4 py-1.5 rounded-xl hover:bg-[#0284c7] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          {t('nav.addExpense')}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-[#e2e8f0]">
          <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9] font-bold text-sm">
            {(auth.name ?? auth.email ?? '?')[0].toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm text-[#475569] max-w-[120px] truncate">
            {auth.name ?? auth.email}
          </span>
          <button onClick={onLogout} title={t('nav.logout')}
            className="ml-1 p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0ea5e9] hover:bg-[#e0f2fe] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
