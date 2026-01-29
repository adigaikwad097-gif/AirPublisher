# Quick Deployment Guide

## Option 1: Automated Deployment (Recommended)

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Sync your code to the server
2. Install dependencies
3. Build the application
4. Start Docker containers

## Option 2: Manual Deployment

### Step 1: Sync Files to Server

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude '*.mp4' --exclude '*.log' \
  ./ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

### Step 2: SSH into Server

```bash
ssh air_publisher_user@93.127.216.83
# Password: App8899n@123
```

### Step 3: Navigate and Deploy

```bash
cd /opt/apps/air-publisher

# Install dependencies
npm ci

# Build the application
npm run build

# Start with Docker
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Environment Variables

Make sure you have a `.env.local` file on the server with:

```bash
# Required
NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# n8n
N8N_API_KEY=your_n8n_api_key

# OAuth (if using)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# Dropbox (if using)
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_REDIRECT_URI=http://93.127.216.83:3003/api/auth/dropbox/callback
```

## Verify Deployment

1. **Check if app is running:**
   ```bash
   curl http://93.127.216.83:3003
   ```

2. **Check Docker containers:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f air-publisher
   ```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3003
sudo lsof -i :3003

# Kill the process or change port in docker-compose.yml
```

### Build Fails
```bash
# Check Node version (should be 20+)
node --version

# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

### Container Won't Start
```bash
# Check logs
docker-compose logs air-publisher

# Restart container
docker-compose restart air-publisher
```

## Access Your App

Once deployed, your app will be available at:
- **URL:** http://93.127.216.83:3003
- **Port:** 3003

## Next Steps

1. ✅ Update OAuth redirect URIs in platform apps
2. ✅ Test OAuth connections
3. ✅ Set up n8n automations (see `N8N_POSTING_AUTOMATIONS.md`)
4. ✅ Test video upload and posting

