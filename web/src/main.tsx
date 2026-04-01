import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import './index.css'
import App from './App.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import { DateRangeProvider } from './contexts/DateRangeContext.tsx'

function isLoggedIn() {
  return !!localStorage.getItem('mound_auth')
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DateRangeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </DateRangeProvider>
  </StrictMode>,
)
