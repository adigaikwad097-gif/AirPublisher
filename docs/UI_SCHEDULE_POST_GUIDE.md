# UI: Schedule Post Implementation Guide

Guide for implementing the schedule post UI where users can pick date/time (minute, hour, day, month, year) and create scheduled posts.

## Database Schema

The `air_publisher_scheduled_posts` table stores:
- `video_id` - Reference to the video
- `platform` - Target platform (youtube, instagram, tiktok)
- `scheduled_at` - Full timestamp with minute precision
- `status` - pending, processing, posted, failed, cancelled

## UI Components Needed

### 1. Date/Time Picker

Use a library like:
- **React DatePicker** (`react-datepicker`)
- **MUI DateTimePicker** (`@mui/x-date-pickers`)
- **React DayPicker** with time input

### 2. Platform Selector

Allow users to select one or multiple platforms:
- YouTube
- Instagram
- TikTok

### 3. Schedule Form

```tsx
interface SchedulePostForm {
  video_id: string
  platforms: ('youtube' | 'instagram' | 'tiktok')[]
  scheduled_at: Date // Full date/time with minute precision
}
```

## Server Action: Schedule Post

Create a server action to insert scheduled posts:

```typescript
// app/api/videos/actions.ts or similar

export async function schedulePostAction(
  videoId: string,
  platforms: ('youtube' | 'instagram' | 'tiktok')[],
  scheduledAt: Date
) {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Get creator identifier
  const creatorId = await getCreatorIdentifier(user.id)

  // Insert scheduled posts for each platform
  const scheduledPosts = platforms.map(platform => ({
    video_id: videoId,
    creator_unique_identifier: creatorId,
    platform,
    scheduled_at: scheduledAt.toISOString(),
    status: 'pending'
  }))

  const { data, error } = await supabase
    .from('air_publisher_scheduled_posts')
    .insert(scheduledPosts)
    .select()

  if (error) {
    throw new Error(`Failed to schedule posts: ${error.message}`)
  }

  // Also update video status to 'scheduled'
  await supabase
    .from('air_publisher_videos')
    .update({ status: 'scheduled' })
    .eq('id', videoId)

  return data
}
```

## UI Example: Schedule Post Component

```tsx
'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface SchedulePostProps {
  videoId: string
  onScheduled: () => void
}

export function SchedulePostForm({ videoId, onScheduled }: SchedulePostProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const platforms = [
    { id: 'youtube', label: 'YouTube' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scheduledAt || selectedPlatforms.length === 0) {
      alert('Please select platforms and schedule time')
      return
    }

    // Ensure scheduled time is in the future
    if (scheduledAt <= new Date()) {
      alert('Scheduled time must be in the future')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/videos/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          platforms: selectedPlatforms,
          scheduled_at: scheduledAt.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to schedule post')
      }

      onScheduled()
      alert('Post scheduled successfully!')
    } catch (error) {
      console.error('Error scheduling post:', error)
      alert('Failed to schedule post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Platforms
        </label>
        <div className="space-y-2">
          {platforms.map(platform => (
            <label key={platform.id} className="flex items-center">
              <input
                type="checkbox"
                value={platform.id}
                checked={selectedPlatforms.includes(platform.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPlatforms([...selectedPlatforms, platform.id])
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id))
                  }
                }}
                className="mr-2"
              />
              {platform.label}
            </label>
          ))}
        </div>
      </div>

      {/* Date/Time Picker */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Schedule Date & Time
        </label>
        <DatePicker
          selected={scheduledAt}
          onChange={(date: Date) => setScheduledAt(date)}
          showTimeSelect
          timeIntervals={1} // 1 minute intervals
          dateFormat="MMMM d, yyyy h:mm aa"
          minDate={new Date()}
          className="w-full p-2 border rounded"
          placeholderText="Select date and time"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !scheduledAt || selectedPlatforms.length === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
      </button>
    </form>
  )
}
```

## API Route: Schedule Post

```typescript
// app/api/videos/schedule/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { video_id, platforms, scheduled_at } = body

    // Validate
    if (!video_id || !platforms || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get creator identifier
    const { data: profile } = await supabase
      .from('creator_profiles')
      .select('unique_identifier')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduled_at)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // Insert scheduled posts
    const scheduledPosts = platforms.map((platform: string) => ({
      video_id,
      creator_unique_identifier: profile.unique_identifier,
      platform,
      scheduled_at: scheduled_at,
      status: 'pending'
    }))

    const { data, error } = await supabase
      .from('air_publisher_scheduled_posts')
      .insert(scheduledPosts)
      .select()

    if (error) {
      console.error('Error scheduling posts:', error)
      return NextResponse.json(
        { error: 'Failed to schedule posts', details: error.message },
        { status: 500 }
      )
    }

    // Update video status
    await supabase
      .from('air_publisher_videos')
      .update({ status: 'scheduled' })
      .eq('id', video_id)

    return NextResponse.json({
      success: true,
      scheduled_posts: data
    })
  } catch (error) {
    console.error('Error in schedule endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Features to Consider

1. **Time Zone Handling**
   - Store times in UTC
   - Display in user's local timezone
   - Convert to UTC before saving

2. **Validation**
   - Ensure scheduled time is in the future
   - Check for duplicate scheduling
   - Validate platform availability

3. **UI Enhancements**
   - Show scheduled posts list
   - Allow editing/cancelling scheduled posts
   - Show countdown to scheduled time
   - Display timezone clearly

4. **Bulk Scheduling**
   - Schedule same video to multiple platforms
   - Schedule different times for different platforms
   - Schedule recurring posts (future feature)

## Next Steps

1. Install date picker library: `npm install react-datepicker`
2. Create the schedule form component
3. Create the API route
4. Add to your video management page
5. Test scheduling and verify n8n picks it up


