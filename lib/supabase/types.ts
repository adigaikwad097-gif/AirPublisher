// Database type definitions
// These types should match your Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Existing shared tables (DO NOT MODIFY)
      creator_profiles: {
        Row: {
          id: string
          unique_identifier: string
          display_name: string | null
          avatar_url: string | null
          niche: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<creator_profiles['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<creator_profiles['Insert']>
      }
      creator_posts: {
        Row: {
          id: string
          creator_unique_identifier: string
          platform: string
          post_id: string | null
          content_url: string | null
          created_at: string
        }
        Insert: Omit<creator_posts['Row'], 'id' | 'created_at'>
        Update: Partial<creator_posts['Insert']>
      }
      // New AIR Publisher tables
      air_publisher_videos: {
        Row: {
          id: string
          creator_unique_identifier: string
          source_type: 'ai_generated' | 'ugc'
          title: string
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          platform_target: 'youtube' | 'instagram' | 'tiktok' | 'internal'
          scheduled_at: string | null
          posted_at: string | null
          status: 'draft' | 'scheduled' | 'posted' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<air_publisher_videos['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<air_publisher_videos['Insert']>
      }
      air_leaderboards: {
        Row: {
          id: string
          creator_unique_identifier: string
          total_views: number
          total_likes: number
          total_comments: number
          estimated_revenue: number
          score: number
          rank: number
          period: 'daily' | 'weekly' | 'all_time'
          created_at: string
          updated_at: string
        }
        Insert: Omit<air_leaderboards['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<air_leaderboards['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

