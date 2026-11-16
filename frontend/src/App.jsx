import { Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import AssistantPage from '@/pages/AssistantPage'
import DashboardPage from '@/pages/DashboardPage'
import DocumentsPage from '@/pages/DocumentsPage'
import EligibilityPage from '@/pages/EligibilityPage'
import LandingPage from '@/pages/LandingPage'
import NotFoundPage from '@/pages/NotFoundPage'
import SchemesPage from '@/pages/SchemesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="schemes" element={<SchemesPage />} />
        <Route path="eligibility" element={<EligibilityPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
