-- Migration: Create update_leaderboards() function and schedule via pg_cron
-- Aggregates video stats from air_publisher_videos into air_leaderboards
-- Runs at minute 5 of every hour (after sync-video-stats at minute 0)

CREATE OR REPLACE FUNCTION update_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ===========================================
  -- ALL TIME: all posted videos, no date filter
  -- ===========================================
  INSERT INTO air_leaderboards (
    creator_unique_identifier,
    total_views,
    total_likes,
    total_comments,
    estimated_revenue,
    score,
    rank,
    period
  )
  SELECT
    creator_unique_identifier,
    COALESCE(SUM(views), 0) AS total_views,
    COALESCE(SUM(COALESCE(likes, 0)), 0) AS total_likes,
    COALESCE(SUM(COALESCE(comments, 0)), 0) AS total_comments,
    ROUND(COALESCE(SUM(views), 0) * 4.0 / 1000, 2) AS estimated_revenue,
    ROUND(
      (COALESCE(SUM(views), 0) * 0.4) +
      (COALESCE(SUM(COALESCE(likes, 0)), 0) * 0.2) +
      (COALESCE(SUM(COALESCE(comments, 0)), 0) * 0.2) +
      (COALESCE(SUM(views), 0) * 4.0 / 1000 * 2),
    2) AS score,
    0 AS rank,
    'all_time' AS period
  FROM air_publisher_videos
  WHERE status = 'posted'
  GROUP BY creator_unique_identifier
  ON CONFLICT (creator_unique_identifier, period)
  DO UPDATE SET
    total_views       = EXCLUDED.total_views,
    total_likes       = EXCLUDED.total_likes,
    total_comments    = EXCLUDED.total_comments,
    estimated_revenue = EXCLUDED.estimated_revenue,
    score             = EXCLUDED.score;

  -- ===========================================
  -- WEEKLY: videos posted in the last 7 days
  -- ===========================================
  INSERT INTO air_leaderboards (
    creator_unique_identifier,
    total_views,
    total_likes,
    total_comments,
    estimated_revenue,
    score,
    rank,
    period
  )
  SELECT
    creator_unique_identifier,
    COALESCE(SUM(views), 0) AS total_views,
    COALESCE(SUM(COALESCE(likes, 0)), 0) AS total_likes,
    COALESCE(SUM(COALESCE(comments, 0)), 0) AS total_comments,
    ROUND(COALESCE(SUM(views), 0) * 4.0 / 1000, 2) AS estimated_revenue,
    ROUND(
      (COALESCE(SUM(views), 0) * 0.4) +
      (COALESCE(SUM(COALESCE(likes, 0)), 0) * 0.2) +
      (COALESCE(SUM(COALESCE(comments, 0)), 0) * 0.2) +
      (COALESCE(SUM(views), 0) * 4.0 / 1000 * 2),
    2) AS score,
    0 AS rank,
    'weekly' AS period
  FROM air_publisher_videos
  WHERE status = 'posted'
    AND posted_at >= NOW() - INTERVAL '7 days'
  GROUP BY creator_unique_identifier
  ON CONFLICT (creator_unique_identifier, period)
  DO UPDATE SET
    total_views       = EXCLUDED.total_views,
    total_likes       = EXCLUDED.total_likes,
    total_comments    = EXCLUDED.total_comments,
    estimated_revenue = EXCLUDED.estimated_revenue,
    score             = EXCLUDED.score;

  -- ===========================================
  -- DAILY: videos posted today (UTC)
  -- ===========================================
  INSERT INTO air_leaderboards (
    creator_unique_identifier,
    total_views,
    total_likes,
    total_comments,
    estimated_revenue,
    score,
    rank,
    period
  )
  SELECT
    creator_unique_identifier,
    COALESCE(SUM(views), 0) AS total_views,
    COALESCE(SUM(COALESCE(likes, 0)), 0) AS total_likes,
    COALESCE(SUM(COALESCE(comments, 0)), 0) AS total_comments,
    ROUND(COALESCE(SUM(views), 0) * 4.0 / 1000, 2) AS estimated_revenue,
    ROUND(
      (COALESCE(SUM(views), 0) * 0.4) +
      (COALESCE(SUM(COALESCE(likes, 0)), 0) * 0.2) +
      (COALESCE(SUM(COALESCE(comments, 0)), 0) * 0.2) +
      (COALESCE(SUM(views), 0) * 4.0 / 1000 * 2),
    2) AS score,
    0 AS rank,
    'daily' AS period
  FROM air_publisher_videos
  WHERE status = 'posted'
    AND posted_at >= DATE_TRUNC('day', NOW())
  GROUP BY creator_unique_identifier
  ON CONFLICT (creator_unique_identifier, period)
  DO UPDATE SET
    total_views       = EXCLUDED.total_views,
    total_likes       = EXCLUDED.total_likes,
    total_comments    = EXCLUDED.total_comments,
    estimated_revenue = EXCLUDED.estimated_revenue,
    score             = EXCLUDED.score;

  -- ===========================================
  -- UPDATE RANKS for each period
  -- ===========================================
  UPDATE air_leaderboards AS lb
  SET rank = ranked.new_rank
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY period ORDER BY score DESC) AS new_rank
    FROM air_leaderboards
  ) AS ranked
  WHERE lb.id = ranked.id;

  -- ===========================================
  -- CLEANUP stale daily/weekly entries
  -- ===========================================
  DELETE FROM air_leaderboards
  WHERE period = 'daily'
    AND creator_unique_identifier NOT IN (
      SELECT DISTINCT creator_unique_identifier
      FROM air_publisher_videos
      WHERE status = 'posted'
        AND posted_at >= DATE_TRUNC('day', NOW())
    );

  DELETE FROM air_leaderboards
  WHERE period = 'weekly'
    AND creator_unique_identifier NOT IN (
      SELECT DISTINCT creator_unique_identifier
      FROM air_publisher_videos
      WHERE status = 'posted'
        AND posted_at >= NOW() - INTERVAL '7 days'
    );

END;
$$;

-- Schedule leaderboard update at minute 5 of every hour
-- (5 minutes after sync-video-stats-hourly at minute 0)
SELECT cron.schedule(
  'update-leaderboards-hourly',
  '5 * * * *',
  $$SELECT update_leaderboards();$$
);
