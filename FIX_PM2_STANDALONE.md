# Fix PM2 - Use Standalone Server

**The problem:** PM2 is still running `next start` instead of the standalone server.

**On the server, run these commands:**

```bash
cd /opt/apps/air-publisher

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# Stop ALL PM2 processes
pm2 stop all
pm2 delete all

# Make sure we're in the right directory
cd /opt/apps/air-publisher

# Rebuild to ensure .next/standalone exists
npm run build

# Navigate to standalone directory
cd .next/standalone

# Start with standalone server (NOT "next start")
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save

# Verify it's running correctly
pm2 status
pm2 logs air-publisher --lines 20
```

**If you see "next start" in the logs, PM2 is still using the wrong command. Check:**

```bash
# Check what PM2 is actually running
pm2 describe air-publisher

# If it shows "next start", delete and restart:
pm2 delete air-publisher
cd /opt/apps/air-publisher/.next/standalone
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start server.js --name "air-publisher"
pm2 save
```

