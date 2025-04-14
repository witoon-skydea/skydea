#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ultimate Nginx configuration fix for Skydea...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185" 
SSH_USER="ubuntu"
PORT="3001"
APP_BASE_PATH="/skydea"

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# COMPLETELY reset Nginx
echo -e "${YELLOW}COMPLETELY resetting Nginx configuration...${NC}"
$SSH_CMD "sudo systemctl stop nginx"
$SSH_CMD "sudo rm -f /etc/nginx/sites-enabled/*"
$SSH_CMD "sudo rm -f /etc/nginx/sites-available/skydea.conf"
$SSH_CMD "sudo rm -f /etc/nginx/sites-available/multi-path-apps.conf"

# Create a single, clean default configuration
echo -e "${YELLOW}Creating single, clean default configuration...${NC}"
$SSH_CMD "sudo bash -c 'cat > /etc/nginx/sites-available/default << \"EOF\"
# Default server configuration
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    server_name _;

    # Skydea application
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

    # Default location
    location / {
        try_files \\\$uri \\\$uri/ =404;
    }
}
EOF'"

# Enable the default configuration only
echo -e "${YELLOW}Enabling only the default configuration...${NC}"
$SSH_CMD "sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default"

# Test and start Nginx
echo -e "${YELLOW}Testing and starting Nginx...${NC}"
$SSH_CMD "sudo nginx -t && sudo systemctl start nginx"

# Verify Nginx status
echo -e "${YELLOW}Verifying Nginx status...${NC}"
$SSH_CMD "sudo systemctl status nginx | grep Active"

# Restart the application
echo -e "${YELLOW}Restarting Skydea application...${NC}"
$SSH_CMD "pm2 restart skydea"
$SSH_CMD "pm2 list | grep skydea"

echo -e "${GREEN}Nginx configuration has been completely reset!${NC}"
echo -e "${GREEN}Please try accessing the application again at: http://$SERVER_IP$APP_BASE_PATH${NC}"
echo -e "${YELLOW}This is the final attempt to fix the issue.${NC}"

exit 0
