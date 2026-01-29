# Deploy Without Docker (If Docker not available)

If Docker isn't available, we can run Next.js directly with PM2 or systemd.

## Step 1: Install Node.js (if not installed)

```bash
# Using nvm (no sudo required)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

## Step 2: Install PM2 (process manager)

```bash
npm install -g pm2
```

## Step 3: Build and start the app

```bash
cd /opt/apps/air-publisher
npm ci
npm run build

# Start with PM2
pm2 start npm --name "air-publisher" -- start
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

## Step 4: Configure port 3003

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'air-publisher',
    script: 'npm',
    args: 'start',
    env: {
      PORT: 3003,
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'http://93.127.216.83:3003'
    }
  }]
}
```

Then start with:
```bash
pm2 start ecosystem.config.js
```

## Check status

```bash
pm2 status
pm2 logs air-publisher
```

