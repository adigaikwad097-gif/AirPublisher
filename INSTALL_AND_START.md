# Install Node.js and Start App

**Run these commands on the server (you're already there!):**

```bash
# Step 1: Install Node.js using nvm (no sudo needed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Step 2: Reload your shell
source ~/.bashrc

# Step 3: Install Node.js 20
nvm install 20
nvm use 20

# Step 4: Verify it worked
node --version
npm --version

# Step 5: Go to your app directory
cd /opt/apps/air-publisher

# Step 6: Install dependencies
npm ci

# Step 7: Build the app
npm run build

# Step 8: Install PM2 globally
npm install -g pm2

# Step 9: Start the app on port 3003
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start npm --name "air-publisher" -- start

# Step 10: Save PM2 config (so it restarts on reboot)
pm2 save

# Step 11: Check status
pm2 status

# Step 12: Watch logs
pm2 logs air-publisher
```

After this, your app should be live at: **http://93.127.216.83:3003**

If you see any errors, share them and I'll help fix!

