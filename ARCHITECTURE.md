# AIR Publisher Architecture

## System Overview

AIR Publisher is built with a **webhook-driven architecture** where **n8n** serves as the primary automation engine. The Next.js application handles the UI and data management, while n8n workflows execute all platform integrations and automation tasks.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│                    (Next.js Frontend)                        │
│  - Dashboard, Upload, Schedule, Leaderboard, Creator Pages   │
└───────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Layer                         │
│  - Server Actions (create, update, schedule)                 │
│  - Query Endpoints (for n8n to fetch data)                   │
│  - Webhook Receivers (for n8n to send data back)            │
└───────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  - air_publisher_videos                                      │
│  - air_leaderboards                                          │
│  - creator_profiles (shared)                                 │
│  - platform_tokens (shared)                                  │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ↓                       ↓
┌──────────────────────────┐  ┌──────────────────────────────┐
│      n8n Workflows        │  │    Supabase Storage           │
│  (Automation Engine)      │  │    (Video Files)              │
│                            │  │                               │
│  - Scheduled Post Executor│  │                               │
│  - Metrics Collector       │  │                               │
│  - AI Content Receiver     │  │                               │
│  - Video Processor         │  │                               │
└───────────────┬────────────┘  └──────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────────┐
│                    Platform APIs                              │
│  - YouTube API                                               │
│  - Instagram API                                             │
│  - TikTok API                                                │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Video Upload Flow

```
User uploads video
    ↓
Next.js creates draft entry in DB
    ↓
(Optional) Upload file to Supabase Storage
    ↓
Trigger n8n workflow (via webhook or polling)
    ↓
n8n processes video (transcode, thumbnail)
    ↓
n8n calls /api/webhooks/n8n/upload-complete
    ↓
Next.js updates video record with URLs
```

### 2. Scheduled Post Flow

```
User schedules video
    ↓
Next.js updates video: status='scheduled', scheduled_at=time
    ↓
n8n Cron workflow runs (every 15 min)
    ↓
n8n calls GET /api/n8n/scheduled-posts
    ↓
n8n gets video details: GET /api/n8n/video-details
    ↓
n8n posts to platform API (YouTube/Instagram/TikTok)
    ↓
n8n calls POST /api/webhooks/n8n/post-status
    ↓
Next.js updates video: status='posted', posted_at=now
```

### 3. Metrics Collection Flow

```
n8n Cron workflow runs (hourly/daily)
    ↓
n8n queries Supabase for posted videos
    ↓
n8n fetches metrics from platform APIs
    ↓
n8n calls POST /api/webhooks/n8n/metrics for each video
    ↓
Next.js aggregates metrics into leaderboards
    ↓
n8n calls POST /api/n8n/leaderboard-calculate
    ↓
Next.js recalculates ranks
```

### 4. AI Content Ingestion Flow

```
AIR Ideas generates content
    ↓
AIR Ideas triggers n8n webhook
    ↓
n8n workflow receives content
    ↓
n8n calls POST /api/webhooks/n8n/ai-content
    ↓
Next.js creates draft video entry
    ↓
User can edit, schedule, or post
```

## Key Design Decisions

### 1. n8n as Automation Engine

**Why:** 
- Centralized automation logic
- Visual workflow builder
- Easy to modify without code changes
- Supports complex multi-step processes
- Built-in integrations with platform APIs

**Trade-offs:**
- Requires n8n instance setup
- Additional infrastructure to maintain
- Webhook-based communication adds latency

### 2. Webhook-Driven Communication

**Why:**
- Decouples Next.js from platform APIs
- Allows n8n to handle retries and error handling
- Scales independently
- Easy to add new platforms without code changes

**Implementation:**
- Next.js provides query endpoints for n8n to fetch data
- n8n sends results back via webhook endpoints
- All webhooks are authenticated with API keys

### 3. Database as Single Source of Truth

**Why:**
- Next.js and n8n both read/write to Supabase
- Consistent state across all systems
- Easy to debug and audit
- Supports real-time updates via Supabase subscriptions

### 4. Status-Based State Machine

**Video Status Flow:**
```
draft → scheduled → posted
  ↓         ↓         ↓
failed   failed    (final)
```

**Why:**
- Clear state transitions
- Easy to query and filter
- Supports retry logic in n8n
- Tracks failures for debugging

## Security

### Authentication Layers

1. **User Authentication**: Supabase Auth (JWT tokens)
2. **n8n Webhook Authentication**: API key in header
3. **Database Security**: Row Level Security (RLS) policies
4. **Platform APIs**: OAuth tokens stored in database

### Webhook Security

- API key verification for all n8n endpoints
- Optional HMAC signature verification
- Rate limiting (to be implemented)
- Request logging and monitoring

## Scalability Considerations

### Horizontal Scaling

- **Next.js**: Stateless, can scale horizontally
- **Supabase**: Managed database, auto-scales
- **n8n**: Can run multiple workers
- **Storage**: Supabase Storage with CDN

### Performance Optimizations

- Database indexes on frequently queried fields
- Caching leaderboard data (future enhancement)
- Batch processing in n8n workflows
- Async webhook processing

### Monitoring

- n8n execution logs
- Webhook call logs
- Database query performance
- Error tracking and alerts

## Error Handling

### n8n Workflow Errors

- n8n retries failed operations
- Errors logged in n8n execution history
- Failed posts marked with `status: 'failed'`
- Error messages stored for debugging

### Next.js Error Handling

- Try-catch blocks in all API routes
- Graceful error responses
- User-friendly error messages
- Error logging to console/monitoring service

### Database Errors

- Transaction rollbacks on failures
- Constraint violations handled gracefully
- RLS policy violations return 403

## Future Enhancements

### Planned

- Real-time updates via Supabase subscriptions
- Webhook retry queue
- Advanced analytics dashboard
- Bulk operations
- Video editing interface
- Multi-platform simultaneous posting

### Considerations

- Move to event-driven architecture (message queue)
- Add caching layer (Redis)
- Implement GraphQL API
- Add webhook signature verification
- Set up monitoring and alerting

## Development Workflow

### Local Development

1. Run Next.js: `npm run dev`
2. Run Supabase locally (or use cloud)
3. Run n8n locally or use cloud instance
4. Configure webhook URLs to point to local Next.js (ngrok for testing)

### Testing

1. Test Next.js API endpoints independently
2. Test n8n workflows with mock data
3. Integration tests for full flows
4. E2E tests for critical user paths

### Deployment

1. Deploy Next.js to Vercel/Netlify
2. Deploy n8n (self-hosted or cloud)
3. Configure production webhook URLs
4. Set up monitoring and alerts

## Dependencies

### Next.js App
- Supabase client libraries
- Next.js 14 (App Router)
- React 18
- Tailwind CSS

### n8n Workflows
- Platform API nodes (YouTube, Instagram, TikTok)
- HTTP Request nodes
- Supabase nodes (optional)
- Cron triggers

### External Services
- Supabase (Database, Auth, Storage)
- Platform APIs (YouTube, Instagram, TikTok)
- n8n instance

## Documentation

- [SETUP.md](./SETUP.md) - Setup instructions
- [N8N_INTEGRATION.md](./N8N_INTEGRATION.md) - n8n integration guide
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Feature overview



