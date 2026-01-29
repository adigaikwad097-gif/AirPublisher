# FINAL FIX - Complete Sync and Rebuild

**The problem:** Server is showing old UI (white background, old logo, no HeroBoxes).

**This means either:**
1. Files didn't sync properly
2. Build is using cached files
3. PM2 is serving old build

**Step 1: From Mac - Sync EVERYTHING (one command):**

```bash
cd /Users/suniya/Desktop/airpublisher

# Sync ALL source files
rsync -avz --delete --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '*.mp4' --exclude '*.log' \
  app/ \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/app/

rsync -avz --delete --exclude 'node_modules' \
  components/ \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/components/

rsync -avz --delete \
  public/ \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/public/

rsync -avz \
  next.config.js package.json package-lock.json \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

**Step 2: On Server - Complete Clean Rebuild:**

```bash
cd /opt/apps/air-publisher

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# Stop PM2
pm2 stop all
pm2 delete all

# DELETE EVERYTHING related to build
rm -rf .next
rm -rf node_modules/.cache

# Verify files are synced (check these exist)
echo "=== Checking files ==="
grep -q "bg-black" app/page.tsx && echo "✅ app/page.tsx has bg-black" || echo "❌ app/page.tsx missing bg-black"
test -f components/HeroBoxes.tsx && echo "✅ HeroBoxes.tsx exists" || echo "❌ HeroBoxes.tsx missing"
test -f public/creatorjoy-logo.webp && echo "✅ creatorjoy-logo.webp exists" || echo "❌ creatorjoy-logo.webp missing"
test -f public/b.png && echo "✅ b.png exists" || echo "❌ b.png missing"

# If any files are missing, STOP and re-sync from Mac

# Rebuild from scratch
npm run build

# Copy public to standalone (Next.js doesn't always do this)
cp -r public .next/standalone/public

# Verify standalone build
ls -la .next/standalone/server.js
ls -la .next/standalone/public/creatorjoy-logo.webp

# Start standalone server
cd .next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save

# Check status
pm2 status
pm2 logs air-publisher --lines 30
```

**Step 3: Verify on Server (after rebuild):**

```bash
# Check the built page.tsx has correct classes
grep -A 5 "min-h-screen" /opt/apps/air-publisher/.next/server/app/page.js | head -10

# Should show bg-black, not bg-background
```

If files don't match, the sync failed. Re-run Step 1.

