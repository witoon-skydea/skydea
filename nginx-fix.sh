#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx configuration diagnosis and fix for Skydea...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185"
SSH_USER="ubuntu"
PROJECT_NAME="skydea"
REMOTE_DIR="/home/ubuntu/$PROJECT_NAME"
PORT="3001"
APP_BASE_PATH="/skydea"

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# Check if we can connect to the server
echo -e "${YELLOW}Testing SSH connection to Oracle Cloud...${NC}"
$SSH_CMD "echo Connected successfully" || {
    echo -e "${RED}Failed to connect to Oracle Cloud server.${NC}"
    echo -e "${YELLOW}Please check SSH key and server details.${NC}"
    exit 1
}

# Display current Nginx configuration
echo -e "${YELLOW}Checking current Nginx configuration...${NC}"
$SSH_CMD "echo 'Current multi-path-apps.conf:'; sudo cat /etc/nginx/sites-available/multi-path-apps.conf"
$SSH_CMD "echo 'Checking for skydea.conf:'; ls -la /etc/nginx/sites-available/skydea.conf 2>/dev/null || echo 'skydea.conf not found'"
$SSH_CMD "if [ -f /etc/nginx/sites-available/skydea.conf ]; then echo 'Content of skydea.conf:'; sudo cat /etc/nginx/sites-available/skydea.conf; fi"

# Check if application is running
echo -e "${YELLOW}Checking if application is running...${NC}"
$SSH_CMD "ps aux | grep 'node.*skydea' | grep -v grep || echo 'App not running'"
$SSH_CMD "echo 'PM2 processes:'; pm2 list || echo 'PM2 not installed or not running'"

# Check for available Node.js applications
$SSH_CMD "echo 'Running Node.js applications:'; sudo netstat -tuln | grep LISTEN | grep -E ':(3000|3001|3002|8080)'"

# Log files check
echo -e "${YELLOW}Checking Nginx error logs...${NC}"
$SSH_CMD "echo 'Last 20 lines of Nginx error log:'; sudo tail -n 20 /var/log/nginx/error.log"

# Fix Nginx configuration
echo -e "${YELLOW}Creating comprehensive Nginx configuration...${NC}"
$SSH_CMD "sudo bash -c 'cat > /etc/nginx/sites-available/skydea.conf << EOF
# Skydea application Nginx configuration
location /skydea/ {
    proxy_pass http://localhost:$PORT/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \\\$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \\\$host;
    proxy_set_header X-Real-IP \\\$remote_addr;
    proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \\\$scheme;
    proxy_cache_bypass \\\$http_upgrade;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Static files handling for skydea
location /skydea/public/ {
    alias /home/ubuntu/skydea/public/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    
    # Serve pre-compressed gzip files if available
    gzip_static on;
    
    # Fallback if the file doesn't exist
    try_files \\\$uri \\\$uri/ @skydea;
}

# Fallback location for skydea
location @skydea {
    proxy_pass http://localhost:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \\\$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \\\$host;
    proxy_set_header X-Real-IP \\\$remote_addr;
    proxy_cache_bypass \\\$http_upgrade;
}
EOF'"

# Ensure configuration is included in the main file
echo -e "${YELLOW}Ensuring configuration is included in main Nginx config...${NC}"
$SSH_CMD "if ! sudo grep -q 'include /etc/nginx/sites-available/skydea.conf;' /etc/nginx/sites-available/multi-path-apps.conf; then
    sudo sed -i '/^server {/a \    include /etc/nginx/sites-available/skydea.conf;' /etc/nginx/sites-available/multi-path-apps.conf
    echo 'Added include directive to multi-path-apps.conf'
else
    echo 'Include directive already exists in multi-path-apps.conf'
fi"

# Check if server block exists
$SSH_CMD "if ! sudo grep -q 'server {' /etc/nginx/sites-available/multi-path-apps.conf; then
    sudo bash -c 'cat > /etc/nginx/sites-available/multi-path-apps.conf << EOF
server {
    listen 80;
    server_name _;
    
    include /etc/nginx/sites-available/skydea.conf;
    
    location / {
        return 200 \"Oracle Cloud server is running. Use specific application paths.\";
        add_header Content-Type text/plain;
    }
}
EOF'
    echo 'Created new server block in multi-path-apps.conf'
else
    echo 'Server block already exists in multi-path-apps.conf'
fi"

# Check Nginx configuration and restart
echo -e "${YELLOW}Testing and restarting Nginx...${NC}"
$SSH_CMD "sudo nginx -t && sudo systemctl restart nginx || { echo 'Nginx config test failed'; exit 1; }"

# Check Nginx configuration links
echo -e "${YELLOW}Checking Nginx sites-enabled...${NC}"
$SSH_CMD "ls -la /etc/nginx/sites-enabled/ && echo 'Ensuring multi-path-apps.conf is enabled...' && sudo ln -sf /etc/nginx/sites-available/multi-path-apps.conf /etc/nginx/sites-enabled/ 2>/dev/null || echo 'Already linked'"

# Restart application
echo -e "${YELLOW}Restarting Skydea application...${NC}"
$SSH_CMD "cd $REMOTE_DIR && if command -v pm2 &> /dev/null; then
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    pm2 start src/server.js --name $PROJECT_NAME --env production
    pm2 save
else
    npm install pm2 -g
    pm2 start src/server.js --name $PROJECT_NAME --env production
    pm2 save
fi"

# Set environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
$SSH_CMD "cat > $REMOTE_DIR/.env << EOF
PORT=$PORT
APP_BASE_PATH=$APP_BASE_PATH
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
EOF"

# Check if application is now running
echo -e "${YELLOW}Verifying application is running...${NC}"
$SSH_CMD "ps aux | grep 'node.*skydea' | grep -v grep || echo 'Warning: App still not running'"
$SSH_CMD "pm2 list | grep $PROJECT_NAME || echo 'Warning: PM2 not showing app'"
$SSH_CMD "sudo netstat -tuln | grep LISTEN | grep -E ':$PORT' || echo 'Warning: Port $PORT not in use'"

echo -e "${GREEN}Configuration update completed.${NC}"
echo -e "${GREEN}Please try accessing the application at: http://$SERVER_IP$APP_BASE_PATH${NC}"
echo -e "${YELLOW}If you still experience issues, please run this command for debugging:${NC}"
echo -e "${YELLOW}ssh -i $SSH_KEY $SSH_USER@$SERVER_IP \"sudo journalctl -u nginx -n 50\"${NC}"

exit 0
