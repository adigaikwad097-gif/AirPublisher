-- Migration: Create likes and comments tables for videos

-- Create video_likes table
CREATE TABLE IF NOT EXISTS airpublisher_video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES air_publisher_videos(id) ON DELETE CASCADE,
  creator_unique_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, creator_unique_identifier) -- One like per creator per video
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON airpublisher_video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_creator ON airpublisher_video_likes(creator_unique_identifier);

-- Create video_comments table
CREATE TABLE IF NOT EXISTS airpublisher_video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES air_publisher_videos(id) ON DELETE CASCADE,
  creator_unique_identifier TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON airpublisher_video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_creator ON airpublisher_video_comments(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_video_comments_created_at ON airpublisher_video_comments(created_at DESC);

-- Enable RLS
ALTER TABLE airpublisher_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE airpublisher_video_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
-- Anyone can view likes
CREATE POLICY "Anyone can view likes" ON airpublisher_video_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like/unlike videos
CREATE POLICY "Authenticated users can like videos" ON airpublisher_video_likes
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for comments
-- Anyone can view comments
CREATE POLICY "Anyone can view comments" ON airpublisher_video_comments
  FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON airpublisher_video_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update/delete their own comments
CREATE POLICY "Users can update own comments" ON airpublisher_video_comments
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments" ON airpublisher_video_comments
  FOR DELETE
  USING (auth.uid() IS NOT NULL);


