# Troubleshoot: App Not Live

## Step 1: Check if app is actually running

**On the server, run:**

```bash
# Check PM2 status
pm2 status

# Check if anything is listening on port 3003
sudo lsof -i :3003
# OR
sudo netstat -tlnp | grep 3003

# Check PM2 logs for errors
pm2 logs air-publisher --lines 50
```

## Step 2: Check for build errors

```bash
cd /opt/apps/air-publisher

# Check if .next folder exists (build succeeded)
ls -la .next

# If no .next folder, rebuild
npm run build
```

## Step 3: Check environment variables

```bash
# Check if .env.local exists
ls -la .env.local

# Check if NEXT_PUBLIC_APP_URL is set
cat .env.local | grep NEXT_PUBLIC_APP_URL
```

## Step 4: Check firewall/port access

```bash
# Check if port 3003 is open
sudo ufw status
# If firewall is active, you may need to open port 3003:
# sudo ufw allow 3003

# Test from server itself
curl http://localhost:3003
```

## Step 5: Restart the app properly

```bash
# Stop existing process
pm2 stop air-publisher
pm2 delete air-publisher

# Make sure you're in the right directory
cd /opt/apps/air-publisher

# Check .env.local has the right URL
echo "NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003" >> .env.local

# Start fresh
PORT=3003 pm2 start npm --name "air-publisher" -- start
pm2 save

# Watch logs in real-time
pm2 logs air-publisher
```

## Step 6: Test from your local machine

```bash
# From your Mac terminal
curl http://93.127.216.83:3003

# Or open in browser
open http://93.127.216.83:3003
```

## Common Issues:

### Issue 1: "Cannot GET /"
- App is running but Next.js isn't built
- **Fix:** Run `npm run build` first

### Issue 2: Connection refused
- Nothing listening on port 3003
- **Fix:** Check `pm2 status` and restart

### Issue 3: Port already in use
- Something else using port 3003
- **Fix:** `sudo lsof -i :3003` and kill the process

### Issue 4: Build failed
- Check build errors: `npm run build`
- **Fix:** Check for missing dependencies or TypeScript errors

## Quick Diagnostic Command

Run this on the server to see everything at once:

```bash
echo "=== PM2 Status ==="
pm2 status
echo ""
echo "=== Port 3003 ==="
sudo lsof -i :3003 || echo "Nothing on port 3003"
echo ""
echo "=== Build Check ==="
ls -la .next 2>/dev/null && echo "✅ Build exists" || echo "❌ No build - run npm run build"
echo ""
echo "=== Recent Logs ==="
pm2 logs air-publisher --lines 10 --nostream
```

