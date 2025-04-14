#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx configuration fix for Skydea...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185" 
SSH_USER="ubuntu"
PORT="3001"
APP_BASE_PATH="/skydea"

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# Fix Nginx configuration
echo -e "${YELLOW}Fixing Nginx configuration...${NC}"
$SSH_CMD "sudo bash -c 'cat > /etc/nginx/conf.d/skydea.conf << EOF
# Skydea application Nginx configuration
server {
    listen 80;
    server_name _;
    
    location /skydea/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }
    
    location / {
        root /var/www/html;
        try_files \\\$uri \\\$uri/ =404;
    }
}
EOF'"

# Test and restart Nginx
echo -e "${YELLOW}Testing and restarting Nginx configuration...${NC}"
$SSH_CMD "sudo nginx -t && sudo systemctl restart nginx || { echo 'Nginx config test failed'; exit 1; }"

# Verify Nginx status
echo -e "${YELLOW}Verifying Nginx status...${NC}"
$SSH_CMD "sudo systemctl status nginx | grep Active"

# Check if application is running
echo -e "${YELLOW}Verifying PM2 application status...${NC}"
$SSH_CMD "pm2 list | grep skydea"

echo -e "${GREEN}Nginx configuration should now be fixed!${NC}"
echo -e "${GREEN}Please try accessing the application again at: http://$SERVER_IP$APP_BASE_PATH${NC}"

exit 0
