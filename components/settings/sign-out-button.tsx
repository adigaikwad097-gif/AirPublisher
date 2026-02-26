import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

export function SignOutButton() {
    const navigate = useNavigate()
    const { clearSession } = useAuth()

    const handleSignOut = () => {
        clearSession()
        navigate('/')
    }

    return (
        <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors w-full px-3 py-2 text-sm"
        >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
        </button>
    )
}
