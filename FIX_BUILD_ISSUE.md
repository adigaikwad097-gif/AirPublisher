# Fix Build Issue

**On the server, run these commands:**

```bash
cd /opt/apps/air-publisher

# Stop PM2 process
pm2 stop air-publisher
pm2 delete air-publisher

# Install dependencies with legacy peer deps (fixes the conflict)
npm install --legacy-peer-deps

# Now build
npm run build

# Check if build succeeded
ls -la .next

# Start with PM2
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start npm --name "air-publisher" -- start
pm2 save

# Check logs to see if it's working
pm2 logs air-publisher --lines 30
```

The issue was:
- `npm ci` failed due to @splinetool/react-spline dependency conflict
- Build failed because dependencies weren't installed
- PM2 started but app crashed because build doesn't exist

Using `npm install --legacy-peer-deps` will fix the dependency issue.

