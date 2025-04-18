#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Oracle Cloud deployment for Skydea...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185"
SSH_USER="ubuntu"
PROJECT_NAME="skydea"
REMOTE_DIR="/home/ubuntu/$PROJECT_NAME"
PORT="3001"
APP_BASE_PATH="/skydea"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

# Push latest code to GitHub
echo -e "${YELLOW}Pushing latest code to GitHub...${NC}"
git add .
git commit -m "Deploy update $(date '+%Y-%m-%d %H:%M:%S')" || echo -e "${YELLOW}No changes to commit${NC}"
git push || {
    echo -e "${RED}Failed to push code to GitHub.${NC}"
    echo -e "${YELLOW}Please check remote repository settings and try again.${NC}"
    exit 1
}

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# Check if we can connect to the server
echo -e "${YELLOW}Testing SSH connection to Oracle Cloud...${NC}"
$SSH_CMD "echo Connected successfully" || {
    echo -e "${RED}Failed to connect to Oracle Cloud server.${NC}"
    echo -e "${YELLOW}Please check SSH key and server details.${NC}"
    exit 1
}

# Create or update project directory
echo -e "${YELLOW}Setting up project directory on server...${NC}"
$SSH_CMD "mkdir -p $REMOTE_DIR"

# Clone or pull the repository
echo -e "${YELLOW}Deploying code to server...${NC}"
$SSH_CMD "cd $REMOTE_DIR && if [ -d .git ]; then git fetch && git checkout feature/api-updates && git pull origin feature/api-updates; else git clone -b feature/api-updates https://github.com/witoon-skydea/skydea .; fi"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
$SSH_CMD "cd $REMOTE_DIR && npm install"

# Create .env file
echo -e "${YELLOW}Setting up environment variables...${NC}"
$SSH_CMD "cat > $REMOTE_DIR/.env << EOF
PORT=$PORT
APP_BASE_PATH=$APP_BASE_PATH
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
EOF"

# Set up PM2 for process management
echo -e "${YELLOW}Setting up PM2 process manager...${NC}"
$SSH_CMD "cd $REMOTE_DIR && npm install pm2 -g || sudo npm install pm2 -g"
$SSH_CMD "cd $REMOTE_DIR && pm2 delete $PROJECT_NAME 2>/dev/null || true"
$SSH_CMD "cd $REMOTE_DIR && pm2 start src/server.js --name $PROJECT_NAME"
$SSH_CMD "pm2 save"
$SSH_CMD "pm2 startup | tail -1"

# Update Nginx configuration
echo -e "${YELLOW}Updating Nginx configuration...${NC}"
$SSH_CMD "sudo bash -c 'cat > /etc/nginx/sites-available/skydea.conf << EOF
# skydea.conf
location /skydea/ {
    proxy_pass http://localhost:$PORT/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \\\$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \\\$host;
    proxy_set_header X-Real-IP \\\$remote_addr;
    proxy_cache_bypass \\\$http_upgrade;
}
EOF'"

# Check if Nginx configuration should be included in main config
$SSH_CMD "if ! grep -q 'include /etc/nginx/sites-available/skydea.conf;' /etc/nginx/sites-available/multi-path-apps.conf; then
    sudo sed -i '/^server {/a \    include /etc/nginx/sites-available/skydea.conf;' /etc/nginx/sites-available/multi-path-apps.conf
fi"

# Test Nginx configuration and reload
echo -e "${YELLOW}Testing and reloading Nginx configuration...${NC}"
$SSH_CMD "sudo nginx -t && sudo systemctl reload nginx"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}The application is now available at: http://$SERVER_IP$APP_BASE_PATH${NC}"

exit 0
