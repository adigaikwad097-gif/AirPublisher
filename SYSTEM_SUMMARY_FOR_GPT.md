# AIR Publisher System - Complete Summary

## Overview
AIR Publisher is a Next.js application that automates video publishing to YouTube, Instagram, and TikTok using n8n for workflow automation. The system handles OAuth token management, video uploads to Dropbox, and scheduled posting.

## Architecture

### Tech Stack
- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Dropbox (via n8n)
- **Automation**: n8n (cloud instance)
- **Auth**: Supabase Auth
- **Tunneling**: ngrok (development)

### Core Components
1. **Next.js App**: User interface, video management, OAuth flows
2. **n8n Workflows**: Dropbox upload, scheduled posting, platform API calls
3. **Supabase**: User auth, video metadata, token storage, creator profiles

## Token Management System

### OAuth Flow
1. User clicks "Connect" for a platform (YouTube/Instagram/TikTok)
2. Next.js redirects to platform OAuth
3. Platform redirects back with authorization code
4. Next.js exchanges code for access/refresh tokens
5. Tokens stored in platform-specific tables:
   - `youtube_tokens`
   - `instagram_tokens`
   - `tiktok_tokens`

### Token Storage Schema
Each token table contains:
- `creator_unique_identifier` (links to creator)
- `access_token`
- `refresh_token`
- `expires_at`
- `token_type`
- Platform-specific fields (channel_id, etc.)

### Token Refresh Strategy
- **Current**: Manual refresh via API endpoints
- **Planned**: n8n handles automatic refresh using platform account connections
- **Implementation**: n8n nodes use OAuth2 credentials that auto-refresh

### Token Security
- Tokens stored in Supabase with RLS policies
- Service role key used for server-side operations
- API keys for n8n webhook authentication

## Video Upload Workflow

### Current Flow (After CORS Fix)
```
1. User uploads video file in browser
   ↓
2. Browser → Next.js API (/api/videos/[id]/upload)
   (Same origin, no CORS issues)
   ↓
3. Next.js → n8n webhook (server-to-server)
   Sends: FormData with file + metadata
   ↓
4. n8n workflow:
   - Receives file via Webhook node
   - Responds immediately to Next.js (no timeout)
   - Uploads file to Dropbox
   - Creates shared link
   - Calls back to Next.js with Dropbox URL
   ↓
5. Next.js updates video record with Dropbox URL
```

### n8n Workflow Structure
```
Webhook (receives file)
    ├─→ Respond to Webhook (immediate response)
    └─→ Upload to Dropbox
         ↓
    Create Shared Link (HTTP Request to Dropbox API)
         ↓
    HTTP Request (callback to Next.js with URL)
```

### FormData Payload to n8n
- `file`: Video file (binary)
- `video_id`: UUID from database
- `creator_unique_identifier`: Creator ID
- `file_name`: Generated filename
- `callback_url`: Next.js webhook endpoint

### Callback Payload from n8n
```json
{
  "video_id": "uuid",
  "video_url": "https://www.dropbox.com/...?dl=1",
  "dropbox_path": "/airpublisher/creator_xxx/video.mp4",
  "processing_status": "completed"
}
```

## Video Posting Automation

### Scheduled Posting Flow (Planned)
```
1. User schedules video in Next.js
   - Sets platform (YouTube/Instagram/TikTok)
   - Sets scheduled_at timestamp
   - Status: "scheduled"
   ↓
2. n8n Cron workflow (runs every 15 min)
   - Calls GET /api/n8n/scheduled-posts
   - Gets videos where scheduled_at <= now
   ↓
3. For each video:
   - Calls GET /api/n8n/video-details?video_id=xxx
   - Gets video metadata + platform tokens
   - Posts to platform API using n8n nodes
   - Calls POST /api/webhooks/n8n/post-status
   ↓
4. Next.js updates video:
   - Status: "posted"
   - posted_at: timestamp
   - platform_post_id: platform response ID
```

### Platform Integration
- **YouTube**: n8n YouTube node (uses OAuth2 credentials)
- **Instagram**: n8n Instagram node or HTTP Request to Graph API
- **TikTok**: HTTP Request to TikTok API (OAuth2)

### Token Usage in n8n
- n8n stores platform OAuth2 credentials
- Auto-refreshes tokens via account connections
- No manual token management needed in n8n workflows

## Database Schema

### Key Tables
- `air_publisher_videos`: Video metadata, status, URLs
- `airpublisher_creator_profiles`: Creator info, unique identifiers
- `youtube_tokens`, `instagram_tokens`, `tiktok_tokens`: OAuth tokens
- `air_leaderboards`: Performance metrics

### Video Status Flow
- `draft` → `scheduled` → `posted` / `failed`
- `video_url` set after Dropbox upload
- `platform_target` set when scheduling

## Current Issues & Solutions

### Issue 1: CORS Blocking Direct Browser → n8n
**Problem**: Browser CORS preflight (OPTIONS) fails when uploading directly to n8n
**Solution**: Use Next.js as proxy (browser → Next.js → n8n)
**Status**: ✅ Implemented

### Issue 2: ngrok Timeout for Large Files
**Problem**: ngrok 60s timeout when Next.js uploads large files
**Solution**: Browser uploads directly to n8n (bypassed by CORS issue)
**Current**: Using Next.js proxy (may timeout for very large files)

### Issue 3: n8n Webhook Response Mode
**Problem**: "Respond when last node finishes" causes browser timeout
**Solution**: "Respond to Webhook" node immediately after Webhook node
**Status**: ✅ Fixed in workflow

### Issue 4: Video Not Found in Callback
**Problem**: Database update fails in webhook callback
**Solution**: Better error handling, service role fallback, video existence check
**Status**: ✅ Fixed

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL_DROPBOX_UPLOAD`
- `NEXT_PUBLIC_APP_URL` (ngrok URL in dev)

### Optional
- `N8N_API_KEY` (for webhook authentication)

## API Endpoints

### Video Management
- `POST /api/videos` - Create video record
- `POST /api/videos/[id]/upload` - Upload file (forwards to n8n)
- `GET /api/videos` - List videos

### OAuth
- `GET /api/auth/[platform]/connect` - Initiate OAuth
- `GET /api/auth/[platform]/callback` - Handle OAuth callback
- `POST /api/auth/[platform]/refresh` - Refresh tokens

### n8n Integration
- `GET /api/n8n/scheduled-posts` - Get videos to post
- `GET /api/n8n/video-details` - Get video + tokens
- `POST /api/webhooks/n8n/upload-complete` - n8n callback
- `POST /api/webhooks/n8n/post-status` - Post completion status

## Next Steps / Planned Features

1. **Scheduled Posting**: n8n Cron workflow for automated posting
2. **Metrics Collection**: n8n fetches platform metrics, updates leaderboards
3. **AI Content Integration**: Receive AI-generated content via n8n webhook
4. **Multi-platform Posting**: Post same video to multiple platforms
5. **Token Auto-refresh**: n8n handles all token refresh automatically

## Key Design Decisions

1. **n8n for Automation**: Centralized workflow management, visual builder, easy modifications
2. **Dropbox via n8n**: n8n manages Dropbox connection, folder creation, token refresh
3. **Next.js Proxy**: Avoids CORS issues, provides unified API
4. **Token Storage in Supabase**: Centralized, secure, with RLS policies
5. **Service Role for Server Operations**: Bypasses RLS when needed

## Current State

- ✅ OAuth flows working (YouTube, Instagram, TikTok)
- ✅ Token storage and retrieval
- ✅ Video creation and metadata
- ✅ Dropbox upload via n8n (with Next.js proxy)
- ✅ n8n callback and database updates
- ⚠️ CORS issues resolved via Next.js proxy
- ⚠️ ngrok timeout risk for very large files
- 🔄 Scheduled posting (workflow ready, needs activation)
- 🔄 Metrics collection (planned)

## Questions for GPT Discussion

1. **Token Management**: Best practices for OAuth token refresh in distributed systems?
2. **CORS Alternatives**: Better ways to handle browser → n8n communication?
3. **File Upload Strategy**: Optimal approach for large file uploads with ngrok?
4. **Error Handling**: Robust error handling and retry strategies for platform APIs?
5. **Scalability**: Architecture improvements for handling many creators/videos?
6. **Security**: Token storage and API key management best practices?
7. **n8n Workflow Design**: Best practices for complex multi-step workflows?
8. **Monitoring**: How to monitor and debug n8n workflows in production?

