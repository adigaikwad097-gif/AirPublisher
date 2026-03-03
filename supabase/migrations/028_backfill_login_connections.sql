-- Migration: Backfill Login Identities into Unified Connections Registry
-- This ensures that users logged in via Instagram/YouTube see their accounts as "connected" in the UI

INSERT INTO airpublisher_connections (user_id, primary_identifier, platform, connection_identifier, platform_name)
SELECT 
    user_id,
    unique_identifier as primary_identifier,
    CASE 
        WHEN platform LIKE 'instagram%' THEN 'instagram'
        WHEN platform = 'youtube' THEN 'youtube'
        ELSE platform
    END as platform,
    unique_identifier as connection_identifier,
    handles as platform_name
FROM creator_profiles
WHERE platform IN ('instagram-basic', 'instagram-graph', 'youtube')
ON CONFLICT (user_id, platform, connection_identifier) DO UPDATE SET
    platform_name = EXCLUDED.platform_name,
    updated_at = NOW();

COMMENT ON TABLE airpublisher_connections IS 'Unified registry including both login identities and publishing-enabled connections.';
