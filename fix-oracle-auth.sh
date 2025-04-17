#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Oracle Cloud deployment for Skydea auth fix...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185"
SSH_USER="ubuntu"
PROJECT_NAME="skydea"
REMOTE_DIR="/home/ubuntu/mm_skydea_app"
PORT="3001"
APP_BASE_PATH="/skydea"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# Check if we can connect to the server
echo -e "${YELLOW}Testing SSH connection to Oracle Cloud...${NC}"
$SSH_CMD "echo Connected successfully" || {
    echo -e "${RED}Failed to connect to Oracle Cloud server.${NC}"
    echo -e "${YELLOW}Please check SSH key and server details.${NC}"
    exit 1
}

# Pull the repository
echo -e "${YELLOW}Pulling latest code to server...${NC}"
$SSH_CMD "cd $REMOTE_DIR && git pull"

# Restart the application
echo -e "${YELLOW}Restarting the application...${NC}"
$SSH_CMD "cd $REMOTE_DIR && pm2 restart $PROJECT_NAME"

echo -e "${GREEN}Deployment of auth fix completed successfully!${NC}"
echo -e "${GREEN}You can now test the shared trip view at http://$SERVER_IP$APP_BASE_PATH/trips/1/planner?share=xVWyzF5r2i${NC}"

exit 0