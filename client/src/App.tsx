import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { BiometricProvider } from './context/BiometricContext'
import { SessionProvider } from './context/SessionContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import IntakePage from './pages/IntakePage'
import ValidationReportPage from './pages/ValidationReportPage'
import HistoryPage from './pages/HistoryPage'
import PeriodTrackerPage from './pages/PeriodTrackerPage'
import WellnessJournalPage from './pages/WellnessJournalPage'
import DrHeraChat from './components/chat/DrHeraChat'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <BiometricProvider>
            <SessionProvider>
              <div className="min-h-screen bg-neutral-50">
                <DrHeraChat />
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <IntakePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute>
                        <ValidationReportPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <HistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/period-tracker"
                    element={
                      <ProtectedRoute>
                        <PeriodTrackerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wellness"
                    element={
                      <ProtectedRoute>
                        <WellnessJournalPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* Default: always land on login page first */}
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </div>
            </SessionProvider>
          </BiometricProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
