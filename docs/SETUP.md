# AIR Publisher Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase project with the existing AIR ecosystem tables
- Supabase project URL and API keys
- **n8n instance** (self-hosted or cloud) for automation workflows

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# n8n Integration (REQUIRED)
N8N_API_KEY=your_n8n_api_key_for_webhook_authentication
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_for_hmac_verification
N8N_BASE_URL=https://your-n8n-instance.com

# Optional: For cron jobs
CRON_SECRET=your_random_secret_for_cron_jobs
```

### 3. Database Setup

Run the migration file to create the new AIR Publisher tables:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/migrations/001_create_air_publisher_tables.sql`

This will create:
- `air_publisher_videos` table
- `air_leaderboards` table
- Required indexes and RLS policies

### 4. Storage Bucket Setup

Create a Supabase Storage bucket for videos:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `air-publisher-videos`
3. Set it to **Public** (or configure RLS policies as needed)
4. Configure CORS if needed for direct uploads

### 5. n8n Setup

**IMPORTANT:** n8n is the primary automation engine for this system.

1. Set up your n8n instance (see [N8N_INTEGRATION.md](./N8N_INTEGRATION.md))
2. Create the required workflows:
   - Scheduled Post Executor
   - Metrics Collector
   - AI Content Receiver
   - Video Processor
3. Configure API credentials in n8n
4. Set up webhook endpoints pointing to your Next.js app

See [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) for detailed n8n setup instructions.

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Architecture Overview

```
┌─────────────┐
│  Next.js    │  ← User Interface
│   (Frontend) │
└──────┬───────┘
       │
       ↓
┌─────────────┐
│  Supabase   │  ← Database & Storage
│  (Postgres) │
└──────┬───────┘
       │
       ↓
┌─────────────┐
│    n8n      │  ← Automation Engine
│  Workflows  │
└──────┬───────┘
       │
       ↓
┌─────────────┐
│  Platform   │  ← YouTube, Instagram, TikTok
│    APIs     │
└─────────────┘
```

## Database Schema

### Existing Tables (DO NOT MODIFY)

These tables are shared with other AIR products:

- `creator_profiles` - Creator information
- `creator_posts` - Cross-platform posts
- `competitor_posts` - Competitor tracking
- `competitors_list` - Competitor lists
- `niches_list` - Available niches
- `sub_niches` - Sub-niches
- `topics` - Content topics
- `youtube_tokens` - YouTube API tokens
- `instagram_tokens` - Instagram API tokens
- `facebook_tokens` - Facebook API tokens
- `tiktok_tokens` - TikTok API tokens

### New Tables (AIR Publisher)

- `air_publisher_videos` - Video content for publishing
- `air_leaderboards` - Leaderboard rankings and scores

## Features

### ✅ Implemented

- Authentication (Sign up / Sign in)
- Creator dashboard with KPIs
- Video upload (UGC)
- Content scheduling
- Leaderboard system (global, weekly, niche-based)
- Creator profile pages
- Dark theme UI with warm accents
- **n8n webhook integration** for automation

### 🔄 Handled by n8n

- Platform API integration (YouTube, Instagram, TikTok)
- Scheduled post execution
- Metrics collection from platforms
- Leaderboard calculation
- AI-generated content ingestion from AIR Ideas
- Video processing and transcoding
- Thumbnail generation

## API Endpoints

### For n8n (Query Endpoints)

- `GET /api/n8n/scheduled-posts` - Get videos due for posting
- `GET /api/n8n/video-details?video_id={id}` - Get video + platform tokens
- `POST /api/n8n/leaderboard-calculate` - Trigger leaderboard recalculation

### Webhooks (n8n sends data here)

- `POST /api/webhooks/n8n/post-video` - Trigger video posting
- `POST /api/webhooks/n8n/post-status` - Report post status
- `POST /api/webhooks/n8n/metrics` - Send performance metrics
- `POST /api/webhooks/n8n/ai-content` - Receive AI-generated content
- `POST /api/webhooks/n8n/upload-complete` - Report video processing completion

### Server Actions

- `createVideoAction` - Create a new video
- `updateVideoAction` - Update video metadata
- `scheduleVideoAction` - Schedule a video for posting
- `postVideoAction` - Mark video for immediate posting (n8n handles actual posting)

## Leaderboard Scoring

The scoring formula is:
```
score = (views * 0.4) + (likes * 0.2) + (comments * 0.2) + (estimated_revenue * 2)
```

This can be modified in `lib/db/leaderboard.ts`.

## n8n Workflow Requirements

See [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) for complete n8n setup guide.

Required workflows:
1. **Scheduled Post Executor** - Posts scheduled videos to platforms
2. **Metrics Collector** - Fetches metrics from platforms
3. **AI Content Receiver** - Receives content from AIR Ideas
4. **Video Processor** - Processes uploaded videos

## Next Steps

1. **n8n Setup**: Configure n8n instance and create workflows
2. **Platform Integration**: Set up OAuth for YouTube, Instagram, TikTok in n8n
3. **Storage Integration**: Configure video upload flow with n8n
4. **Testing**: Test each n8n workflow individually
5. **Monitoring**: Set up monitoring for n8n workflows

## Troubleshooting

### Authentication Issues
- Ensure RLS policies are correctly set up
- Verify `creator_profiles` table has a `user_id` column that matches Supabase Auth users

### Database Errors
- Check that all existing tables are present
- Verify foreign key relationships (using `unique_identifier` as join key)

### Storage Issues
- Ensure the storage bucket exists and is configured correctly
- Check bucket permissions and CORS settings

### n8n Integration Issues
- Verify `N8N_API_KEY` is set correctly
- Check n8n workflows are running and configured
- Review n8n execution logs
- See [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) for detailed troubleshooting

## Support

For issues or questions:
- n8n integration: See [N8N_INTEGRATION.md](./N8N_INTEGRATION.md)
- API reference: See [API_REFERENCE.md](./API_REFERENCE.md)
- General questions: Refer to the main AIR ecosystem documentation
