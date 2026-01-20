// Quick test script to verify .env.local is being read
// Run: node test-env.js

try {
  // Try to load .env.local manually
  require('dotenv').config({ path: '.env.local' })
  
  console.log('=== Environment Variables Test ===\n')
  console.log('META_APP_ID:', process.env.META_APP_ID || '❌ NOT FOUND')
  console.log('META_APP_SECRET:', process.env.META_APP_SECRET ? '✅ SET (hidden)' : '❌ NOT FOUND')
  console.log('INSTAGRAM_APP_ID:', process.env.INSTAGRAM_APP_ID || '❌ NOT FOUND')
  console.log('YOUTUBE_CLIENT_ID:', process.env.YOUTUBE_CLIENT_ID ? '✅ SET (hidden)' : '❌ NOT FOUND')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT FOUND')
  console.log('\n=== File Check ===')
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file exists')
    const content = fs.readFileSync(envPath, 'utf8')
    const hasMeta = content.includes('META_APP_ID')
    console.log('Contains META_APP_ID:', hasMeta ? '✅ YES' : '❌ NO')
  } else {
    console.log('❌ .env.local file does NOT exist')
  }
} catch (error) {
  console.error('Error:', error.message)
  console.log('\n💡 Install dotenv: npm install dotenv')
}


