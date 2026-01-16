// Quick debug script to check profiles in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProfiles() {
  console.log('\n=== Checking Creator Profiles ===\n');
  
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('id, unique_identifier, handles, Niche, profile_pic_url')
    .order('id', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} profile(s):\n`);
  data.forEach((profile, i) => {
    console.log(`${i + 1}. ID: ${profile.id}`);
    console.log(`   Unique Identifier: ${profile.unique_identifier}`);
    console.log(`   Handles: ${profile.handles || '(null)'}`);
    console.log(`   Niche: ${profile.Niche || '(null)'}`);
    console.log(`   Profile Pic: ${profile.profile_pic_url || '(null)'}`);
    console.log('');
  });
}

checkProfiles().catch(console.error);
