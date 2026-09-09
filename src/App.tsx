import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import TenantsList from '@/pages/TenantsList'
import TenantDetail from '@/pages/TenantDetail'
import Plans from '@/pages/Plans'
import Accounts from '@/pages/Accounts'
import ComingSoon from '@/pages/ComingSoon'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/tenants" replace />} />
        <Route path="/tenants" element={<TenantsList />} />
        <Route path="/tenants/:id" element={<TenantDetail />} />
        {/* Layout-only sections mirrored from the Blue Ledger admin dash —
            no page yet, so they render the shared placeholder. */}
        <Route path="/overview" element={<ComingSoon />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/outlets" element={<ComingSoon />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/billing" element={<ComingSoon />} />
        <Route path="/activity" element={<ComingSoon />} />
        <Route path="/support" element={<ComingSoon />} />
        <Route path="/settings" element={<ComingSoon />} />
        <Route path="*" element={<Navigate to="/tenants" replace />} />
      </Route>
    </Routes>
  )
}
