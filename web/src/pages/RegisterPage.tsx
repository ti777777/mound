import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirm) { setError(t('register.errorFillAll')); return }
    if (password.length < 6) { setError(t('register.errorPasswordLength')); return }
    if (password !== confirm) { setError(t('register.errorPasswordMismatch')); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t('register.errorFailed'))
        return
      }
      navigate('/')
    } catch {
      setError(t('register.errorNetwork'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[#0ea5e9] flex items-center justify-center shadow-lg shadow-sky-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-[#0f172a] tracking-tight">Mound</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[#0f172a] mb-1">{t('register.title')}</h1>
          <p className="text-sm text-[#94a3b8] mb-6">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5">{t('register.nameLabel')}</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                autoComplete="name"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5">{t('register.emailLabel')}</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5">{t('register.passwordLabel')}</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5">{t('register.confirmLabel')}</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl py-2.5 px-4 text-sm focus:border-[#0ea5e9] focus:bg-white transition-colors outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading ? t('register.submitting') : t('register.submit')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#94a3b8] mt-6">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-[#0ea5e9] font-semibold hover:underline">
            {t('register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
