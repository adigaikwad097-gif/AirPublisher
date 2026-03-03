-- Remove orphan facebook_tokens rows created by incomplete/old OAuth flows.
-- These rows have no creator_unique_identifier and no actual tokens,
-- causing a false "Connected" state in the PostNowButton platform menu.
DELETE FROM facebook_tokens
WHERE creator_unique_identifier IS NULL
  AND page_access_token IS NULL
  AND user_access_token_long_lived IS NULL;
