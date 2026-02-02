'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

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
  // Use the identifier to generate a consistent "random" index
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVAILABLE_AVATARS.length
  return `/avatars/${AVAILABLE_AVATARS[index]}`
}

type LeaderboardEntry = {
  id?: string
  rank?: number
  total_views?: number
  total_likes?: number
  total_comments?: number
  estimated_revenue?: number
  score?: number
  creator_profiles?: {
    display_name: string | null
    avatar_url: string | null
    niche: string | null
    unique_identifier: string
  }
  creator_unique_identifier: string
}

type FilterType = 'all_time' | 'last_7d'
type SortBy = 'views' | 'revenue_views' | 'airscore'
type NicheFilter = 'all' | string

interface LeaderboardContentProps {
  allTimeEntries: LeaderboardEntry[]
  weeklyEntries: LeaderboardEntry[]
  currentCreatorId?: string
}

// Get status emoji based on metrics
function getStatusEmoji(entry: LeaderboardEntry): string {
  const revenue = entry.estimated_revenue || 0
  const views = entry.total_views || 0
  
  // Based on revenue thresholds
  if (revenue >= 300000) return '💎' // Ninja - $300k MRR
  if (revenue >= 100000) return '💎' // Diamond - $100k MRR
  if (revenue >= 30000) return '👑' // Crown - $30k MRR
  if (revenue >= 10000) return '🚀' // Rocket - $10k MRR
  if (views >= 1000000) return '🐐' // Goat - highest views
  if ((entry.rank || 999) <= 10) return '★' // Star - top 10
  
  return ''
}

// Calculate last 7d growth (simplified - using weekly data)
function getLast7dGrowth(entry: LeaderboardEntry, weeklyEntry?: LeaderboardEntry): number {
  if (!weeklyEntry) return 0
  return weeklyEntry.estimated_revenue || 0
}

export function LeaderboardContent({ allTimeEntries, weeklyEntries, currentCreatorId }: LeaderboardContentProps) {
  const [filter, setFilter] = useState<FilterType>('all_time')
  const [sortBy, setSortBy] = useState<SortBy>('views')
  const [nicheFilter, setNicheFilter] = useState<NicheFilter>('all')

  const displayEntries = filter === 'all_time' ? allTimeEntries : weeklyEntries
  const topPlayer = displayEntries[0]
  const otherPlayers = displayEntries.slice(1)

  // Get unique niches
  const niches = Array.from(new Set(displayEntries.map(e => e.creator_profiles?.niche).filter(Boolean))) as string[]

  // Filter by niche if selected
  const filteredEntries = nicheFilter === 'all' 
    ? displayEntries 
    : displayEntries.filter(e => e.creator_profiles?.niche === nicheFilter)

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'views') return (b.total_views || 0) - (a.total_views || 0)
    if (sortBy === 'revenue_views') {
      const ratioA = a.estimated_revenue && a.estimated_revenue > 0 ? (a.total_views || 0) / a.estimated_revenue : 0
      const ratioB = b.estimated_revenue && b.estimated_revenue > 0 ? (b.total_views || 0) / b.estimated_revenue : 0
      return ratioB - ratioA
    }
    return (b.score || 0) - (a.score || 0)
  })

  // Get rank badge color
  const getRankBadgeColor = (rank: number) => {
    if (rank === 2) return 'bg-purple-400'
    if (rank === 3) return 'bg-yellow-400'
    if (rank === 4) return 'bg-gray-400'
    if (rank === 5) return 'bg-gray-500'
    if (rank === 6) return 'bg-green-400'
    if (rank === 7) return 'bg-pink-400'
    return 'bg-gray-300'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Leaderboard Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setFilter('all_time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all_time'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilter('last_7d')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'last_7d'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Last 7d
            </button>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
            <span className="px-3 text-white/70 text-sm">Sort:</span>
            <button
              onClick={() => setSortBy('views')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'views'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Views
            </button>
            <button
              onClick={() => setSortBy('revenue_views')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'revenue_views'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Revenue/Views
            </button>
            <button
              onClick={() => setSortBy('airscore')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === 'airscore'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Score
            </button>
          </div>

          {/* Niche Filter */}
          {niches.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
              <span className="px-3 text-white/70 text-sm">Niche:</span>
              <button
                onClick={() => setNicheFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  nicheFilter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                All
              </button>
              {niches.slice(0, 3).map(niche => (
                <button
                  key={niche}
                  onClick={() => setNicheFilter(niche)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    nicheFilter === niche
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top Player */}
        {topPlayer && (
          <div className="flex flex-col items-center space-y-4 pb-6">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 overflow-hidden border-4 border-yellow-400 shadow-2xl transform hover:scale-105 transition-transform" style={{
                boxShadow: '0 20px 60px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.2)'
              }}>
                {topPlayer.creator_profiles?.avatar_url ? (
                  <Image
                    src={topPlayer.creator_profiles.avatar_url}
                    alt={topPlayer.creator_profiles.display_name || 'Top Creator'}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={getRandomAvatar(topPlayer.creator_unique_identifier || topPlayer.id)}
                    alt={topPlayer.creator_profiles?.display_name || 'Top Creator'}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-6xl">
                👑
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <span className="text-white font-bold text-xl">1</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              {getStatusEmoji(topPlayer)} {topPlayer.creator_profiles?.display_name || 'Top Creator'}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/30 rounded-full">
                <span className="text-cyan-300 font-semibold text-sm">
                  Score: {topPlayer.score ? topPlayer.score.toFixed(0) : '—'}
                </span>
              </div>
              <div className="px-4 py-2 bg-green-400/20 border border-green-400/30 rounded-full">
                <span className="text-green-300 font-semibold text-sm">
                  {formatNumber(topPlayer.total_views || 0)} views
                </span>
              </div>
              <div className="px-4 py-2 bg-purple-400/20 border border-purple-400/30 rounded-full">
                <span className="text-purple-300 font-semibold text-sm">
                  V/R: {topPlayer.estimated_revenue && topPlayer.estimated_revenue > 0 
                    ? ((topPlayer.total_views || 0) / topPlayer.estimated_revenue).toFixed(1)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        {sortedEntries.length > 0 ? (
          <div className="space-y-3">
            {sortedEntries.slice(1).map((entry, index) => {
              const rank = entry.rank || index + 2
              const isCurrent = entry.creator_unique_identifier === currentCreatorId
              const statusEmoji = getStatusEmoji(entry)
              const weeklyEntry = weeklyEntries.find(e => e.creator_unique_identifier === entry.creator_unique_identifier)
              const last7dGrowth = getLast7dGrowth(entry, weeklyEntry)
              
              return (
                <div
                  key={entry.id || entry.creator_unique_identifier}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    rank === 2
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/5 border border-white/10'
                  } ${isCurrent ? 'ring-2 ring-green-400/50' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 overflow-hidden border-2 border-white/30 shadow-lg">
                      {entry.creator_profiles?.avatar_url ? (
                        <Image
                          src={entry.creator_profiles.avatar_url}
                          alt={entry.creator_profiles.display_name || 'Creator'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={getRandomAvatar(entry.creator_unique_identifier || entry.id)}
                          alt={entry.creator_profiles?.display_name || 'Creator'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Name and Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {statusEmoji && <span className="mr-1">{statusEmoji}</span>}
                        {entry.creator_profiles?.display_name || 'Creator'}
                      </h3>
                    </div>
                    <div className="text-xs text-white/50 mb-2">
                      {entry.creator_profiles?.niche || 'Uncategorized'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3 py-1 bg-cyan-400/20 border border-cyan-400/30 rounded-full">
                        <span className="text-cyan-300 text-xs font-medium">
                          Score: {entry.score ? entry.score.toFixed(0) : '—'}
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-green-400/20 border border-green-400/30 rounded-full">
                        <span className="text-green-300 text-xs font-medium">
                          {formatNumber(entry.total_views || 0)} views
                        </span>
                      </div>
                      <div className="px-3 py-1 bg-purple-400/20 border border-purple-400/30 rounded-full">
                        <span className="text-purple-300 text-xs font-medium">
                          V/R: {entry.estimated_revenue && entry.estimated_revenue > 0
                            ? ((entry.total_views || 0) / entry.estimated_revenue).toFixed(1)
                            : '—'}
                        </span>
                      </div>
                      {filter === 'last_7d' && last7dGrowth > 0 && (
                        <div className="px-3 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full">
                          <span className="text-yellow-300 text-xs font-medium">
                            +${formatNumber(last7dGrowth)} (7d)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-full ${getRankBadgeColor(rank)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <span className="text-white font-bold text-lg">{rank}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/70">
            <p className="text-lg mb-2">No leaderboard data yet</p>
            <p className="text-sm">Start publishing content to appear on the leaderboard!</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Status Legend */}
      <div className="space-y-6">
        {/* Status Definitions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
          <p className="text-sm text-white/70 mb-4">
            Get respect with a status emoji next to your name.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <span>★</span>
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
              <span>💎</span>
              <span>Ninja - $300k+ revenue</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <span>🐐</span>
              <span>Goat - 1M+ views</span>
            </div>
          </div>
        </div>

        {/* Competition Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Competition</h3>
          <div className="space-y-2 text-sm text-white/80">
            <p>• Compete across all niches</p>
            <p>• Rankings update daily</p>
            <p>• Top creators get featured</p>
            <p>• Build your creator reputation</p>
          </div>
        </div>
      </div>
    </div>
  )
}

