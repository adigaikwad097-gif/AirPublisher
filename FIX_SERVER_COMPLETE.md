# Complete Server Fix - Sync Everything and Restart Properly

**The issues:**
1. PM2 is using `next start` instead of standalone server
2. Logo image not synced
3. Files might be outdated

**Step 1: From your Mac, sync ALL files:**

```bash
cd /Users/suniya/Desktop/airpublisher

# Sync app files
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  app/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/app/

# Sync components
rsync -avz --exclude 'node_modules' \
  components/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/components/

# Sync public folder (IMPORTANT - includes logo)
rsync -avz \
  public/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/public/

# Sync config files
rsync -avz \
  next.config.js app/page.tsx \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

**Step 2: On the server, stop PM2 and rebuild:**

```bash
cd /opt/apps/air-publisher

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# Stop PM2 completely
pm2 stop all
pm2 delete all

# Rebuild
npm run build

# Start with standalone server (CORRECT WAY)
cd .next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save

# Check status
pm2 status
pm2 logs air-publisher --lines 50
```

**This will fix:**
- ✅ Using standalone server (not `next start`)
- ✅ Logo image synced
- ✅ All updated components synced
- ✅ Correct background colors and styling

