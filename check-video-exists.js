/**
 * Quick script to check if a video exists in the database
 * Run with: node check-video-exists.js <video_id>
 */

const videoId = process.argv[2] || '4ff7ce7e-46c1-4790-adec-9bb28d95e13d'

console.log('Checking if video exists:', videoId)

// This would need your Supabase credentials
// For now, just shows the query you'd run

console.log(`
To check if the video exists, run this in Supabase SQL Editor:

SELECT id, creator_unique_identifier, title, status, video_url, created_at
FROM air_publisher_videos
WHERE id = '${videoId}';

If no rows are returned, the video doesn't exist.
If rows are returned, check the RLS policies.
`)


