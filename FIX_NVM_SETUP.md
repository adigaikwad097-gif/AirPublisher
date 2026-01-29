# Fix nvm Setup

**Run these commands on the server:**

```bash
# 1. Load nvm manually (since bashrc doesn't exist)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2. If that doesn't work, try the path where it was installed
export NVM_DIR="/opt/apps/air-publisher/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. Create bashrc file for future sessions
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> ~/.bashrc

# 4. Now install Node.js
nvm install 20
nvm use 20

# 5. Verify
node --version
npm --version

# 6. Continue with app setup
cd /opt/apps/air-publisher
npm ci
npm run build
npm install -g pm2
PORT=3003 NEXT_PUBLIC_APP_URL=http://93.127.216.83:3003 pm2 start npm --name "air-publisher" -- start
pm2 save
pm2 status
```

