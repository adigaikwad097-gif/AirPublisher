#!/bin/bash

# AIR Publisher Deployment Script
# Server: 93.127.216.83
# User: air_publisher_user
# Port: 3003

set -e

echo "🚀 Starting AIR Publisher Deployment..."

# Server details
SERVER="air_publisher_user@93.127.216.83"
APP_DIR="/opt/apps/air-publisher"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Syncing files to server...${NC}"
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude '*.mp4' --exclude '*.log' \
  ./ ${SERVER}:${APP_DIR}/

echo -e "${GREEN}✅ Files synced${NC}"

echo -e "${YELLOW}Step 2: Connecting to server and deploying...${NC}"

ssh ${SERVER} << 'ENDSSH'
cd /opt/apps/air-publisher

echo "📦 Installing dependencies..."
npm ci

echo "🏗️  Building application..."
npm run build

echo "🐳 Starting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "📋 Checking container status..."
docker-compose ps

echo "📝 Recent logs:"
docker-compose logs --tail=50

echo "✅ Deployment complete!"
ENDSSH

echo -e "${GREEN}🎉 Deployment finished!${NC}"
echo -e "${YELLOW}Your app should be available at: http://93.127.216.83:3003${NC}"

