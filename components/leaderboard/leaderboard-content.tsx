import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatNumber, getRankBadgeIcon } from '@/lib/utils'
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardSort } from '@/lib/db/leaderboard'

// List of available avatar images
const AVAILABLE_AVATARS = [
    'blackbaddie.png',
    'blackboycap.png',
    'blondegirl.png',
    'desibaddie.png',
    'droid.png',
    'emogirl.png',
    'farmergirl.png',
    'granddad.png',
    'granny.png',
    'laidbackguy.png',
    'lightskin.png',
    'mewtwo.png',
    'steve.png',
    'whiteboycap.png',
]

// Get a consistent random avatar for a given identifier
function getRandomAvatar(identifier: string): string {
    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % AVAILABLE_AVATARS.length
    return `/avatars/${AVAILABLE_AVATARS[index]}`
}

// Get status emoji based on metrics
function getStatusEmoji(entry: LeaderboardEntry): string {
    const revenue = entry.estimated_revenue || 0
    const views = entry.total_views || 0

    if (revenue >= 300000) return '🥷'
    if (revenue >= 100000) return '💎'
    if (revenue >= 30000) return '👑'
    if (revenue >= 10000) return '🚀'
    if (views >= 1000000) return '🐐'
    if ((entry.rank || 999) <= 10) return '★'

    return ''
}

// Format revenue as dollar amount
function formatRevenue(revenue: number): string {
    if (revenue >= 1000000) {
        return '$' + (revenue / 1000000).toFixed(1) + 'M'
    }
    if (revenue >= 1000) {
        return '$' + (revenue / 1000).toFixed(1) + 'K'
    }
    return '$' + revenue.toFixed(0)
}

interface LeaderboardContentProps {
    entries: LeaderboardEntry[]
    loading: boolean
    currentCreatorId?: string
    currentCreatorNiche: string | null
    niches: { niche_id: number; name: string }[]
    period: LeaderboardPeriod
    sortBy: LeaderboardSort
    nicheFilter: string | null
    onPeriodChange: (period: LeaderboardPeriod) => void
    onSortChange: (sort: LeaderboardSort) => void
    onNicheChange: (niche: string | null) => void
}

export function LeaderboardContent({
    entries,
    loading,
    currentCreatorId,
    currentCreatorNiche,
    niches,
    period,
    sortBy,
    nicheFilter,
    onPeriodChange,
    onSortChange,
    onNicheChange,
}: LeaderboardContentProps) {
    const [nicheDropdownOpen, setNicheDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setNicheDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* === Filter Bar === */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Period Toggle */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                        <button
                            onClick={() => onPeriodChange('all_time')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${period === 'all_time'
                                ? 'bg-white text-black'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => onPeriodChange('last_7d')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${period === 'last_7d'
                                ? 'bg-white text-black'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            Last 7d
                        </button>
                    </div>

                    {/* Sort Toggle */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                        <span className="px-3 text-white/70 text-sm">Sort:</span>
                        {([
                            { key: 'views' as LeaderboardSort, label: 'Views' },
                            { key: 'revenue_views' as LeaderboardSort, label: 'Revenue/Views' },
                            { key: 'score' as LeaderboardSort, label: 'Score' },
                        ]).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onSortChange(key)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sortBy === key
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Niche Filter */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
                        <span className="px-3 text-white/70 text-sm">Niche:</span>
                        {/* "All" button */}
                        <button
                            onClick={() => onNicheChange(null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${nicheFilter === null
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        {/* Creator's own niche */}
                        {currentCreatorNiche && (
                            <button
                                onClick={() => onNicheChange(currentCreatorNiche)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${nicheFilter === currentCreatorNiche
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white'
                                    }`}
                            >
                                {currentCreatorNiche}
                            </button>
                        )}
                        {/* "Other" dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setNicheDropdownOpen(!nicheDropdownOpen)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${nicheFilter !== null && nicheFilter !== currentCreatorNiche
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:text-white'
                                    }`}
                            >
                                {nicheFilter && nicheFilter !== currentCreatorNiche
                                    ? nicheFilter
                                    : 'Other'}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {nicheDropdownOpen && (
                                <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto min-w-[180px]">
                                    {niches.map((n) => (
                                        <button
                                            key={n.niche_id}
                                            onClick={() => {
                                                onNicheChange(n.name)
                                                setNicheDropdownOpen(false)
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${nicheFilter === n.name ? 'text-white bg-white/10' : 'text-white/70'
                                                }`}
                                        >
                                            {n.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === Leaderboard Table === */}
                {loading ? (
                    <div className="text-center py-12 text-white/50 animate-pulse">
                        Loading Leaderboard...
                    </div>
                ) : entries.length > 0 ? (
                    <div className="bg-card border border-border/20 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider w-16">
                                        Rank
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider w-28">
                                        Views
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider w-32">
                                        Est. Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => {
                                    const isCurrent = entry.creator_unique_identifier === currentCreatorId
                                    const statusEmoji = getStatusEmoji(entry)
                                    const avatar = entry.avatar_url || getRandomAvatar(entry.creator_unique_identifier)

                                    return (
                                        <tr
                                            key={entry.creator_unique_identifier}
                                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isCurrent ? 'bg-green-400/10 ring-1 ring-inset ring-green-400/30' : ''
                                                } ${entry.rank <= 3 ? 'bg-white/[0.03]' : ''}`}
                                        >
                                            {/* Rank */}
                                            <td className="px-4 py-3 font-semibold text-white">
                                                {entry.rank <= 3 ? (
                                                    <span className="text-lg">{getRankBadgeIcon(entry.rank)}</span>
                                                ) : (
                                                    <span className="text-white/70">{entry.rank}</span>
                                                )}
                                            </td>
                                            {/* User */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={avatar}
                                                        alt={entry.display_name || 'Creator'}
                                                        className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-white font-medium truncate">
                                                                {entry.display_name || 'Creator'}
                                                            </span>
                                                            {statusEmoji && (
                                                                <span className={`flex-shrink-0 ${statusEmoji === '★' ? 'text-yellow-400' : ''}`}>{statusEmoji}</span>
                                                            )}
                                                        </div>
                                                        {entry.niche && (
                                                            <div className="text-xs text-white/40 truncate">
                                                                {entry.niche}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Views */}
                                            <td className="px-4 py-3 text-right text-white/80 font-medium">
                                                {formatNumber(entry.total_views || 0)}
                                            </td>
                                            {/* Est. Revenue */}
                                            <td className="px-4 py-3 text-right text-success font-medium">
                                                {formatRevenue(entry.estimated_revenue || 0)}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-white/70">
                        <p className="text-lg mb-2">No leaderboard data yet</p>
                        <p className="text-sm">Start publishing content to appear on the leaderboard!</p>
                    </div>
                )}
            </div>

            {/* === Right Sidebar === */}
            <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-card border border-border/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
                    <p className="text-sm text-white/70 mb-4">
                        Get respect with a status emoji next to your name.
                    </p>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-white/80">
                            <span className="text-yellow-400">★</span>
                            <span>Star - top 10 creators</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <span>🚀</span>
                            <span>Rocket - $10k+ revenue</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <span>👑</span>
                            <span>Crown - $30k+ revenue</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <span>💎</span>
                            <span>Diamond - $100k+ revenue</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <span>🥷</span>
                            <span>Ninja - $300k+ revenue</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                            <span>🐐</span>
                            <span>Goat - 1M+ views</span>
                        </div>
                    </div>
                </div>

                {/* Competition Card */}
                <div className="bg-card border border-border/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Competition</h3>
                    <div className="space-y-2 text-sm text-white/80">
                        <p>• Compete across all niches</p>
                        <p>• Rankings update in real-time</p>
                        <p>• Top creators get featured</p>
                        <p>• Build your creator reputation</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
