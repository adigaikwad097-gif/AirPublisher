# Server Setup - Install Required Tools

The server needs Node.js, npm, and Docker installed. Run these commands on the server:

## Step 1: Install Node.js and npm

```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install Docker and Docker Compose

```bash
# Install Docker
sudo apt install -y docker.io docker-compose

# Add user to docker group (so you don't need sudo)
sudo usermod -aG docker air_publisher_user

# Log out and back in for group changes to take effect
exit
# Then SSH back in: ssh air_publisher_user@93.127.216.83

# Verify Docker
docker --version
docker-compose --version
```

## Step 3: After installing, deploy the app

```bash
cd /opt/apps/air-publisher
npm ci
npm run build
docker-compose up -d --build
docker-compose logs -f
```

## Alternative: If you don't have sudo access

If you can't install these tools, we can:
1. Use a Node.js version manager (nvm) - doesn't require sudo
2. Run the app directly with Node.js (no Docker)
3. Check if there's already a setup script on the server

Let me know which approach you prefer!

