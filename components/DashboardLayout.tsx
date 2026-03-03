import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/dashboard/navbar'
import { SlideInMenu } from '@/components/dashboard/slide-in-menu'
import { useAuth } from '@/lib/auth/AuthContext'

export default function DashboardLayout() {
    const { isAuthenticated } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar onMenuOpen={() => setIsMenuOpen(true)} />
            <SlideInMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-8 w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
