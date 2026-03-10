#!/bin/bash

# Deployment script for airpublisher
# Usage: ./deploy.sh

set -e

# Configuration
SSH_HOST="93.127.216.83"
SSH_PORT="22"
SSH_USER="air_publisher_user"
REMOTE_DIR="/opt/apps/air-publisher"
BRANCH="main"

echo "Starting deployment..."

# Pull latest changes from GitHub
echo "Pulling latest changes from GitHub..."
git pull origin $BRANCH

# Build the project
echo "Building Vite application..."
npm run build

# Deploy to server using rsync
echo "Syncing files to server..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ $SSH_USER@$SSH_HOST:$REMOTE_DIR/

# SSH and restart PM2
echo "Restarting application on server..."
ssh -p $SSH_PORT $SSH_USER@$SSH_HOST << EOF
  cd $REMOTE_DIR
  npm install --production
  pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
  echo "Deployment complete!"
EOF

echo "Deployment finished successfully!"
