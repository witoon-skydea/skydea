#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting full deployment process for Skydea...${NC}"

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

# Check current Nginx configuration
echo -e "${YELLOW}Checking Nginx installation and configuration...${NC}"
$SSH_CMD "nginx -v || sudo apt-get update && sudo apt-get install -y nginx"

# Create remote directory
echo -e "${YELLOW}Creating project directory on server...${NC}"
$SSH_CMD "mkdir -p $REMOTE_DIR"

# Pack the project files for transfer
echo -e "${YELLOW}Packing project files for transfer...${NC}"
cd /Users/witoonpongsilathong/MCP_folder/mm_dev_mode/skydea
tar -czf /tmp/skydea.tar.gz --exclude=node_modules --exclude=.git .

# Transfer the project files to server
echo -e "${YELLOW}Transferring project files to server...${NC}"
scp -i $SSH_KEY /tmp/skydea.tar.gz $SSH_USER@$SERVER_IP:$REMOTE_DIR/

# Extract the project files on server
echo -e "${YELLOW}Extracting project files on server...${NC}"
$SSH_CMD "cd $REMOTE_DIR && tar -xzf skydea.tar.gz && rm skydea.tar.gz"

# Install dependencies on server
echo -e "${YELLOW}Installing dependencies on server...${NC}"
$SSH_CMD "cd $REMOTE_DIR && npm install"

# Create .env file
echo -e "${YELLOW}Setting up environment variables...${NC}"
$SSH_CMD "cat > $REMOTE_DIR/.env << EOF
PORT=$PORT
APP_BASE_PATH=$APP_BASE_PATH
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
DB_PATH=./database.sqlite
EOF"

# Set up nginx configuration
echo -e "${YELLOW}Configuring Nginx...${NC}"
$SSH_CMD "sudo bash -c 'cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    # Skydea application
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
    }
    
    # Welcome page
    location / {
        return 200 'Oracle Cloud server is running. Access Skydea at /skydea';
        add_header Content-Type text/plain;
    }
}
EOF'"

# Test and reload Nginx
echo -e "${YELLOW}Testing and reloading Nginx configuration...${NC}"
$SSH_CMD "sudo nginx -t && sudo systemctl reload nginx || sudo systemctl restart nginx"

# Install PM2 if not already installed
echo -e "${YELLOW}Setting up PM2 process manager...${NC}"
$SSH_CMD "npm list -g pm2 || npm install -g pm2"

# Start the application with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
$SSH_CMD "cd $REMOTE_DIR && pm2 delete $PROJECT_NAME 2>/dev/null || true"
$SSH_CMD "cd $REMOTE_DIR && pm2 start src/server.js --name $PROJECT_NAME -- --port $PORT"
$SSH_CMD "pm2 save"
$SSH_CMD "pm2 startup | grep -v 'sudo' || true"

# Check if application is running
echo -e "${YELLOW}Verifying application status...${NC}"
$SSH_CMD "pm2 list | grep $PROJECT_NAME"
$SSH_CMD "curl -s http://localhost:$PORT/ || echo 'Warning: Application not responding on port $PORT'"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}The application should now be available at: http://$SERVER_IP$APP_BASE_PATH${NC}"
echo -e "${YELLOW}If you encounter any issues, check the logs with:${NC}"
echo -e "${YELLOW}ssh -i $SSH_KEY $SSH_USER@$SERVER_IP \"pm2 logs $PROJECT_NAME\"${NC}"

exit 0
