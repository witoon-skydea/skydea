#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting application path troubleshooting for Skydea...${NC}"

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

# Check current app configuration
echo -e "${YELLOW}Checking current app configuration...${NC}"
$SSH_CMD "cat $REMOTE_DIR/.env"
$SSH_CMD "cat $REMOTE_DIR/src/config/app.js"

# Update .env file with correct settings
echo -e "${YELLOW}Updating .env file with correct settings...${NC}"
$SSH_CMD "cat > $REMOTE_DIR/.env << EOF
PORT=$PORT
APP_BASE_PATH=$APP_BASE_PATH
NODE_ENV=production
SESSION_SECRET=$(openssl rand -base64 32)
DB_PATH=./database.sqlite
EOF"

# Check application logs for errors
echo -e "${YELLOW}Checking application logs for errors...${NC}"
$SSH_CMD "pm2 logs skydea --lines 50"

# Stop PM2 application to ensure clean restart
echo -e "${YELLOW}Stopping application for clean restart...${NC}"
$SSH_CMD "pm2 stop skydea"

# Test direct node server start to see console output
echo -e "${YELLOW}Testing direct node server start...${NC}"
$SSH_CMD "cd $REMOTE_DIR && NODE_ENV=production APP_BASE_PATH=$APP_BASE_PATH PORT=$PORT node src/server.js"

exit 0
