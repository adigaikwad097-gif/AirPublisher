# Sync Updated Files and Rebuild

**On the server, run these commands:**

```bash
cd /opt/apps/air-publisher

# Stop PM2
pm2 stop air-publisher
pm2 delete air-publisher

# Sync the updated page.tsx file from your local machine
# (You'll need to do this from your Mac terminal)
```

**From your Mac terminal, run:**

```bash
rsync -avz app/page.tsx air_publisher_user@93.127.216.83:/opt/apps/air-publisher/app/page.tsx
```

**Then back on the server:**

```bash
cd /opt/apps/air-publisher

# Rebuild
npm run build

# Start with standalone server
cd .next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save

# Check status
pm2 status
pm2 logs air-publisher
```

The fixes:
- ✅ Removed "the creator operating system" text
- ✅ Changed `bg-background` to `bg-black` for proper black background

