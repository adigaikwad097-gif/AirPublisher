#!/bin/bash

# Get current ngrok URL from ngrok API
# Usage: ./scripts/get-ngrok-url.sh

NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
  echo "❌ ngrok is not running or ngrok API is not accessible"
  echo ""
  echo "To start ngrok, run:"
  echo "  ngrok http 3000"
  echo ""
  echo "Then run this script again to get your ngrok URL"
  exit 1
fi

echo "✅ Current ngrok URL: $NGROK_URL"
echo ""
echo "📋 Add this to your Meta App Redirect URIs:"
echo "   $NGROK_URL/api/auth/instagram/callback"
echo "   $NGROK_URL/api/auth/youtube/callback"
echo ""
echo "📝 Update your .env.local:"
echo "   NEXT_PUBLIC_APP_URL=$NGROK_URL"
echo ""



