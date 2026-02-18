# Deploy to SSH Server

## Quick Deploy

To deploy all changes to your server at `aircreator.cloud:3003`, you have a few options:

### Option 1: Manual SSH Deploy

1. SSH into your server:
   ```bash
   ssh your_username@aircreator.cloud
   ```

2. Navigate to your project directory:
   ```bash
   cd /path/to/airpublisher
   ```

3. Pull latest changes:
   ```bash
   git pull origin main
   ```

4. Install dependencies (if needed):
   ```bash
   npm install
   ```

5. Build the application:
   ```bash
   npm run build
   ```

6. Restart your application:
   ```bash
   # If using PM2:
   pm2 restart airpublisher
   
   # If using systemd:
   sudo systemctl restart airpublisher
   
   # If using npm start directly:
   # Kill the old process and restart
   ```

### Option 2: Automated Deploy Script

1. Edit `deploy.sh` with your SSH credentials:
   ```bash
   SSH_USER="your_username"
   REMOTE_DIR="/path/to/airpublisher"
   ```

2. Make it executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the script:
   ```bash
   ./deploy.sh
   ```

### Option 3: One-liner SSH Command

```bash
ssh your_username@aircreator.cloud "cd /path/to/airpublisher && git pull origin main && npm install && npm run build && pm2 restart airpublisher"
```

## What Was Deployed

- ✅ Supabase Edge Functions for OAuth (`alyan_youtubeauth`, `alyan_instagramauth`)
- ✅ Updated Next.js API routes to use Edge Functions
- ✅ All recent OAuth flow changes
- ✅ Documentation files

## Post-Deployment Checklist

1. **Verify Environment Variables**:
   - Check that `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify other required env vars are configured

2. **Test OAuth Flows**:
   - Test YouTube connection at `/settings/connections`
   - Test Instagram connection at `/settings/connections`

3. **Check Application Logs**:
   ```bash
   # PM2 logs
   pm2 logs airpublisher
   
   # Systemd logs
   sudo journalctl -u airpublisher -f
   ```

4. **Verify Edge Functions**:
   - Check Supabase Dashboard > Edge Functions
   - Verify both functions are deployed and running

## Troubleshooting

### Build Fails
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `rm -rf .next node_modules && npm install`

### Application Won't Start
- Check port 3003 is available: `lsof -i :3003`
- Verify environment variables are set
- Check application logs for errors

### OAuth Not Working
- Verify Edge Functions are deployed in Supabase
- Check OAuth redirect URIs are correctly configured
- Verify environment variables in Supabase Edge Function secrets

