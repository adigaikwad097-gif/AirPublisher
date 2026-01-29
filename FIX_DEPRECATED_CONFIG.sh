#!/bin/bash
# Quick fix for deprecated config on server

cd /opt/apps/air-publisher

# Remove the deprecated config block using sed
sed -i '/^export const config = {$/,/^}$/d' app/api/videos/\[id\]/upload/route.ts

echo "✅ Fixed deprecated config"
echo "Now run: npm run build"

