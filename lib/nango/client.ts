/**
 * Nango Client
 * OAuth broker for YouTube, Instagram, TikTok
 * Documentation: https://docs.nango.dev
 */

import { Nango } from '@nangohq/node'

// Initialize Nango client (server-side)
export function getNangoClient(): Nango {
  const secretKey = process.env.NANGO_SECRET_KEY
  const baseUrl = process.env.NANGO_BASE_URL || 'https://api.nango.dev'

  if (!secretKey) {
    throw new Error('NANGO_SECRET_KEY is not configured')
  }

  return new Nango({ secretKey, baseUrl })
}

// Platform provider mappings
export const NANGO_PROVIDERS = {
  youtube: 'google', // Nango uses 'google' for YouTube
  instagram: 'facebook', // Nango uses 'facebook' for Instagram
  tiktok: 'tiktok',
} as const

export type Platform = keyof typeof NANGO_PROVIDERS

/**
 * Get connection ID for a user and platform
 * Format: {user_id}_{platform}
 */
export function getConnectionId(userId: string, platform: Platform): string {
  return `${userId}_${platform}`
}

/**
 * Get provider name for a platform
 */
export function getProviderName(platform: Platform): string {
  return NANGO_PROVIDERS[platform]
}


