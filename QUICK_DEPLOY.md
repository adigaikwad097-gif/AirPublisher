# Quick Deploy - Run These Commands

## Step 1: Sync files to server
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '*.mp4' --exclude '*.log' ./ air_publisher_user@93.127.216.83:/opt/apps/air-publisher/
```

When prompted, enter password: `App8899n@123`

## Step 2: SSH and deploy
```bash
ssh air_publisher_user@93.127.216.83
```

Password: `App8899n@123`

## Step 3: Once connected, run:
```bash
cd /opt/apps/air-publisher
npm ci
npm run build
docker-compose up -d --build
docker-compose logs -f
```

## That's it! Your app will be at: http://93.127.216.83:3003

