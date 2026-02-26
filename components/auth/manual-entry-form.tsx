import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'

export function ManualEntryForm() {
    const [identifier, setIdentifier] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const { setCreatorId } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            // Set creator ID in React context (in-memory, always works)
            // Also tries to persist to cookie/localStorage as bonus
            setCreatorId(identifier.trim())

            // SPA navigate — React context updates instantly, no storage dependency
            navigate('/dashboard')
        } catch (err) {
            console.error('Failed to save profile:', err)
            setError('Failed to save identifier. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
                <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter Unique Identifier"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono"
                    disabled={isLoading}
                    required
                />
            </div>

            {error && (
                <div className="text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!identifier.trim() || isLoading}
                className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
                {isLoading ? (
                    'SAVING...'
                ) : (
                    <>
                        DONE
                        <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    )
}
