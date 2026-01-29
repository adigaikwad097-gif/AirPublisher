# Why App Isn't Loading - Quick Fix

The app isn't loading because:
1. ❌ Node.js/npm not installed
2. ❌ Docker not installed  
3. ❌ App hasn't been built/started

## Quick Fix - Install and Run

**On the server, run these commands:**

### Option 1: Install with nvm (No sudo needed - RECOMMENDED)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20

# Verify
node --version
npm --version

# Now build and run
cd /opt/apps/air-publisher
npm ci
npm run build

# Install PM2 to keep it running
npm install -g pm2

# Start the app on port 3003
PORT=3003 pm2 start npm --name "air-publisher" -- start
pm2 save

# Check status
pm2 status
pm2 logs air-publisher
```

### Option 2: If you have sudo access

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker air_publisher_user

# Log out and back in, then:
cd /opt/apps/air-publisher
npm ci
npm run build
docker-compose up -d --build
```

## Check if it's working

After starting, check:
```bash
# Check if port 3003 is listening
sudo lsof -i :3003

# Or test from your local machine
curl http://93.127.216.83:3003
```

## Most Likely Issue

The app isn't loading because **nothing is running on port 3003 yet**. You need to:
1. Install Node.js (use nvm - no sudo needed)
2. Build the app (`npm run build`)
3. Start it (`pm2 start` or `docker-compose up`)

Try Option 1 first (nvm) - it's the easiest and doesn't need sudo!

