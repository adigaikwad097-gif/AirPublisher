import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthContext'

// Layouts and Pages
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'

import DashboardPage from './pages/DashboardPage'
import VideosPage from './pages/VideosPage'
import UploadPage from './pages/UploadPage'
import SetupPage from './pages/SetupPage'
import { SchedulePage } from './pages/SchedulePage'
import { DiscoverPage } from './pages/DiscoverPage'
import { VideoDetailsPage } from './pages/VideoDetailsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import SettingsProfilePage from './pages/SettingsProfilePage'
import SettingsConnectionsPage from './pages/SettingsConnectionsPage'

export default function App() {
    const { isAuthenticated } = useAuth()

    return (
        <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

            <Route path="/setup" element={isAuthenticated ? <SetupPage /> : <Navigate to="/" replace />} />

            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/videos/:id" element={<VideoDetailsPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/settings/profile" element={<SettingsProfilePage />} />
                <Route path="/settings/connections" element={<SettingsConnectionsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
