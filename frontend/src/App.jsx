import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import EntryDetail from './pages/EntryDetail'
import EntryNew from './pages/EntryNew'
import EntryEdit from './pages/EntryEdit'
import Timeline from './pages/Timeline'
import Profile from './pages/Profile'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
          style: { borderRadius: '10px', fontSize: '14px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <AppLayout><Dashboard /></AppLayout>
        } />
        <Route path="/entries/new" element={
          <AppLayout><EntryNew /></AppLayout>
        } />
        <Route path="/entries/:id" element={
          <AppLayout><EntryDetail /></AppLayout>
        } />
        <Route path="/entries/:id/edit" element={
          <AppLayout><EntryEdit /></AppLayout>
        } />
        <Route path="/timeline" element={
          <AppLayout><Timeline /></AppLayout>
        } />
        <Route path="/profile" element={
          <AppLayout><Profile /></AppLayout>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
