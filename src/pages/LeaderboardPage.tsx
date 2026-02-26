import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DecorativeCircles } from '@/components/leaderboard/decorative-circles'
import { LeaderboardContent } from '@/components/leaderboard/leaderboard-content'
import { getLeaderboard } from '@/lib/db/leaderboard'
import { getCreatorId } from '@/lib/auth/session'

export default function LeaderboardPage() {
    const [globalAllTime, setGlobalAllTime] = useState<any[]>([])
    const [globalWeekly, setGlobalWeekly] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const currentCreatorId = getCreatorId() || undefined

    useEffect(() => {
        async function fetchLeaderboards() {
            try {
                const results = await Promise.allSettled([
                    getLeaderboard('all_time', 100),
                    getLeaderboard('weekly', 100),
                ])

                if (results[0].status === 'fulfilled') {
                    setGlobalAllTime(results[0].value)
                } else {
                    console.error('Error loading all-time leaderboard:', results[0].reason)
                }

                if (results[1].status === 'fulfilled') {
                    setGlobalWeekly(results[1].value)
                } else {
                    console.error('Error loading weekly leaderboard:', results[1].reason)
                }
            } catch (error) {
                console.error('Error loading leaderboards:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboards()
    }, [])

    if (loading) {
        return (
            <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
                <DecorativeCircles />
                <div className="relative z-10 animate-pulse text-white/50">Loading Leaderboard...</div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">
            <DecorativeCircles />

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            Leaderboard
                            <Trophy className="h-8 w-8 text-yellow-400" />
                        </h1>
                    </div>
                </div>

                {/* Leaderboard Content */}
                <LeaderboardContent
                    allTimeEntries={globalAllTime}
                    weeklyEntries={globalWeekly}
                    currentCreatorId={currentCreatorId}
                />
            </div>
        </div>
    )
}
