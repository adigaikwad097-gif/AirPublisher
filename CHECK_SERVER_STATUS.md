# Check Server Status Before Deploying

Run these commands on the server to make sure we're safe:

```bash
# Check current directory
pwd
# Should show: /opt/apps/air-publisher

# Check what's already there
ls -la

# Check if anything is already running on port 3003
sudo netstat -tlnp | grep 3003
# OR
sudo lsof -i :3003

# Check if there are any existing processes
ps aux | grep node
ps aux | grep docker

# Check disk space
df -h

# Check if .env.local exists (don't overwrite!)
ls -la .env.local
```

## Safe Deployment Steps

1. **Backup existing .env.local if it exists:**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **Check if there's already a running app:**
   ```bash
   # Check for PM2 processes
   pm2 list
   
   # Check for Docker containers
   docker ps
   ```

3. **Only then proceed with installation**

