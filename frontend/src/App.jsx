import { Route, Routes } from 'react-router-dom'

import AppShell from '@/components/layout/AppShell'
import { MODULES } from '@/data/modules'
import DashboardPage from '@/pages/DashboardPage'
import LandingPage from '@/pages/LandingPage'
import ModulePreviewPage from '@/pages/ModulePreviewPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        {MODULES.map((module) => (
          <Route
            key={module.id}
            path={module.path}
            element={<ModulePreviewPage module={module} />}
          />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
