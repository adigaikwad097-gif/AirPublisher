# Force Fix PM2 - Check and Restart Correctly

**On the server, run these commands step by step:**

```bash
# 1. Check what PM2 is actually running
pm2 describe air-publisher

# 2. If it shows "next start" or wrong path, delete it
pm2 delete air-publisher

# 3. Go to app root
cd /opt/apps/air-publisher

# 4. Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# 5. Make sure standalone directory exists
ls -la .next/standalone/server.js

# 6. If it doesn't exist, rebuild
npm run build

# 7. Navigate to standalone directory
cd .next/standalone

# 8. Start with standalone server (absolute path to be sure)
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start /opt/apps/air-publisher/.next/standalone/server.js --name "air-publisher"
pm2 save

# 9. Verify it's correct
pm2 describe air-publisher

# 10. Check logs
pm2 logs air-publisher --lines 10
```

**The key:** Use absolute path to `server.js` and make sure you're starting `server.js`, not `next start`.

