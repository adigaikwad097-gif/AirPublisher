# Complete Fix - Verify Everything

**The issue:** Server still showing old UI. Need to verify files are synced and rebuild is correct.

**Step 1: From your Mac, sync ALL files again:**

```bash
cd /Users/suniya/Desktop/airpublisher

# Sync everything (force update)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '*.mp4' --exclude '*.log' \
  app/ components/ public/ next.config.js \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

**Step 2: On the server, clean and rebuild:**

```bash
cd /opt/apps/air-publisher

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# Stop PM2
pm2 stop all
pm2 delete all

# Clean old build
rm -rf .next

# Rebuild fresh
npm run build

# Verify standalone was created
ls -la .next/standalone/server.js

# Copy public folder to standalone (Next.js sometimes doesn't do this automatically)
cp -r public .next/standalone/public

# Verify logo is there
ls -la .next/standalone/public/creatorjoy-logo.webp

# Start standalone server
cd .next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save

# Check it's working
pm2 logs air-publisher --lines 20
```

**Step 3: Verify the files on server match local:**

```bash
# On server, check app/page.tsx has bg-black
grep "bg-black" /opt/apps/air-publisher/app/page.tsx

# Check HeroBoxes exists
ls -la /opt/apps/air-publisher/components/HeroBoxes.tsx

# Check logo exists
ls -la /opt/apps/air-publisher/public/creatorjoy-logo.webp
```

If any of these fail, the files didn't sync properly. Re-sync from Mac.

