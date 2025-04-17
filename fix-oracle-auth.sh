#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting fix for Skydea app on Oracle Cloud...${NC}"

# SSH key location
SSH_KEY="/Users/witoonpongsilathong/MCP_folder/oracle_mm_config/ssh-key-2025-04-03.key"
SERVER_IP="140.245.58.185"
SSH_USER="ubuntu"
PROJECT_NAME="skydea"
REMOTE_DIR="/home/ubuntu/$PROJECT_NAME"

# Prepare SSH command
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

# Check if we can connect to the server
echo -e "${YELLOW}Testing SSH connection to Oracle Cloud...${NC}"
$SSH_CMD "echo Connected successfully" || {
    echo -e "${RED}Failed to connect to Oracle Cloud server.${NC}"
    echo -e "${YELLOW}Please check SSH key and server details.${NC}"
    exit 1
}

# First, let's backup the current code on the server
echo -e "${YELLOW}Creating a backup of the current code on the server...${NC}"
$SSH_CMD "cd $REMOTE_DIR && cp -r src src_backup_$(date +%Y%m%d%H%M%S)"

# Create a new version of auth.js with explicit export of each function
echo -e "${YELLOW}Creating fixed auth.js file...${NC}"

# Create the fixed auth.js file locally
cat > /tmp/auth.js.fixed << 'EOF'
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middlewares/auth');

// Force explicit check that controller functions exist
if (typeof authController.showLogin !== 'function') {
  console.error('ERROR: authController.showLogin is not a function');
  throw new Error('authController.showLogin is not a function');
}

if (typeof authController.showRegister !== 'function') {
  console.error('ERROR: authController.showRegister is not a function');
  throw new Error('authController.showRegister is not a function');
}

if (typeof authController.login !== 'function') {
  console.error('ERROR: authController.login is not a function');
  throw new Error('authController.login is not a function');
}

if (typeof authController.register !== 'function') {
  console.error('ERROR: authController.register is not a function');
  throw new Error('authController.register is not a function');
}

if (typeof authController.logout !== 'function') {
  console.error('ERROR: authController.logout is not a function');
  throw new Error('authController.logout is not a function');
}

// Show login page (guests only)
router.get('/login', isGuest, authController.showLogin);

// Show registration page (guests only)
router.get('/register', isGuest, authController.showRegister);

// Process login form submission
router.post('/login', isGuest, authController.login);

// Process registration form submission
router.post('/register', isGuest, authController.register);

// Process logout
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;
EOF

# Transfer the fixed file to the server
echo -e "${YELLOW}Transferring the fixed file to the server...${NC}"
scp -i "$SSH_KEY" /tmp/auth.js.fixed "$SSH_USER@$SERVER_IP:$REMOTE_DIR/src/routes/auth.js"

# Now let's sync the controllers directory from local to server
echo -e "${YELLOW}Syncing controllers directory from local to server...${NC}"
rsync -avz -e "ssh -i $SSH_KEY" "/Users/witoonpongsilathong/MCP_folder/mm_dev_mode/skydea/src/controllers/" "$SSH_USER@$SERVER_IP:$REMOTE_DIR/src/controllers/"

# Restart the application
echo -e "${YELLOW}Restarting the application...${NC}"
$SSH_CMD "cd $REMOTE_DIR && pm2 restart skydea_new_run1 || pm2 start src/server.js --name skydea_new_run1"

# Check the status
echo -e "${YELLOW}Checking application status...${NC}"
$SSH_CMD "pm2 list | grep skydea"

echo -e "${GREEN}Fix applied successfully! Check the application logs for any errors:${NC}"
echo -e "${YELLOW}$SSH_CMD \"pm2 logs skydea_new_run1\"${NC}"

exit 0