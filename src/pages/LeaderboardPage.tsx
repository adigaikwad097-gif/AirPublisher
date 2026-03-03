import { useEffect, useState, useCallback } from 'react'
import { Trophy } from 'lucide-react'
import { DecorativeCircles } from '@/components/leaderboard/decorative-circles'
import { LeaderboardContent } from '@/components/leaderboard/leaderboard-content'
import {
    getLeaderboard,
    getNiches,
    LeaderboardEntry,
    LeaderboardPeriod,
    LeaderboardSort,
} from '@/lib/db/leaderboard'
import { getCreatorId } from '@/lib/auth/session'
import { getCurrentCreator } from '@/lib/db/creator'

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [niches, setNiches] = useState<{ niche_id: number; name: string }[]>([])
    const [currentCreatorNiche, setCurrentCreatorNiche] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<LeaderboardPeriod>('all_time')
    const [sortBy, setSortBy] = useState<LeaderboardSort>('views')
    const [nicheFilter, setNicheFilter] = useState<string | null>(null)

    const currentCreatorId = getCreatorId() || undefined

    // Fetch niches list + current creator niche once on mount
    useEffect(() => {
        async function fetchStaticData() {
            const [nichesList, creator] = await Promise.all([
                getNiches(),
                currentCreatorId ? getCurrentCreator(currentCreatorId) : Promise.resolve(null),
            ])
            setNiches(nichesList)
            if (creator?.niche) {
                setCurrentCreatorNiche(creator.niche)
            }
        }
        fetchStaticData()
    }, [currentCreatorId])

    // Fetch leaderboard data whenever filters change
    const fetchLeaderboard = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getLeaderboard(period, nicheFilter, sortBy, 100)
            setEntries(data)
        } catch (error) {
            console.error('Error loading leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }, [period, nicheFilter, sortBy])

    useEffect(() => {
        fetchLeaderboard()
    }, [fetchLeaderboard])

    return (
        <div className="relative overflow-hidden">
            <DecorativeCircles />

            <div className="relative z-10 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        Leaderboard
                        <Trophy className="h-9 w-9 text-warning" />
                    </h1>
                    <p className="text-lg text-white/50 mt-3">Compete and climb the ranks</p>
                </div>

                {/* Leaderboard Content */}
                <LeaderboardContent
                    entries={entries}
                    loading={loading}
                    currentCreatorId={currentCreatorId}
                    currentCreatorNiche={currentCreatorNiche}
                    niches={niches}
                    period={period}
                    sortBy={sortBy}
                    nicheFilter={nicheFilter}
                    onPeriodChange={setPeriod}
                    onSortChange={setSortBy}
                    onNicheChange={setNicheFilter}
                />
            </div>
        </div>
    )
}
