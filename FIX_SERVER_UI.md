# Fix Server UI - Sync All Files

The server is showing old code. We need to sync ALL updated files.

**From your Mac terminal, run:**

```bash
cd /Users/suniya/Desktop/airpublisher

# Sync all updated files (excluding node_modules, .next, etc.)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude '*.mp4' --exclude '*.log' \
  app/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/app/

rsync -avz --exclude 'node_modules' \
  components/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/components/

rsync -avz \
  public/ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/public/

rsync -avz \
  next.config.js app/page.tsx \
  air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

**Then on the server:**

```bash
cd /opt/apps/air-publisher

# Stop PM2
pm2 stop air-publisher
pm2 delete air-publisher

# Rebuild
npm run build

# Start
cd .next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save
pm2 logs air-publisher
```

This will sync:
- ✅ Updated `app/page.tsx` (black background, correct colors)
- ✅ `components/HeroBoxes.tsx` (the grid)
- ✅ Logo images in `public/`
- ✅ All other updated components

