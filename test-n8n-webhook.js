/**
 * Test script to verify n8n webhook is receiving payloads
 * Run with: node test-n8n-webhook.js
 */

const webhookUrl = 'https://support-team.app.n8n.cloud/webhook/uploaddropbox'

async function testWebhook() {
  console.log('🧪 Testing n8n webhook:', webhookUrl)
  console.log('')
  
  // Test 1: Simple JSON payload
  console.log('Test 1: Sending simple JSON payload...')
  try {
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test: true,
        video_id: 'test-123',
        message: 'This is a test payload',
      }),
    })
    
    console.log('✅ Response status:', response1.status, response1.statusText)
    const text1 = await response1.text()
    console.log('Response body:', text1.substring(0, 200))
    console.log('')
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
    if (error.message.includes('CORS')) {
      console.error('   ⚠️  CORS error detected - n8n webhook may not allow requests from Node.js')
    }
    console.log('')
  }
  
  // Test 2: FormData (like the actual upload)
  console.log('Test 2: Sending FormData payload...')
  try {
    const formData = new FormData()
    formData.append('test', 'true')
    formData.append('video_id', 'test-456')
    formData.append('creator_unique_identifier', 'test-creator')
    formData.append('file_name', 'test.mp4')
    formData.append('callback_url', 'https://example.com/callback')
    
    // Create a small test file
    const testFile = new Blob(['test file content'], { type: 'text/plain' })
    formData.append('file', testFile, 'test.txt')
    
    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    })
    
    console.log('✅ Response status:', response2.status, response2.statusText)
    const text2 = await response2.text()
    console.log('Response body:', text2.substring(0, 200))
    console.log('')
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
    if (error.message.includes('CORS')) {
      console.error('   ⚠️  CORS error detected - n8n webhook may not allow requests from Node.js')
    }
    console.log('')
  }
  
  // Test 3: Check if webhook is accessible (HEAD request)
  console.log('Test 3: Checking webhook accessibility...')
  try {
    const response3 = await fetch(webhookUrl, {
      method: 'HEAD',
    })
    console.log('✅ Webhook is accessible')
    console.log('Response status:', response3.status, response3.statusText)
    console.log('')
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message)
    console.log('')
  }
  
  console.log('📋 Summary:')
  console.log('   - If you see 200/201 responses, the webhook is working')
  console.log('   - If you see 404, the webhook URL is wrong or workflow is not active')
  console.log('   - If you see CORS errors, n8n webhook needs CORS enabled')
  console.log('   - Check n8n Executions tab to see if requests were received')
}

testWebhook().catch(console.error)

