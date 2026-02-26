import { Outlet, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/dashboard/navbar'
import { useAuth } from '@/lib/auth/AuthContext'

export default function DashboardLayout() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <main className="pt-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
