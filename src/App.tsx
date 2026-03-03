import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'

// Layouts and Pages
import DashboardLayout from '@/components/DashboardLayout'
import LoginPage from './pages/LoginPage'

import DashboardPage from './pages/DashboardPage'
import VideosPage from './pages/VideosPage'
import UploadPage from './pages/UploadPage'
import SetupPage from './pages/SetupPage'
import { SchedulePage } from './pages/SchedulePage'
import { VideoDetailsPage } from './pages/VideoDetailsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import SettingsProfilePage from './pages/SettingsProfilePage'
import SettingsConnectionsPage from './pages/SettingsConnectionsPage'

function SSOSpinner() {
    return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
    )
}

export default function App() {
    const { isAuthenticated, isResolving } = useAuth()

    return (
        <Routes>
            <Route path="/" element={
                isResolving ? <SSOSpinner /> :
                isAuthenticated ? <Navigate to="/dashboard" replace /> :
                <LoginPage />
            } />

            <Route path="/setup" element={isAuthenticated ? <SetupPage /> : <Navigate to="/" replace />} />

            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/videos/:id" element={<VideoDetailsPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/settings/profile" element={<SettingsProfilePage />} />
                <Route path="/settings/connections" element={<SettingsConnectionsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
