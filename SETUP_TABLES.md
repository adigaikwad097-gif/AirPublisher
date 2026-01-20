# Setting Up AIR Publisher Tables in Supabase

Since you're creating the tables yourself, here's the SQL migration to run in your Supabase project.

## Steps to Create Tables

1. **Go to your Supabase Dashboard**
   - Navigate to: SQL Editor
   - Click "New Query"

2. **Run the Migration SQL**

Copy and paste the SQL from `supabase/migrations/001_create_air_publisher_tables.sql` into the SQL editor and run it.

Or use this simplified version (without RLS policies that depend on user_id):

```sql
-- Table: air_publisher_videos
CREATE TABLE IF NOT EXISTS air_publisher_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ai_generated', 'ugc')),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  platform_target TEXT NOT NULL CHECK (platform_target IN ('youtube', 'instagram', 'tiktok', 'internal')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_creator ON air_publisher_videos(creator_unique_identifier);
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_scheduled ON air_publisher_videos(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_air_publisher_videos_status ON air_publisher_videos(status);

-- Table: air_leaderboards
CREATE TABLE IF NOT EXISTS air_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_unique_identifier TEXT NOT NULL,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  estimated_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  score DECIMAL(12, 2) NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'all_time')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_unique_identifier, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_air_leaderboards_period ON air_leaderboards(period, score DESC);
CREATE INDEX IF NOT EXISTS idx_air_leaderboards_creator ON air_leaderboards(creator_unique_identifier);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_air_publisher_videos_updated_at
  BEFORE UPDATE ON air_publisher_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_air_leaderboards_updated_at
  BEFORE UPDATE ON air_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE air_publisher_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - allows all authenticated users for now)
-- You can customize these based on your needs

-- Allow authenticated users to view all videos (for now)
CREATE POLICY "Allow authenticated users to view videos"
  ON air_publisher_videos FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert videos
CREATE POLICY "Allow authenticated users to insert videos"
  ON air_publisher_videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update videos
CREATE POLICY "Allow authenticated users to update videos"
  ON air_publisher_videos FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Leaderboards are public (anyone can view)
CREATE POLICY "Anyone can view leaderboards"
  ON air_leaderboards FOR SELECT
  USING (true);

-- Only authenticated users can update leaderboards (via service role in practice)
CREATE POLICY "Allow authenticated users to update leaderboards"
  ON air_leaderboards FOR UPDATE
  USING (auth.role() = 'authenticated');
```

3. **Verify Tables Created**

After running the SQL, verify the tables exist:
- Go to Table Editor in Supabase
- You should see `air_publisher_videos` and `air_leaderboards` tables

## Alternative: Use Existing `creator_posts` Table

If you prefer to use your existing `creator_posts` table instead, we can adapt the code. Let me know!

## Next Steps

Once the tables are created:
1. The app will automatically start using them
2. You can upload videos through the UI
3. Leaderboards will work once you have video data


