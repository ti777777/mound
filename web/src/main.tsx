import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import './i18n'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import { FilterProvider } from './contexts/FilterContext.tsx'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'no'>('loading')
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => setStatus(r.ok ? 'ok' : 'no'))
      .catch(() => setStatus('no'))
  }, [])
  if (status === 'loading') return null
  return status === 'ok' ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'no'>('loading')
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => setStatus(r.ok ? 'ok' : 'no'))
      .catch(() => setStatus('no'))
  }, [])
  if (status === 'loading') return null
  return status === 'ok' ? <Navigate to="/" replace /> : <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FilterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </FilterProvider>
  </StrictMode>,
)
