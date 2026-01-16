import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    console.log('');
  });
  
  // Also check auth users
  console.log('\n=== Checking Auth Users ===\n');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (!userError && users) {
    console.log(`Found ${users.users.length} user(s):\n`);
    users.users.slice(0, 5).forEach((user, i) => {
      console.log(`${i + 1}. ID: ${user.id.substring(0, 20)}...`);
      console.log(`   Email: ${user.email}`);
      console.log(`   First 8 chars: ${user.id.substring(0, 8)}`);
      console.log('');
    });
  }
}

checkProfiles().catch(console.error);
