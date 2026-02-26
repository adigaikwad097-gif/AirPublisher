// Supabase Database Types
// This file should be generated using: supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
// For now, we'll define a minimal type structure

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
      air_publisher_videos: {
        Row: {
          id: string
          creator_unique_identifier: string
          source_type: string
          title: string
          description: string | null
          video_url: string | null
          thumbnail_url: string | null
          platform_target: string
          scheduled_at: string | null
          posted_at: string | null
          status: string
          created_at: string
          updated_at: string
          views?: number
          likes?: number
          comments?: number
        }
        Insert: Omit<Database['public']['Tables']['air_publisher_videos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['air_publisher_videos']['Insert']>
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
          period: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['air_leaderboards']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['air_leaderboards']['Insert']>
      }
      creator_profiles: {
        Row: {
          id: number
          unique_identifier: string
          user_id: string | null
          handles: string | null
          character_skill: string | null
          heygen_avatar_id: string | null
          heygen_video_db_url: string | null
          heygen_thumbnail_db_url: string | null
          'heygen _audio_id': string | null
          Niche: string | null
          audio_url: string | null
          profile_pic_url: string | null
          platform: string | null
          niche_id: number | null
          'primary sub niche id': number | null
          'secondary sub niche id': number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['creator_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['creator_profiles']['Insert']>
      }
      airpublisher_creator_profiles: {
        Row: {
          id: string
          unique_identifier: string
          user_id: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['airpublisher_creator_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['airpublisher_creator_profiles']['Insert']>
      }
      airpublisher_youtube_tokens: {
        Row: {
          id: string
          creator_unique_identifier: string
          google_access_token: string | null
          google_refresh_token: string | null
          expires_at: string | null
          handle: string | null
          channel_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['airpublisher_youtube_tokens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['airpublisher_youtube_tokens']['Insert']>
      }
      airpublisher_instagram_tokens: {
        Row: {
          id: string
          creator_unique_identifier: string
          facebook_access_token: string | null
          instagram_access_token: string | null
          facebook_refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['airpublisher_instagram_tokens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['airpublisher_instagram_tokens']['Insert']>
      }
      airpublisher_tiktok_tokens: {
        Row: {
          id: string
          creator_unique_identifier: string
          tiktok_access_token: string | null
          tiktok_refresh_token: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['airpublisher_tiktok_tokens']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['airpublisher_tiktok_tokens']['Insert']>
      }
      air_publisher_scheduled_posts: {
        Row: {
          id: string
          video_id: string
          creator_unique_identifier: string
          platform: string
          scheduled_at: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['air_publisher_scheduled_posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['air_publisher_scheduled_posts']['Insert']>
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
