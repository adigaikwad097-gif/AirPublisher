# n8n Scheduled Posting - Quick Reference

## API Endpoints

### 1. Get Scheduled Posts (Due for Posting)
**GET** `/api/n8n/scheduled-posts?limit=50&before={{ $now }}`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "posts": [
    {
      "scheduled_post_id": "uuid",
      "video_id": "uuid",
      "creator_unique_identifier": "creator-id",
      "platform": "tiktok",
      "scheduled_at": "2024-01-15T14:30:00Z",
      "title": "Video Title",
      "description": "Description",
      "video_url": "https://...",
      "thumbnail_url": "https://..."
    }
  ]
}
```

### 2. Get Video Details & Tokens
**GET** `/api/n8n/video-details?video_id={{ $json.video_id }}`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`

**Response:**
```json
{
  "success": true,
  "video": { ... },
  "platform_tokens": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### 3. Update Scheduled Post Status
**POST** `/api/n8n/scheduled-posts/{{ $json.scheduled_post_id }}/update-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body (Processing):**
```json
{
  "status": "processing"
}
```

**Body (Success):**
```json
{
  "status": "posted",
  "posted_at": "{{ $now }}"
}
```

**Body (Failure):**
```json
{
  "status": "failed",
  "error_message": "Error description"
}
```

### 4. Update Video Status & Platform URL
**POST** `/api/webhooks/n8n/post-status`

**Headers:**
- `x-n8n-api-key: {{ $env.N8N_API_KEY }}`
- `Content-Type: application/json`

**Body:**
```json
{
  "video_id": "uuid",
  "status": "posted",
  "platform": "tiktok",
  "tiktok_url": "https://www.tiktok.com/@username/video/123",
  "published_at": "2024-01-15T14:30:00Z"
}
```

## Workflow Steps (Minimal)

1. **Cron Trigger** → Every 10 minutes
2. **Get Scheduled Posts** → GET `/api/n8n/scheduled-posts`
3. **Split Out Items** → Iterate over `posts` array
4. **Get Video Details** → GET `/api/n8n/video-details`
5. **Mark as Processing** → POST `/api/n8n/scheduled-posts/{id}/update-status`
6. **Post to Platform** → (TikTok/YouTube/Instagram specific steps)
7. **Update Video Status** → POST `/api/webhooks/n8n/post-status`
8. **Update Scheduled Post** → POST `/api/n8n/scheduled-posts/{id}/update-status` (status: posted)

## Status Flow

```
pending → processing → posted
                    ↓
                  failed
```

## Key Points

- **Mark as "processing"** BEFORE posting to prevent duplicate processing
- **Update scheduled post status** AFTER posting (success or failure)
- **Update video status** via `/api/webhooks/n8n/post-status` to set platform URL
- **Error handling:** Always mark as "failed" if posting fails, include error message

## Testing

Create a test scheduled post:
```sql
INSERT INTO air_publisher_scheduled_posts 
(video_id, creator_unique_identifier, platform, scheduled_at)
VALUES 
('video-uuid', 'creator-id', 'tiktok', NOW() + INTERVAL '1 minute');
```

Then run the workflow manually in n8n to test.

